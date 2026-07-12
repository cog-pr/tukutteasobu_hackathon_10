import { DurableObject } from "cloudflare:workers";
import { CHALLENGE_CONFIG, GAME_CONFIG } from "../../shared/constants";
import { assignAnswerOrder } from "../../shared/game/assignAnswerOrder";
import { countVotes } from "../../shared/game/countVotes";
import { getGameResult } from "../../shared/game/getGameResult";
import { isGameStarted } from "../../shared/game/isGameStarted";
import { resolveRoundWinner } from "../../shared/game/resolveRoundWinner";
import { selectNextChallenger } from "../../shared/game/selectNextChallenger";
import { selectNextPrompt } from "../../shared/game/selectNextPrompt";
import { toPublicRoomState } from "../../shared/game/toPublicRoomState";
import { validateRevengeProgress } from "../../shared/game/validateRevengeProgress";
import type { GetRoomResponse } from "../../shared/types/api";
import type { ChallengeResult, Player, RoomState, RoundHistoryEntry, RoundState, VoteChoice } from "../../shared/types/game";
import type { ServerMessage } from "../../shared/types/messages";
import { validateAnswer } from "../../shared/validation/answer";
import { validateClientMessage } from "../../shared/validation/clientMessage";
import { prompts } from "../lib/prompts";
import { generatePlayerId, generatePlayerToken } from "../lib/playerAuth";
import { generateAiAnswer } from "../services/ai";
import type { CreateRoomResult, JoinRoomResult } from "../types/rooms";
import type { Env } from "../types/env";

// GameRoom内部だけで保持する状態。playerTokenはPublicRoomStateへ含めない。
export type PersistedRoom = {
  room: RoomState;
  playerTokens: Record<string, string>;
};

export const ROOM_STORAGE_KEY = "room";

function createInitialRoomState(roomCode: string): RoomState {
  const now = Date.now();

  return {
    version: 1,
    roomCode,
    phase: "LOBBY",
    players: [],
    score: { human: 0, ai: 0 },
    round: null,
    challengerQueue: [],
    usedPromptIds: [],
    deadlineAt: null,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createPlayer(name: string, joinOrder: number, isHost: boolean): Player {
  return {
    id: generatePlayerId(),
    name,
    joinOrder,
    isHost,
    isOnline: false,
    isReady: false,
    supportedChallenges: [],
  };
}

function createRoundState(roundNumber: number, challengerId: string, prompt: RoundState["prompt"]): RoundState {
  return {
    roundNumber,
    challengerId,
    prompt,
    humanAnswer: null,
    aiAnswer: null,
    answerOrder: null,
    votes: {},
    winner: null,
    challengeType: null,
    challengeResult: null,
    isForfeit: false,
    challengeProgress: 0,
    challengeProgressUpdatedAt: null,
  };
}

function buildHistoryEntry(room: RoomState, wentToRevenge: boolean, revengeResult: ChallengeResult | null): RoundHistoryEntry {
  const round = room.round;
  if (!round) throw new Error("Cannot build a history entry without an active round");

  const challengerName = room.players.find((player) => player.id === round.challengerId)?.name ?? "";
  const { countA, countB } = countVotes(round.votes);

  return {
    roundNumber: round.roundNumber,
    challengerId: round.challengerId,
    challengerName,
    prompt: round.prompt,
    humanAnswer: round.humanAnswer,
    aiAnswer: round.aiAnswer,
    answerOrder: round.answerOrder,
    voteCounts: { A: countA, B: countB },
    winner: round.winner ?? "ai",
    isForfeit: round.isForfeit,
    wentToRevenge,
    revengeResult,
  };
}

export class GameRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }

    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    const playerToken = url.searchParams.get("playerToken");
    if (!playerId || !playerToken) return new Response("Authentication required", { status: 401 });

    const stored = await this.load();
    if (!stored) return new Response("Room not found", { status: 404 });
    if (!stored.room.players.some((player) => player.id === playerId) || stored.playerTokens[playerId] !== playerToken) {
      return new Response("Authentication failed", { status: 401 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId });
    const room = await this.updateOnline(playerId, true);
    server.send(JSON.stringify({ type: "STATE_SYNC", state: toPublicRoomState({ room, viewerId: playerId }) } satisfies ServerMessage));
    await this.broadcastState(room, server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const playerId = this.getAttachedPlayerId(ws);
    if (!playerId) return this.sendError(ws, "UNAUTHENTICATED", "接続情報を確認できません。");

    let input: unknown;
    try {
      input = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return this.sendError(ws, "INVALID_MESSAGE", "メッセージが正しいJSONではありません。");
    }
    const validation = validateClientMessage(input);
    if (!validation.valid) return this.sendError(ws, "INVALID_MESSAGE", validation.message);

    switch (validation.value.type) {
      case "PING":
        return this.handlePing(ws);
      case "READY":
        return this.handleReady(ws, playerId, validation.value.ready);
      case "START_GAME":
        return this.handleStartGame(ws, playerId);
      case "SUBMIT_ANSWER":
        return this.handleSubmitAnswer(ws, playerId, validation.value.answer);
      case "CAST_VOTE":
        return this.handleCastVote(ws, playerId, validation.value.choice);
      case "REVENGE_PROGRESS":
        return this.handleRevengeProgress(ws, playerId, validation.value.value);
      case "REVENGE_RESULT":
        return this.handleRevengeResult(ws, playerId);
      case "REMATCH":
        return this.handleRematch(ws, playerId);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.disconnect(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.disconnect(ws);
  }

  async alarm(): Promise<void> {
    const stored = await this.load();
    if (!stored) return;
    const { room } = stored;
    if (room.deadlineAt === null || Date.now() < room.deadlineAt) return;

    switch (room.phase) {
      case "ROUND_INTRO":
        return this.advanceToAnswering(stored);
      case "ANSWERING":
        return this.finishAnswering(stored, "timeout");
      case "VOTING":
        return this.finishVoting(stored, "timeout");
      case "REVEAL":
        return this.advanceAfterReveal(stored);
      case "REVENGE_ACTIVE":
        return this.finishRevengeOnTimeout(stored);
      case "ROUND_RESULT":
        return this.advanceAfterRoundResult(stored);
      case "LOBBY":
      case "GAME_RESULT":
        return;
    }
  }

  async getState(roomCode: string): Promise<RoomState> {
    const existing = await this.load();
    if (existing) {
      return existing.room;
    }

    const room = createInitialRoomState(roomCode);
    await this.persist({ room, playerTokens: {} });
    return room;
  }

  async createRoom(roomCode: string, playerName: string): Promise<CreateRoomResult> {
    const existing = await this.load();
    if (existing) {
      return { ok: false, code: "ROOM_CODE_TAKEN" };
    }

    const host = createPlayer(playerName, 0, true);
    const playerToken = generatePlayerToken();
    const room: RoomState = { ...createInitialRoomState(roomCode), players: [host] };

    await this.persist({ room, playerTokens: { [host.id]: playerToken } });

    return { ok: true, room, playerId: host.id, playerToken };
  }

  async joinRoom(playerName: string): Promise<JoinRoomResult> {
    const stored = await this.load();
    if (!stored) {
      return { ok: false, code: "ROOM_NOT_FOUND" };
    }

    const { room, playerTokens } = stored;

    if (room.players.length >= GAME_CONFIG.maxPlayers) {
      return { ok: false, code: "ROOM_FULL" };
    }

    if (isGameStarted(room.phase)) {
      return { ok: false, code: "GAME_ALREADY_STARTED" };
    }

    if (room.players.some((player) => player.name.trim() === playerName.trim())) {
      return { ok: false, code: "NAME_ALREADY_USED" };
    }

    const player = createPlayer(playerName, room.players.length, false);
    const playerToken = generatePlayerToken();

    const updatedRoom: RoomState = {
      ...room,
      players: [...room.players, player],
      version: room.version + 1,
      updatedAt: Date.now(),
    };

    await this.persist({
      room: updatedRoom,
      playerTokens: { ...playerTokens, [player.id]: playerToken },
    });
    await this.broadcastState(updatedRoom);

    return { ok: true, room: updatedRoom, playerId: player.id, playerToken };
  }

  async getRoomInfo(): Promise<GetRoomResponse> {
    const stored = await this.load();
    if (!stored) {
      return { exists: false, canJoin: false, playerCount: 0, hasStarted: false };
    }

    const { room } = stored;
    const hasStarted = isGameStarted(room.phase);
    const playerCount = room.players.length;
    const canJoin = !hasStarted && playerCount < GAME_CONFIG.maxPlayers;

    return { exists: true, canJoin, playerCount, hasStarted };
  }

  // ---- WebSocketメッセージハンドラ ----

  private handlePing(ws: WebSocket): void {
    ws.send(JSON.stringify({ type: "PONG" } satisfies ServerMessage));
  }

  private async handleReady(ws: WebSocket, playerId: string, ready: boolean): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const player = stored.room.players.find((candidate) => candidate.id === playerId);
    if (!player) return this.sendError(ws, "PLAYER_NOT_FOUND", "プレイヤーが見つかりません。");
    if (player.isReady === ready) return;

    const room: RoomState = {
      ...stored.room,
      players: stored.room.players.map((candidate) => (candidate.id === playerId ? { ...candidate, isReady: ready } : candidate)),
      version: stored.room.version + 1,
      updatedAt: Date.now(),
    };
    await this.commit(stored, room);
  }

  private async handleStartGame(ws: WebSocket, playerId: string): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "LOBBY") return this.sendError(ws, "INVALID_PHASE", "ゲームはすでに開始されています。");
    const sender = room.players.find((player) => player.id === playerId);
    if (!sender) return this.sendError(ws, "PLAYER_NOT_FOUND", "プレイヤーが見つかりません。");
    if (!sender.isHost) return this.sendError(ws, "NOT_HOST", "ホストだけがゲームを開始できます。");
    if (room.players.length < GAME_CONFIG.minPlayers) return this.sendError(ws, "NOT_ENOUGH_PLAYERS", "4人揃うまでゲームを開始できません。");
    if (room.players.some((player) => !player.isOnline)) return this.sendError(ws, "PLAYER_OFFLINE", "オフラインのプレイヤーがいます。");
    if (room.players.some((player) => !player.isReady)) return this.sendError(ws, "PLAYER_NOT_READY", "準備ができていないプレイヤーがいます。");

    const { nextChallengerId, challengerQueue } = selectNextChallenger({ players: room.players, challengerQueue: [] });
    if (!nextChallengerId) return this.sendError(ws, "NOT_ENOUGH_PLAYERS", "挑戦者を選べませんでした。");
    const promptResult = selectNextPrompt({ prompts, usedPromptIds: [] });
    if (!promptResult.ok) return this.sendError(ws, "NO_PROMPTS_AVAILABLE", "お題がありません。");

    const now = Date.now();
    const updatedRoom: RoomState = {
      ...room,
      phase: "ROUND_INTRO",
      score: { human: 0, ai: 0 },
      history: [],
      round: createRoundState(1, nextChallengerId, promptResult.prompt),
      challengerQueue,
      usedPromptIds: promptResult.usedPromptIds,
      deadlineAt: now + GAME_CONFIG.roundIntroDwellMs,
      version: room.version + 1,
      updatedAt: now,
    };
    await this.commit(stored, updatedRoom);
  }

  private async handleSubmitAnswer(ws: WebSocket, playerId: string, answer: string): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "ANSWERING" || !room.round) return this.sendError(ws, "INVALID_PHASE", "今は回答できません。");
    if (room.round.challengerId !== playerId) return this.sendError(ws, "NOT_CHALLENGER", "挑戦者だけが回答できます。");
    if (room.round.humanAnswer !== null) return this.sendError(ws, "ALREADY_ANSWERED", "すでに回答しています。");
    if (room.deadlineAt !== null && Date.now() > room.deadlineAt) return this.sendError(ws, "DEADLINE_EXCEEDED", "回答時間が終了しています。");
    // クライアント側でも検証済みだが、サーバー側でも必ず再検証する。
    const validation = validateAnswer(answer);
    if (!validation.valid) return this.sendError(ws, "INVALID_MESSAGE", validation.message);

    const now = Date.now();
    const updatedRound: RoundState = { ...room.round, humanAnswer: validation.value };
    const updatedRoom: RoomState = { ...room, round: updatedRound, version: room.version + 1, updatedAt: now };

    if (updatedRound.aiAnswer !== null) {
      await this.finishAnswering({ ...stored, room: updatedRoom }, "both-ready");
      return;
    }

    await this.commit(stored, updatedRoom);
  }

  private async handleCastVote(ws: WebSocket, playerId: string, choice: VoteChoice): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "VOTING" || !room.round) return this.sendError(ws, "INVALID_PHASE", "今は投票できません。");
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player) return this.sendError(ws, "PLAYER_NOT_FOUND", "プレイヤーが見つかりません。");
    if (playerId === room.round.challengerId) return this.sendError(ws, "CHALLENGER_CANNOT_VOTE", "挑戦者は投票できません。");
    if (!player.isOnline) return this.sendError(ws, "PLAYER_OFFLINE", "オフラインのため投票できません。");
    if (playerId in room.round.votes) return this.sendError(ws, "ALREADY_VOTED", "すでに投票しています。");
    if (room.deadlineAt !== null && Date.now() > room.deadlineAt) return this.sendError(ws, "DEADLINE_EXCEEDED", "投票時間が終了しています。");

    const now = Date.now();
    const updatedVotes = { ...room.round.votes, [playerId]: choice };
    const updatedRound: RoundState = { ...room.round, votes: updatedVotes };
    const updatedRoom: RoomState = { ...room, round: updatedRound, version: room.version + 1, updatedAt: now };

    const eligibleVoterIds = room.players.filter((candidate) => candidate.isOnline && candidate.id !== room.round?.challengerId).map((candidate) => candidate.id);
    const allVoted = eligibleVoterIds.every((id) => id in updatedVotes);

    if (allVoted) {
      await this.finishVoting({ ...stored, room: updatedRoom }, "all-voted");
      return;
    }

    await this.commit(stored, updatedRoom);
  }

  private async handleRevengeProgress(ws: WebSocket, playerId: string, value: number): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "REVENGE_ACTIVE" || !room.round) return this.sendError(ws, "INVALID_PHASE", "今は挽回チャレンジ中ではありません。");
    if (room.round.challengerId !== playerId) return this.sendError(ws, "NOT_CHALLENGER", "挑戦者だけが操作できます。");
    if (room.deadlineAt !== null && Date.now() > room.deadlineAt) return this.sendError(ws, "DEADLINE_EXCEEDED", "挑戦時間が終了しています。");

    const now = Date.now();
    const challengeStartedAt = room.deadlineAt !== null ? room.deadlineAt - CHALLENGE_CONFIG.rapidTap.durationMs : now;
    const previousUpdatedAt = room.round.challengeProgressUpdatedAt ?? challengeStartedAt;
    const elapsedMs = now - previousUpdatedAt;

    if (!validateRevengeProgress({ previousValue: room.round.challengeProgress, nextValue: value, elapsedMs })) {
      return this.sendError(ws, "INVALID_MESSAGE", "不正な進捗値です。");
    }

    const updatedRound: RoundState = { ...room.round, challengeProgress: value, challengeProgressUpdatedAt: now };
    const updatedRoom: RoomState = { ...room, round: updatedRound, version: room.version + 1, updatedAt: now };
    await this.commit(stored, updatedRoom);
  }

  private async handleRevengeResult(ws: WebSocket, playerId: string): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "REVENGE_ACTIVE" || !room.round) return this.sendError(ws, "INVALID_PHASE", "今は挽回チャレンジ中ではありません。");
    if (room.round.challengerId !== playerId) return this.sendError(ws, "NOT_CHALLENGER", "挑戦者だけが操作できます。");
    if (room.deadlineAt !== null && Date.now() > room.deadlineAt) return this.sendError(ws, "DEADLINE_EXCEEDED", "挑戦時間が終了しています。");

    // クライアントが申告する成功/失敗は信用せず、サーバーが追跡した進捗だけで判定する。
    const succeeded = room.round.challengeProgress >= CHALLENGE_CONFIG.rapidTap.requiredCount;
    await this.finishRevenge(stored, succeeded ? "success" : "failure");
  }

  private async handleRematch(ws: WebSocket, playerId: string): Promise<void> {
    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const { room } = stored;

    if (room.phase !== "GAME_RESULT") return this.sendError(ws, "INVALID_PHASE", "ゲーム終了後だけ再戦できます。");
    const sender = room.players.find((player) => player.id === playerId);
    if (!sender?.isHost) return this.sendError(ws, "NOT_HOST", "ホストだけが再戦できます。");

    const now = Date.now();
    const updatedRoom: RoomState = {
      ...room,
      phase: "LOBBY",
      score: { human: 0, ai: 0 },
      round: null,
      challengerQueue: [],
      usedPromptIds: [],
      deadlineAt: null,
      history: [],
      players: room.players.map((player) => ({ ...player, isReady: false })),
      version: room.version + 1,
      updatedAt: now,
    };
    await this.commit(stored, updatedRoom);
  }

  // ---- フェーズ終了処理(アラーム発火 / 早期完了の両方から呼ばれる) ----

  private async advanceToAnswering(stored: PersistedRoom): Promise<void> {
    const now = Date.now();
    const room: RoomState = { ...stored.room, phase: "ANSWERING", deadlineAt: now + GAME_CONFIG.answerTimeMs, version: stored.room.version + 1, updatedAt: now };
    await this.commit(stored, room);

    const roundNumber = room.round?.roundNumber;
    if (roundNumber !== undefined) {
      this.ctx.waitUntil(this.generateAiAnswerAndPersist(roundNumber).catch(() => {}));
    }
  }

  private async generateAiAnswerAndPersist(roundNumber: number): Promise<void> {
    const seed = await this.load();
    if (!seed || seed.room.phase !== "ANSWERING" || seed.room.round?.roundNumber !== roundNumber) return;

    const result = await generateAiAnswer({ prompt: seed.room.round.prompt.text }, this.env);

    const stored = await this.load();
    if (!stored || stored.room.phase !== "ANSWERING" || stored.room.round?.roundNumber !== roundNumber || stored.room.round.aiAnswer !== null) return;

    const now = Date.now();
    const updatedRound: RoundState = { ...stored.room.round, aiAnswer: result.answer };
    const updatedRoom: RoomState = { ...stored.room, round: updatedRound, version: stored.room.version + 1, updatedAt: now };

    if (updatedRound.humanAnswer !== null) {
      await this.finishAnswering({ ...stored, room: updatedRoom }, "both-ready");
      return;
    }

    await this.commit(stored, updatedRoom);
  }

  private async finishAnswering(stored: PersistedRoom, reason: "both-ready" | "timeout"): Promise<void> {
    const { room } = stored;
    const round = room.round;
    if (!round) return;
    const now = Date.now();

    if (reason === "timeout" && round.humanAnswer === null) {
      // 不戦敗: 制限時間内に人間が回答しなかった場合はAIの勝利として投票をスキップする。
      const updatedRound: RoundState = { ...round, isForfeit: true, winner: "ai" };
      const updatedRoom: RoomState = { ...room, round: updatedRound, phase: "REVEAL", deadlineAt: now + GAME_CONFIG.revealDwellMs, version: room.version + 1, updatedAt: now };
      await this.commit(stored, updatedRoom);
      return;
    }

    if (reason === "timeout" && round.aiAnswer === null) {
      // 人間は回答済みだがAIがまだ解決していない場合。aiTimeoutMsはanswerTimeMsよりずっと短いため
      // ほぼ発生しないはずだが、念のため人間を不戦敗にはせず、AI応答の完了(generateAiAnswerAndPersist)を待つ。
      return;
    }

    const updatedRound: RoundState = { ...round, answerOrder: assignAnswerOrder() };
    const updatedRoom: RoomState = { ...room, round: updatedRound, phase: "VOTING", deadlineAt: now + GAME_CONFIG.voteTimeMs, version: room.version + 1, updatedAt: now };
    await this.commit(stored, updatedRoom);
  }

  private async finishVoting(stored: PersistedRoom, _reason: "all-voted" | "timeout"): Promise<void> {
    const { room } = stored;
    const round = room.round;
    if (!round || !round.answerOrder) return;

    const { winner } = resolveRoundWinner({ votes: round.votes, answerOrder: round.answerOrder });
    const now = Date.now();
    const updatedRound: RoundState = { ...round, winner };
    const updatedRoom: RoomState = { ...room, round: updatedRound, phase: "REVEAL", deadlineAt: now + GAME_CONFIG.revealDwellMs, version: room.version + 1, updatedAt: now };
    await this.commit(stored, updatedRoom);
  }

  private async advanceAfterReveal(stored: PersistedRoom): Promise<void> {
    const { room } = stored;
    const round = room.round;
    if (!round) return;
    const now = Date.now();

    if (round.winner === "human") {
      const historyEntry = buildHistoryEntry(room, false, null);
      const updatedRoom: RoomState = {
        ...room,
        score: { ...room.score, human: room.score.human + 1 },
        history: [...room.history, historyEntry],
        phase: "ROUND_RESULT",
        deadlineAt: now + GAME_CONFIG.roundResultMs,
        version: room.version + 1,
        updatedAt: now,
      };
      await this.commit(stored, updatedRoom);
      return;
    }

    // AIの勝利(不戦敗を含む) -> 挽回チャレンジへ。
    const updatedRound: RoundState = { ...round, challengeType: "rapid_tap", challengeProgress: 0, challengeProgressUpdatedAt: now };
    const updatedRoom: RoomState = { ...room, round: updatedRound, phase: "REVENGE_ACTIVE", deadlineAt: now + CHALLENGE_CONFIG.rapidTap.durationMs, version: room.version + 1, updatedAt: now };
    await this.commit(stored, updatedRoom);
  }

  private async finishRevengeOnTimeout(stored: PersistedRoom): Promise<void> {
    const round = stored.room.round;
    if (!round) return;
    const succeeded = round.challengeProgress >= CHALLENGE_CONFIG.rapidTap.requiredCount;
    await this.finishRevenge(stored, succeeded ? "success" : "failure");
  }

  private async finishRevenge(stored: PersistedRoom, outcome: ChallengeResult): Promise<void> {
    const { room } = stored;
    const round = room.round;
    if (!round) return;

    const now = Date.now();
    const updatedRound: RoundState = { ...round, challengeResult: outcome };
    const scoreKey = outcome === "success" ? "human" : "ai";
    const historyEntry = buildHistoryEntry({ ...room, round: updatedRound }, true, outcome);
    const updatedRoom: RoomState = {
      ...room,
      round: updatedRound,
      score: { ...room.score, [scoreKey]: room.score[scoreKey] + 1 },
      history: [...room.history, historyEntry],
      phase: "ROUND_RESULT",
      deadlineAt: now + GAME_CONFIG.roundResultMs,
      version: room.version + 1,
      updatedAt: now,
    };
    await this.commit(stored, updatedRoom);
  }

  private async advanceAfterRoundResult(stored: PersistedRoom): Promise<void> {
    const { room } = stored;
    const result = getGameResult(room.score);
    const now = Date.now();

    if (result.finished) {
      const updatedRoom: RoomState = { ...room, phase: "GAME_RESULT", deadlineAt: null, version: room.version + 1, updatedAt: now };
      await this.commit(stored, updatedRoom);
      return;
    }

    const { nextChallengerId, challengerQueue } = selectNextChallenger({
      players: room.players,
      challengerQueue: room.challengerQueue,
      previousChallengerId: room.round?.challengerId ?? null,
    });
    // 全員オフラインなどで次の挑戦者を選べない場合は、誰かが再接続してメッセージを送るまで待機する。
    if (!nextChallengerId) return;

    const promptResult = selectNextPrompt({ prompts, usedPromptIds: room.usedPromptIds });
    // お題を使い切って選べない場合(通常起こり得ない)は進行を止める。
    if (!promptResult.ok) return;

    const nextRoundNumber = (room.round?.roundNumber ?? 0) + 1;
    const updatedRoom: RoomState = {
      ...room,
      phase: "ROUND_INTRO",
      round: createRoundState(nextRoundNumber, nextChallengerId, promptResult.prompt),
      challengerQueue,
      usedPromptIds: promptResult.usedPromptIds,
      deadlineAt: now + GAME_CONFIG.roundIntroDwellMs,
      version: room.version + 1,
      updatedAt: now,
    };
    await this.commit(stored, updatedRoom);
  }

  // ---- 共通ヘルパー ----

  private async load(): Promise<PersistedRoom | undefined> {
    return this.ctx.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
  }

  private async persist(stored: PersistedRoom): Promise<void> {
    await this.ctx.storage.put(ROOM_STORAGE_KEY, stored);
  }

  /** deadlineAtに応じてDurable Object Alarmを同期する。null なら解除、それ以外ならセットする。 */
  private async syncAlarm(room: RoomState): Promise<void> {
    if (room.deadlineAt === null) {
      await this.ctx.storage.deleteAlarm();
    } else {
      await this.ctx.storage.setAlarm(room.deadlineAt);
    }
  }

  /** 状態変更の唯一の入口。永続化・Alarm同期・全員への配信を必ずセットで行う。 */
  private async commit(stored: PersistedRoom, room: RoomState): Promise<void> {
    await this.persist({ ...stored, room });
    await this.syncAlarm(room);
    await this.broadcastState(room);
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    ws.send(JSON.stringify({ type: "ERROR", code, message } satisfies ServerMessage));
  }

  private getAttachedPlayerId(ws: WebSocket): string | null {
    const attachment = ws.deserializeAttachment() as { playerId?: unknown } | null;
    return typeof attachment?.playerId === "string" ? attachment.playerId : null;
  }

  private async updateOnline(playerId: string, isOnline: boolean): Promise<RoomState> {
    const stored = await this.load();
    if (!stored) throw new Error("Room disappeared");
    const player = stored.room.players.find((candidate) => candidate.id === playerId);
    if (!player || player.isOnline === isOnline) return stored.room;
    const room: RoomState = {
      ...stored.room,
      players: stored.room.players.map((candidate) => (candidate.id === playerId ? { ...candidate, isOnline } : candidate)),
      version: stored.room.version + 1,
      updatedAt: Date.now(),
    };
    await this.persist({ ...stored, room });
    return room;
  }

  private async disconnect(ws: WebSocket): Promise<void> {
    const playerId = this.getAttachedPlayerId(ws);
    if (!playerId) return;
    const stillConnected = this.ctx.getWebSockets().some((candidate) => candidate !== ws && candidate.readyState === WebSocket.OPEN && this.getAttachedPlayerId(candidate) === playerId);
    if (stillConnected) return;
    const room = await this.updateOnline(playerId, false);
    await this.broadcastState(room);
  }

  private async broadcastState(room: RoomState, except?: WebSocket): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === except || socket.readyState !== WebSocket.OPEN) continue;
      const viewerId = this.getAttachedPlayerId(socket);
      if (!viewerId) continue;
      const state = toPublicRoomState({ room, viewerId });
      socket.send(JSON.stringify({ type: "STATE_SYNC", state } satisfies ServerMessage));
    }
  }
}

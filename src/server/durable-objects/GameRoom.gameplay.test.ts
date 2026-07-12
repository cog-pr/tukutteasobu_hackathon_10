import { runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { CHALLENGE_CONFIG, GAME_CONFIG } from "../../shared/constants";
import type { PublicRoomState } from "../../shared/types/game";
import type { ServerMessage } from "../../shared/types/messages";
import {
  buildRoundFixture,
  connectFullRoom,
  connectHost,
  connectPlayers,
  readRoom,
  readyUpAll,
  seedRoom,
  sendAndWait,
} from "./gameRoomTestHelpers";

function expectError(message: ServerMessage, code: string): void {
  expect(message).toMatchObject({ type: "ERROR", code });
}

function expectSync(message: ServerMessage): PublicRoomState {
  if (message.type !== "STATE_SYNC") throw new Error(`expected STATE_SYNC, got ${JSON.stringify(message)}`);
  return message.state;
}

// Directly invokes the DO's public alarm() handler. Tests that only seed storage (rather than
// going through a real commit()) never have a real Alarm scheduled for runDurableObjectAlarm to find,
// so this calls the method directly — the real CF Alarm scheduling itself is covered separately
// under "Alarm idempotency".
async function fireAlarmNow(stub: Parameters<typeof seedRoom>[0]): Promise<void> {
  await seedRoom(stub, (room) => ({ ...room, deadlineAt: Date.now() - 1 }));
  await runInDurableObject(stub, (instance) => instance.alarm());
}

async function waitForPhase(stub: Parameters<typeof readRoom>[0], phase: string, attempts = 100) {
  for (let i = 0; i < attempts; i++) {
    const room = await readRoom(stub);
    if (room.phase === phase) return room;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`timed out waiting for phase ${phase}`);
}

describe("GameRoom WebSocket lifecycle", () => {
  it("不正な認証情報の接続を拒否する", async () => {
    const host = await connectHost("WSAUTH");
    const response = await host.stub.fetch(new Request(`https://example.test/ws?playerId=${host.playerId}&playerToken=wrong`, { headers: { Upgrade: "websocket" } }));
    expect(response.status).toBe(401);
  });

  it("STATE_SYNCの送信・READY処理・PING応答を行い、トークンを漏らさない", async () => {
    const host = await connectHost("WSSYNC");
    const readyResponse = await sendAndWait(host, { type: "READY", ready: true });
    const state = expectSync(readyResponse);
    expect(state.players[0]).toMatchObject({ isOnline: true, isReady: true });
    expect(JSON.stringify(readyResponse)).not.toContain(host.playerToken);

    expect(await sendAndWait(host, { type: "PING" })).toEqual({ type: "PONG" });
  });

  it("不正なメッセージにERRORを返す", async () => {
    const host = await connectHost("WSERR1");
    host.socket.send("not-json");
    expectError(await host.queue.next(), "INVALID_MESSAGE");
  });

  it("未実装フェーズの操作はNOT_IMPLEMENTEDではなくINVALID_PHASEを返す", async () => {
    const host = await connectHost("WSNIMP");
    expectError(await sendAndWait(host, { type: "CAST_VOTE", choice: "A" }), "INVALID_PHASE");
  });
});

describe("START_GAME", () => {
  it("ホスト以外からの開始を拒否する", async () => {
    const { players } = await connectFullRoom("SGNOHO");
    await readyUpAll(players);
    expectError(await sendAndWait(players[1], { type: "START_GAME" }), "NOT_HOST");
  });

  it("4人未満では開始できない", async () => {
    const { players } = await connectPlayers("SGFEW1", 2);
    expectError(await sendAndWait(players[0], { type: "START_GAME" }), "NOT_ENOUGH_PLAYERS");
  });

  it("未準備のプレイヤーがいる場合は開始できない", async () => {
    const { players } = await connectFullRoom("SGRDY1");
    expectError(await sendAndWait(players[0], { type: "START_GAME" }), "PLAYER_NOT_READY");
  });

  it("オフラインのプレイヤーがいる場合は開始できない", async () => {
    const { stub, players } = await connectFullRoom("SGOFF1");
    await readyUpAll(players);
    await seedRoom(stub, (room) => ({ ...room, players: room.players.map((p) => (p.id === players[1].playerId ? { ...p, isOnline: false } : p)) }));
    expectError(await sendAndWait(players[0], { type: "START_GAME" }), "PLAYER_OFFLINE");
  });

  it("正常に開始でき、ROUND_INTROへ遷移する", async () => {
    const { players } = await connectFullRoom("SGOK01");
    await readyUpAll(players);
    const state = expectSync(await sendAndWait(players[0], { type: "START_GAME" }));
    expect(state.phase).toBe("ROUND_INTRO");
    expect(state.round).toMatchObject({ roundNumber: 1, isRevealed: false });
    expect(state.score).toEqual({ human: 0, ai: 0 });
    expect(state.deadlineAt).not.toBeNull();
  });

  it("開始済みルームへの再度のSTART_GAMEを拒否する", async () => {
    const { players } = await connectFullRoom("SGDBL1");
    await readyUpAll(players);
    await sendAndWait(players[0], { type: "START_GAME" });
    expectError(await sendAndWait(players[0], { type: "START_GAME" }), "INVALID_PHASE");
  });
});

describe("ANSWERING", () => {
  it("AI回答が解決した後、人間の回答提出でVOTINGへ進む", async () => {
    const { stub, players } = await connectFullRoom("ANSAI1");
    await readyUpAll(players);
    const introState = expectSync(await sendAndWait(players[0], { type: "START_GAME" }));
    const challengerId = introState.round!.challengerId;
    const challenger = players.find((p) => p.playerId === challengerId)!;

    await fireAlarmNow(stub); // ROUND_INTRO -> ANSWERING (AI generation starts in the background)
    for (const player of players) await player.queue.next(); // drain the ANSWERING broadcast

    const submitResponse = await sendAndWait(challenger, { type: "SUBMIT_ANSWER", answer: "人間の回答" });
    expectSync(submitResponse); // may already be VOTING if the AI (fallback) resolved first — either is valid

    const votingRoom = await waitForPhase(stub, "VOTING");
    expect(votingRoom.round?.humanAnswer).toBe("人間の回答");
    expect(votingRoom.round?.aiAnswer).not.toBeNull();
    expect(votingRoom.round?.answerOrder).not.toBeNull();
  });

  it("挑戦者以外の回答提出を拒否する", async () => {
    const { stub, players } = await connectPlayers("ANSNCH", 2);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ANSWERING",
      round: buildRoundFixture(players[0].playerId),
      deadlineAt: Date.now() + GAME_CONFIG.answerTimeMs,
    }));
    expectError(await sendAndWait(players[1], { type: "SUBMIT_ANSWER", answer: "回答" }), "NOT_CHALLENGER");
  });

  it("ANSWERING以外での回答提出を拒否する", async () => {
    const { stub, players } = await connectPlayers("ANSPHS", 1);
    await seedRoom(stub, (room) => ({ ...room, phase: "VOTING", round: buildRoundFixture(players[0].playerId) }));
    expectError(await sendAndWait(players[0], { type: "SUBMIT_ANSWER", answer: "回答" }), "INVALID_PHASE");
  });

  it("二重の回答提出を拒否する", async () => {
    const { stub, players } = await connectPlayers("ANSDBL", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ANSWERING",
      round: buildRoundFixture(players[0].playerId, { humanAnswer: "既存の回答" }),
      deadlineAt: Date.now() + GAME_CONFIG.answerTimeMs,
    }));
    expectError(await sendAndWait(players[0], { type: "SUBMIT_ANSWER", answer: "別の回答" }), "ALREADY_ANSWERED");
  });

  it("不正な回答内容をサーバー側でも拒否する", async () => {
    const { stub, players } = await connectPlayers("ANSINV", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ANSWERING",
      round: buildRoundFixture(players[0].playerId),
      deadlineAt: Date.now() + GAME_CONFIG.answerTimeMs,
    }));
    expectError(await sendAndWait(players[0], { type: "SUBMIT_ANSWER", answer: "   " }), "INVALID_MESSAGE");
  });

  it("制限時間経過後の回答提出を拒否する", async () => {
    const { stub, players } = await connectPlayers("ANSDDL", 1);
    await seedRoom(stub, (room) => ({ ...room, phase: "ANSWERING", round: buildRoundFixture(players[0].playerId), deadlineAt: Date.now() - 1 }));
    expectError(await sendAndWait(players[0], { type: "SUBMIT_ANSWER", answer: "回答" }), "DEADLINE_EXCEEDED");
  });

  it("制限時間到達かつ未回答の場合は不戦敗としてREVEALへ進む", async () => {
    const { stub, players } = await connectPlayers("ANSFOR", 1);
    await seedRoom(stub, (room) => ({ ...room, phase: "ANSWERING", round: buildRoundFixture(players[0].playerId), deadlineAt: Date.now() + 1_000 }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("REVEAL");
    expect(room.round).toMatchObject({ isForfeit: true, winner: "ai" });
  });

  it("人間は回答済みだがAIが未解決の場合はフェーズを進めず待機する", async () => {
    const { stub, players } = await connectPlayers("ANSWAI", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ANSWERING",
      round: buildRoundFixture(players[0].playerId, { humanAnswer: "人間の回答" }),
      deadlineAt: Date.now() + 1_000,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("ANSWERING");
    expect(room.round?.isForfeit).toBe(false);
  });
});

describe("VOTING", () => {
  async function setUpVotingRoom(roomCode: string) {
    const { stub, players } = await connectPlayers(roomCode, 3);
    const [challenger, voter1, voter2] = players;
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "VOTING",
      round: buildRoundFixture(challenger.playerId, { humanAnswer: "人間の回答", aiAnswer: "AIの回答", answerOrder: { A: "human", B: "ai" } }),
      deadlineAt: Date.now() + GAME_CONFIG.voteTimeMs,
    }));
    return { stub, challenger, voter1, voter2 };
  }

  it("挑戦者の投票を拒否する", async () => {
    const { challenger } = await setUpVotingRoom("VOTCHL");
    expectError(await sendAndWait(challenger, { type: "CAST_VOTE", choice: "A" }), "CHALLENGER_CANNOT_VOTE");
  });

  it("オフラインのプレイヤーの投票を拒否する", async () => {
    const { stub, voter1 } = await setUpVotingRoom("VOTOFF");
    await seedRoom(stub, (room) => ({ ...room, players: room.players.map((p) => (p.id === voter1.playerId ? { ...p, isOnline: false } : p)) }));
    expectError(await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" }), "PLAYER_OFFLINE");
  });

  it("VOTING以外での投票を拒否する", async () => {
    const { stub, voter1 } = await setUpVotingRoom("VOTPHS");
    await seedRoom(stub, (room) => ({ ...room, phase: "ANSWERING" }));
    expectError(await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" }), "INVALID_PHASE");
  });

  it("二重投票を拒否する", async () => {
    const { voter1 } = await setUpVotingRoom("VOTDBL");
    await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" });
    expectError(await sendAndWait(voter1, { type: "CAST_VOTE", choice: "B" }), "ALREADY_VOTED");
  });

  it("制限時間経過後の投票を拒否する", async () => {
    const { stub, voter1 } = await setUpVotingRoom("VOTDDL");
    await seedRoom(stub, (room) => ({ ...room, deadlineAt: Date.now() - 1 }));
    expectError(await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" }), "DEADLINE_EXCEEDED");
  });

  it("全員投票完了でアラームを待たずにREVEALへ進む", async () => {
    const { voter1, voter2 } = await setUpVotingRoom("VOTALL");
    await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" });
    await voter2.queue.next(); // voter1の投票による broadcast を読み捨てる
    const state = expectSync(await sendAndWait(voter2, { type: "CAST_VOTE", choice: "B" }));
    expect(state.phase).toBe("REVEAL");
  });

  it("制限時間経過後は投票済みの票だけで集計する", async () => {
    const { stub, voter1 } = await setUpVotingRoom("VOTTIM");
    await sendAndWait(voter1, { type: "CAST_VOTE", choice: "A" });
    await seedRoom(stub, (room) => ({ ...room, deadlineAt: Date.now() - 1 }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("REVEAL");
    expect(room.round?.winner).toBe("human"); // 1票のみ、answerOrder.A === human
  });
});

describe("REVEAL", () => {
  it("REVEALのSTATE_SYNCが回答・対応・票数を含み、投票先は含まない", async () => {
    const { stub, players } = await connectPlayers("RVLSNC", 2);
    const [challenger, viewer] = players;
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVEAL",
      round: buildRoundFixture(challenger.playerId, {
        humanAnswer: "人間の回答",
        aiAnswer: "AIの回答",
        answerOrder: { A: "human", B: "ai" },
        votes: { [viewer.playerId]: "A" },
        winner: "human",
      }),
      deadlineAt: Date.now() + GAME_CONFIG.revealDwellMs,
    }));

    // READYはフェーズを問わず処理されるため、これを使って現在のREVEAL状態のSTATE_SYNCを引き出す。
    const state = expectSync(await sendAndWait(viewer, { type: "READY", ready: true }));
    expect(state.round).toMatchObject({
      isRevealed: true,
      answerA: "人間の回答",
      answerB: "AIの回答",
      answerOrder: { A: "human", B: "ai" },
      voteCounts: { A: 1, B: 0 },
      winner: "human",
    });
    expect(JSON.stringify(state)).not.toContain(`"${viewer.playerId}":"A"`);
    void stub;
  });

  it("人間の勝利でROUND_RESULTへ進み、得点と履歴が記録される", async () => {
    const { stub, players } = await connectPlayers("RVLHUM", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVEAL",
      round: buildRoundFixture(players[0].playerId, {
        humanAnswer: "人間の回答",
        aiAnswer: "AIの回答",
        answerOrder: { A: "human", B: "ai" },
        votes: { x: "A" },
        winner: "human",
      }),
      deadlineAt: Date.now() + 1,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("ROUND_RESULT");
    expect(room.score).toEqual({ human: 1, ai: 0 });
    expect(room.history).toHaveLength(1);
    expect(room.history[0]).toMatchObject({ winner: "human", wentToRevenge: false });
  });

  it("AIの勝利でREVENGE_ACTIVEへ進む", async () => {
    const { stub, players } = await connectPlayers("RVLAI1", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVEAL",
      round: buildRoundFixture(players[0].playerId, {
        humanAnswer: "人間の回答",
        aiAnswer: "AIの回答",
        answerOrder: { A: "ai", B: "human" },
        votes: { x: "A" },
        winner: "ai",
      }),
      deadlineAt: Date.now() + 1,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("REVENGE_ACTIVE");
    expect(room.round?.challengeType).toBe("rapid_tap");
    expect(room.round?.challengeProgress).toBe(0);
  });

  it("不戦敗もAIの勝利としてREVENGE_ACTIVEへ進む", async () => {
    const { stub, players } = await connectPlayers("RVLFOR", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVEAL",
      round: buildRoundFixture(players[0].playerId, { isForfeit: true, winner: "ai" }),
      deadlineAt: Date.now() + 1,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("REVENGE_ACTIVE");
  });
});

describe("REVENGE_ACTIVE", () => {
  async function setUpRevengeRoom(roomCode: string) {
    const { stub, players } = await connectPlayers(roomCode, 1);
    const challenger = players[0];
    const now = Date.now();
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVENGE_ACTIVE",
      round: buildRoundFixture(challenger.playerId, {
        humanAnswer: "人間の回答",
        aiAnswer: "AIの回答",
        answerOrder: { A: "ai", B: "human" },
        winner: "ai",
        challengeType: "rapid_tap",
        challengeProgress: 0,
        challengeProgressUpdatedAt: now,
      }),
      deadlineAt: now + CHALLENGE_CONFIG.rapidTap.durationMs,
    }));
    return { stub, challenger };
  }

  it("挑戦者以外の進捗送信を拒否する", async () => {
    // ルームがLOBBY以外へ移った後はjoinRoomできないため、他プレイヤーは先に接続しておく。
    const { stub, players } = await connectPlayers("RVGNCH", 2);
    const [challenger, other] = players;
    const now = Date.now();
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "REVENGE_ACTIVE",
      round: buildRoundFixture(challenger.playerId, { challengeType: "rapid_tap", challengeProgress: 0, challengeProgressUpdatedAt: now }),
      deadlineAt: now + CHALLENGE_CONFIG.rapidTap.durationMs,
    }));
    expectError(await sendAndWait(other, { type: "REVENGE_PROGRESS", value: 1 }), "NOT_CHALLENGER");
  });

  it("あり得ない進捗の急増を拒否する", async () => {
    const { challenger } = await setUpRevengeRoom("RVGJMP");
    expectError(await sendAndWait(challenger, { type: "REVENGE_PROGRESS", value: 35 }), "INVALID_MESSAGE");
  });

  it("妥当な進捗の増加を受理する", async () => {
    const { stub, challenger } = await setUpRevengeRoom("RVGOK1");
    const state = expectSync(await sendAndWait(challenger, { type: "REVENGE_PROGRESS", value: 1 }));
    expect(state.round).toMatchObject({ challengeProgress: 1 });
    const room = await readRoom(stub);
    expect(room.round?.challengeProgress).toBe(1);
  });

  it("進捗不足なのに成功を自己申告しても、サーバーは失敗と判定する", async () => {
    const { stub, challenger } = await setUpRevengeRoom("RVGLIE");
    await seedRoom(stub, (room) => ({ ...room, round: room.round ? { ...room.round, challengeProgress: 5 } : room.round }));
    const state = expectSync(await sendAndWait(challenger, { type: "REVENGE_RESULT", result: "success" }));
    expect(state.round).toMatchObject({ challengeResult: "failure" });
    expect(state.score).toEqual({ human: 0, ai: 1 });
  });

  it("進捗が十分なら失敗を自己申告しても、サーバーは成功と判定する", async () => {
    const { stub, challenger } = await setUpRevengeRoom("RVGWIN");
    await seedRoom(stub, (room) => ({ ...room, round: room.round ? { ...room.round, challengeProgress: CHALLENGE_CONFIG.rapidTap.requiredCount } : room.round }));
    const state = expectSync(await sendAndWait(challenger, { type: "REVENGE_RESULT", result: "failure" }));
    expect(state.round).toMatchObject({ challengeResult: "success" });
    expect(state.score).toEqual({ human: 1, ai: 0 });
  });

  it("メッセージなしでも制限時間経過で判定される(進捗不足は失敗)", async () => {
    const { stub } = await setUpRevengeRoom("RVGTOF");
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("ROUND_RESULT");
    expect(room.round?.challengeResult).toBe("failure");
    expect(room.score).toEqual({ human: 0, ai: 1 });
  });

  it("メッセージなしでも制限時間経過で判定される(進捗十分なら成功)", async () => {
    const { stub } = await setUpRevengeRoom("RVGTOS");
    await seedRoom(stub, (room) => ({ ...room, round: room.round ? { ...room.round, challengeProgress: CHALLENGE_CONFIG.rapidTap.requiredCount } : room.round }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("ROUND_RESULT");
    expect(room.round?.challengeResult).toBe("success");
    expect(room.score).toEqual({ human: 1, ai: 0 });
  });
});

describe("ROUND_RESULT", () => {
  it("勝利条件未達なら次のROUND_INTROへ進む", async () => {
    const { stub, players } = await connectPlayers("RRDNXT", 4);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ROUND_RESULT",
      score: { human: 1, ai: 0 },
      round: buildRoundFixture(players[0].playerId, { roundNumber: 1, winner: "human" }),
      challengerQueue: [players[1].playerId, players[2].playerId, players[3].playerId],
      deadlineAt: Date.now() + 1,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("ROUND_INTRO");
    expect(room.round?.roundNumber).toBe(2);
    expect(room.round?.challengerId).not.toBe(players[0].playerId);
  });

  it("勝利条件に達していればGAME_RESULTへ進む", async () => {
    const { stub, players } = await connectPlayers("RRDFIN", 1);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "ROUND_RESULT",
      score: { human: GAME_CONFIG.winningScore, ai: 1 },
      round: buildRoundFixture(players[0].playerId, { winner: "human" }),
      deadlineAt: Date.now() + 1,
    }));
    await fireAlarmNow(stub);
    const room = await readRoom(stub);
    expect(room.phase).toBe("GAME_RESULT");
    expect(room.deadlineAt).toBeNull();
  });
});

describe("REMATCH", () => {
  it("GAME_RESULT以外では拒否する", async () => {
    const host = await connectHost("RMTPHS");
    expectError(await sendAndWait(host, { type: "REMATCH" }), "INVALID_PHASE");
  });

  it("ホスト以外からの再戦を拒否する", async () => {
    const { stub, players } = await connectPlayers("RMTNHO", 2);
    await seedRoom(stub, (room) => ({ ...room, phase: "GAME_RESULT", deadlineAt: null }));
    expectError(await sendAndWait(players[1], { type: "REMATCH" }), "NOT_HOST");
  });

  it("正常にLOBBYへリセットされる", async () => {
    const { stub, players } = await connectPlayers("RMTOK1", 2);
    await seedRoom(stub, (room) => ({
      ...room,
      phase: "GAME_RESULT",
      score: { human: 3, ai: 1 },
      history: [{ roundNumber: 1, challengerId: players[0].playerId, challengerName: "P1", prompt: { id: "prompt_001", type: "text", text: "お題", category: "normal" }, humanAnswer: "a", aiAnswer: "b", answerOrder: { A: "human", B: "ai" }, voteCounts: { A: 1, B: 0 }, winner: "human", isForfeit: false, wentToRevenge: false, revengeResult: null }],
      players: room.players.map((p) => ({ ...p, isReady: true })),
      deadlineAt: null,
    }));

    const state = expectSync(await sendAndWait(players[0], { type: "REMATCH" }));
    expect(state.phase).toBe("LOBBY");
    expect(state.score).toEqual({ human: 0, ai: 0 });
    expect(state.history).toEqual([]);
    expect(state.round).toBeNull();
    expect(state.players.every((p) => !p.isReady)).toBe(true);
    expect(state.players).toHaveLength(2);
  });
});

describe("Alarm idempotency", () => {
  it("deadlineAtがnullの場合はアラームが発火しない", async () => {
    const host = await connectHost("ALMNUL");
    const ran = await runDurableObjectAlarm(host.stub);
    expect(ran).toBe(false);
  });

  it("deadlineAtが未来の場合はアラームが発火しても状態を変えない", async () => {
    const { stub, players } = await connectPlayers("ALMFUT", 4);
    await readyUpAll(players);
    await sendAndWait(players[0], { type: "START_GAME" });
    const before = await readRoom(stub);
    await runDurableObjectAlarm(stub);
    const after = await readRoom(stub);
    expect(after.phase).toBe(before.phase);
    expect(after.version).toBe(before.version);
  });
});

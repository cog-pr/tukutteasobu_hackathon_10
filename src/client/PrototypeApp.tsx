import { useEffect, useMemo, useRef, useState } from "react";
import { prompts } from "../data/prompts";
import { validateAnswer } from "../lib/validateAnswer";
import { countVotes, type VoteChoice } from "../shared/game/countVotes";
import { getGameResult, type Score } from "../shared/game/getGameResult";
import { validatePlayerName } from "../shared/validation/playerName";
import type { Prompt } from "../types/prompt";
import { getRemainingMs, getRemainingSeconds } from "./lib/time";

type Screen =
  | "home"
  | "room-form"
  | "lobby"
  | "round-intro"
  | "answering"
  | "voting"
  | "reveal"
  | "revenge-intro"
  | "revenge-active"
  | "round-result"
  | "game-result";

type RoomMode = "create" | "join";
type Winner = "human" | "ai";
type ChallengeType = "rapid_tap" | "shake";
type ChallengeStatus = "idle" | "running" | "success" | "failure";
type MotionStatus = "unchecked" | "available" | "granted" | "unsupported" | "denied";

type PrototypePlayer = {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
};

type AnswerOrder = {
  A: Winner;
  B: Winner;
};

type RoundRecord = {
  roundNumber: number;
  challengerName: string;
  prompt: string;
  humanAnswer: string;
  aiAnswer: string;
  votes: { A: number; B: number };
  voteWinner: Winner;
  pointWinner: Winner;
  challengeResult: "success" | "failure" | null;
};

const GAME_CONFIG = {
  winningScore: 3,
  answerTimeMs: 45_000,
  voteTimeMs: 20_000,
  maxAnswerLength: 60,
  rapidTap: { durationMs: 5_000, target: 35 },
  shake: { durationMs: 6_000, target: 10, threshold: 12, cooldownMs: 200 },
} as const;

const DEMO_NAMES = ["ミナト", "アオイ", "ユウ", "リン"];

const MOCK_AI_ANSWERS = [
  "入口で会員登録、出口で退会手続きが必要",
  "校歌の二番から授業が始まる",
  "充電すると本体より充電器が元気になる",
  "注文より先にお会計だけが到着する",
  "毎週月曜だけ名前が変わる祝日",
  "散らかした場所を丁寧にライトアップする",
  "話の続きは有料プランでしか聞けない",
  "起こす代わりに布団へ励ましの言葉をかける",
  "押すと一歩だけ後ろへワープする",
  "写真を撮るたびカメラが目をつぶる",
  "店員より先にレジが休憩へ入る",
  "検索結果を全部『気のせいです』で返す",
];

const SCREEN_LABELS: Partial<Record<Screen, string>> = {
  lobby: "LOBBY",
  "round-intro": "ROUND START",
  answering: "ANSWER",
  voting: "VOTE",
  reveal: "REVEAL",
  "revenge-intro": "REVENGE",
  "revenge-active": "REVENGE",
  "round-result": "ROUND RESULT",
  "game-result": "GAME RESULT",
};

function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function getMockAiAnswer(prompt: Prompt): string {
  const numericId = Number(prompt.id.replace(/\D/g, "")) || 1;
  return MOCK_AI_ANSWERS[(numericId - 1) % MOCK_AI_ANSWERS.length];
}

function getRandomPrompt(excludedIds: string[]): Prompt {
  const candidates = prompts.filter((prompt) => !excludedIds.includes(prompt.id));
  const source = candidates.length > 0 ? candidates : prompts;
  return source[Math.floor(Math.random() * source.length)];
}

function usePrototypeClock(deadlineAt: number | null, active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || deadlineAt === null) return;

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [active, deadlineAt]);

  return {
    remainingMs: getRemainingMs(deadlineAt, now),
    remainingSeconds: getRemainingSeconds(deadlineAt, now),
  };
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="たかがAI、あがけ人類">
      <span className="brand-mark__human">人</span>
      <span className="brand-mark__slash">/</span>
      <span className="brand-mark__ai">AI</span>
    </div>
  );
}

function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button type="button" className={`app-button app-button--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function ScoreStrip({ score }: { score: Score }) {
  return (
    <div className="score-strip" aria-label={`人類${score.human}点、AI${score.ai}点`}>
      <div>
        <span className="score-strip__label score-strip__label--human">HUMAN</span>
        <strong>{score.human}</strong>
      </div>
      <span className="score-strip__versus">VS</span>
      <div>
        <strong>{score.ai}</strong>
        <span className="score-strip__label score-strip__label--ai">AI</span>
      </div>
    </div>
  );
}

function Timer({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  const urgent = ratio <= 0.25;

  return (
    <div className="timer" aria-label={`残り${Math.ceil(remainingMs / 1000)}秒`}>
      <div className="timer__track">
        <span className={urgent ? "timer__fill timer__fill--urgent" : "timer__fill"} style={{ width: `${ratio * 100}%` }} />
      </div>
      <strong className={urgent ? "timer__number timer__number--urgent" : "timer__number"}>
        {Math.ceil(remainingMs / 1000)}
        <small>sec</small>
      </strong>
    </div>
  );
}

function AnswerOption({
  letter,
  answer,
  selected,
  disabled,
  identity,
  voteCount,
  onSelect,
}: {
  letter: VoteChoice;
  answer: string;
  selected?: boolean;
  disabled?: boolean;
  identity?: Winner;
  voteCount?: number;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <div className="answer-option__topline">
        <span className="answer-option__letter">{letter}</span>
        {identity && (
          <span className={`identity identity--${identity}`}>
            {identity === "human" ? "人類" : "AI"}
          </span>
        )}
        {typeof voteCount === "number" && <strong className="answer-option__votes">{voteCount}票</strong>}
      </div>
      <p>{answer}</p>
      {selected && <span className="answer-option__selected">投票済み</span>}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={`answer-option ${selected ? "answer-option--selected" : ""}`}
        disabled={disabled}
        onClick={onSelect}
      >
        {content}
      </button>
    );
  }

  return <div className={`answer-option answer-option--reveal answer-option--${identity}`}>{content}</div>;
}

function AppFrame({
  children,
  screen,
  roomCode,
  score,
  roundNumber,
  onExit,
}: {
  children: React.ReactNode;
  screen: Screen;
  roomCode: string;
  score: Score;
  roundNumber: number;
  onExit: () => void;
}) {
  const showGameHeader = !["home", "room-form"].includes(screen);

  return (
    <div className="prototype-shell">
      <div className="prototype-app">
        <header className="app-header">
          <BrandMark />
          <div className="app-header__title">
            <strong>たかがAI、あがけ人類</strong>
            <span>LOCAL PROTOTYPE</span>
          </div>
          {screen !== "home" && (
            <button type="button" className="icon-button" onClick={onExit} aria-label="トップへ戻る">
              ×
            </button>
          )}
        </header>

        {showGameHeader && (
          <div className="game-meta">
            <div>
              <span>{SCREEN_LABELS[screen] ?? "ROOM"}</span>
              <strong>{screen === "lobby" ? roomCode : `ROUND ${roundNumber}`}</strong>
            </div>
            {screen !== "lobby" && <ScoreStrip score={score} />}
          </div>
        )}

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export function PrototypeApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [roomMode, setRoomMode] = useState<RoomMode>("create");
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [formError, setFormError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<PrototypePlayer[]>([]);
  const [motionStatus, setMotionStatus] = useState<MotionStatus>("unchecked");

  const [score, setScore] = useState<Score>({ human: 0, ai: 0 });
  const [roundNumber, setRoundNumber] = useState(1);
  const [challengerIndex, setChallengerIndex] = useState(0);
  const [usedPromptIds, setUsedPromptIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<Prompt>(() => prompts[0]);
  const [humanAnswerDraft, setHumanAnswerDraft] = useState("");
  const [humanAnswer, setHumanAnswer] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [answerOrder, setAnswerOrder] = useState<AnswerOrder>({ A: "human", B: "ai" });
  const [votes, setVotes] = useState<VoteChoice[]>([]);
  const [voteCounts, setVoteCounts] = useState({ A: 0, B: 0 });
  const [voteWinner, setVoteWinner] = useState<Winner>("human");
  const [humanForfeited, setHumanForfeited] = useState(false);
  const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
  const [lastPointWinner, setLastPointWinner] = useState<Winner>("human");

  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [challengeType, setChallengeType] = useState<ChallengeType>("rapid_tap");
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>("idle");
  const [challengeProgress, setChallengeProgress] = useState(0);

  const challengeProgressRef = useRef(0);
  const lastShakeAtRef = useRef(0);
  const timeoutHandledRef = useRef(false);

  const isTimedScreen = screen === "answering" || screen === "voting" || screen === "revenge-active";
  const { remainingMs, remainingSeconds } = usePrototypeClock(deadlineAt, isTimedScreen);

  const currentChallenger = players[challengerIndex] ?? players[0];
  const voters = useMemo(
    () => players.filter((_, index) => index !== challengerIndex && _.isOnline),
    [challengerIndex, players],
  );
  const currentVoter = voters[Math.min(votes.length, Math.max(0, voters.length - 1))];
  const humanChoice: VoteChoice = answerOrder.A === "human" ? "A" : "B";
  const answerA = answerOrder.A === "human" ? humanAnswer : aiAnswer;
  const answerB = answerOrder.B === "human" ? humanAnswer : aiAnswer;
  const validation = validateAnswer(humanAnswerDraft);
  const ownPlayer = players.find((player) => player.id === "self");
  const hostPlayer = players.find((player) => player.isHost);
  const allReady = players.length >= 4 && players.every((player) => player.isReady && player.isOnline);

  const resetToHome = () => {
    setScreen("home");
    setDeadlineAt(null);
    setChallengeStatus("idle");
    timeoutHandledRef.current = false;
  };

  const openRoomForm = (mode: RoomMode) => {
    setRoomMode(mode);
    setPlayerNameInput("");
    setRoomCodeInput("");
    setFormError("");
    setScreen("room-form");
  };

  const enterLobby = () => {
    const nameValidation = validatePlayerName(playerNameInput);
    if (!nameValidation.valid) {
      setFormError(nameValidation.message);
      return;
    }
    if (roomMode === "join" && !/^[A-Z0-9]{6}$/.test(roomCodeInput)) {
      setFormError("6桁のルームコードを入力してください");
      return;
    }

    const code = roomMode === "create" ? makeRoomCode() : roomCodeInput;
    const demoPlayers: PrototypePlayer[] = [
      {
        id: "self",
        name: nameValidation.value,
        isHost: roomMode === "create",
        isReady: false,
        isOnline: true,
      },
      ...DEMO_NAMES.slice(0, 3).map((name, index) => ({
        id: `demo_${index + 1}`,
        name,
        isHost: roomMode === "join" && index === 0,
        isReady: true,
        isOnline: true,
      })),
    ];

    setRoomCode(code);
    setPlayers(demoPlayers);
    setMotionStatus("unchecked");
    setFormError("");
    setScreen("lobby");
  };

  const checkMotion = async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      setMotionStatus("unsupported");
      return;
    }

    const motionConstructor = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof motionConstructor.requestPermission === "function") {
      try {
        const permission = await motionConstructor.requestPermission();
        setMotionStatus(permission === "granted" ? "granted" : "denied");
      } catch {
        setMotionStatus("denied");
      }
      return;
    }

    setMotionStatus("available");
  };

  const prepareRound = (nextRoundNumber: number, nextChallengerIndex: number, excludedIds: string[]) => {
    const nextPrompt = getRandomPrompt(excludedIds);
    const nextUsedIds = excludedIds.includes(nextPrompt.id) ? [nextPrompt.id] : [...excludedIds, nextPrompt.id];
    const nextOrder: AnswerOrder = Math.random() < 0.5 ? { A: "human", B: "ai" } : { A: "ai", B: "human" };

    setRoundNumber(nextRoundNumber);
    setChallengerIndex(nextChallengerIndex);
    setPrompt(nextPrompt);
    setUsedPromptIds(nextUsedIds);
    setHumanAnswerDraft("");
    setHumanAnswer("");
    setAiAnswer(getMockAiAnswer(nextPrompt));
    setAnswerOrder(nextOrder);
    setVotes([]);
    setVoteCounts({ A: 0, B: 0 });
    setVoteWinner("human");
    setHumanForfeited(false);
    setDeadlineAt(null);
    timeoutHandledRef.current = false;
    setScreen("round-intro");
  };

  const startGame = (actorId: string) => {
    if (!players.find((player) => player.id === actorId)?.isHost || !allReady) return;
    setScore({ human: 0, ai: 0 });
    setRoundHistory([]);
    setLastPointWinner("human");
    prepareRound(1, 0, []);
  };

  const startAnswering = () => {
    timeoutHandledRef.current = false;
    setDeadlineAt(Date.now() + GAME_CONFIG.answerTimeMs);
    setScreen("answering");
  };

  const beginVoting = (submittedAnswer: string) => {
    setHumanAnswer(submittedAnswer);
    setVotes([]);
    setVoteCounts({ A: 0, B: 0 });
    timeoutHandledRef.current = false;
    setDeadlineAt(Date.now() + GAME_CONFIG.voteTimeMs);
    setScreen("voting");
  };

  const submitAnswer = (fromTimeout = false) => {
    const result = validateAnswer(humanAnswerDraft);
    if (result.valid) {
      beginVoting(humanAnswerDraft.trim());
      return;
    }
    if (!fromTimeout) return;

    setHumanAnswer("（時間切れ・未回答）");
    setHumanForfeited(true);
    setVoteCounts({ A: 0, B: 0 });
    setVoteWinner("ai");
    setDeadlineAt(null);
    setScreen("reveal");
  };

  const finishVoting = (completedVotes: VoteChoice[]) => {
    const voteMap = Object.fromEntries(completedVotes.map((choice, index) => [`voter_${index}`, choice]));
    const result = countVotes(voteMap);
    const winningChoice = result.winner === "draw" ? humanChoice : result.winner;

    setVotes(completedVotes);
    setVoteCounts({ A: result.countA, B: result.countB });
    setVoteWinner(answerOrder[winningChoice]);
    setDeadlineAt(null);
    setScreen("reveal");
  };

  const castVote = (choice: VoteChoice) => {
    const nextVotes = [...votes, choice];
    if (nextVotes.length >= voters.length) {
      finishVoting(nextVotes);
      return;
    }
    setVotes(nextVotes);
  };

  const completeRound = (
    pointWinner: Winner,
    challengeResult: "success" | "failure" | null,
  ) => {
    const nextScore = {
      human: score.human + (pointWinner === "human" ? 1 : 0),
      ai: score.ai + (pointWinner === "ai" ? 1 : 0),
    };
    const record: RoundRecord = {
      roundNumber,
      challengerName: currentChallenger?.name ?? "プレイヤー",
      prompt: prompt.text,
      humanAnswer,
      aiAnswer,
      votes: voteCounts,
      voteWinner,
      pointWinner,
      challengeResult,
    };
    const nextHistory = [...roundHistory, record];

    setScore(nextScore);
    setRoundHistory(nextHistory);
    setLastPointWinner(pointWinner);
    setDeadlineAt(null);

    const result = getGameResult(nextScore, GAME_CONFIG.winningScore);
    setScreen(result.finished ? "game-result" : "round-result");
  };

  const continueFromReveal = () => {
    if (voteWinner === "human" && !humanForfeited) {
      completeRound("human", null);
      return;
    }

    const motionEnabled = motionStatus === "available" || motionStatus === "granted";
    setChallengeType(motionEnabled && roundNumber % 2 === 0 ? "shake" : "rapid_tap");
    setChallengeProgress(0);
    challengeProgressRef.current = 0;
    setChallengeStatus("idle");
    setScreen("revenge-intro");
  };

  const startChallenge = () => {
    const duration = challengeType === "rapid_tap" ? GAME_CONFIG.rapidTap.durationMs : GAME_CONFIG.shake.durationMs;
    challengeProgressRef.current = 0;
    lastShakeAtRef.current = 0;
    setChallengeProgress(0);
    setChallengeStatus("running");
    setDeadlineAt(Date.now() + duration);
    timeoutHandledRef.current = false;
    setScreen("revenge-active");
  };

  const addChallengeProgress = () => {
    if (challengeStatus !== "running") return;
    const target = challengeType === "rapid_tap" ? GAME_CONFIG.rapidTap.target : GAME_CONFIG.shake.target;
    const next = Math.min(target, challengeProgressRef.current + 1);
    challengeProgressRef.current = next;
    setChallengeProgress(next);
    if (next >= target) {
      setChallengeStatus("success");
      setDeadlineAt(null);
      navigator.vibrate?.([40, 40, 80]);
    }
  };

  const settleChallenge = () => {
    const success = challengeStatus === "success";
    completeRound(success ? "human" : "ai", success ? "success" : "failure");
  };

  const startNextRound = () => {
    const nextChallengerIndex = (challengerIndex + 1) % players.length;
    prepareRound(roundNumber + 1, nextChallengerIndex, usedPromptIds);
  };

  const replay = () => {
    setScore({ human: 0, ai: 0 });
    setRoundHistory([]);
    setUsedPromptIds([]);
    setChallengeStatus("idle");
    setScreen("lobby");
  };

  useEffect(() => {
    if (screen !== "revenge-active" || challengeType !== "shake" || challengeStatus !== "running") return;

    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const x = acceleration?.x ?? 0;
      const y = acceleration?.y ?? 0;
      const z = acceleration?.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (
        magnitude >= GAME_CONFIG.shake.threshold &&
        now - lastShakeAtRef.current >= GAME_CONFIG.shake.cooldownMs
      ) {
        lastShakeAtRef.current = now;
        addChallengeProgress();
      }
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  });

  useEffect(() => {
    if (deadlineAt === null || remainingMs > 0 || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    if (screen === "answering") {
      submitAnswer(true);
      return;
    }

    if (screen === "voting") {
      finishVoting(votes);
      return;
    }

    if (screen === "revenge-active" && challengeStatus === "running") {
      setChallengeStatus("failure");
      setDeadlineAt(null);
    }
  });

  const winningSide = getGameResult(score, GAME_CONFIG.winningScore).winner;
  const mvp = useMemo(() => {
    const humanRounds = roundHistory.filter((record) => record.pointWinner === "human");
    return [...humanRounds].sort((a, b) => {
      const votesForAHuman = a.voteWinner === "human" ? Math.max(a.votes.A, a.votes.B) : 0;
      const votesForBHuman = b.voteWinner === "human" ? Math.max(b.votes.A, b.votes.B) : 0;
      return votesForBHuman - votesForAHuman;
    })[0];
  }, [roundHistory]);

  const renderHome = () => (
    <div className="home-screen">
      <div className="hero-orbit hero-orbit--one" />
      <div className="hero-orbit hero-orbit--two" />
      <div className="hero-copy">
        <span className="eyebrow">HUMANITY COMEBACK BATTLE</span>
        <h1>
          たかが<span>AI</span>、
          <br />
          あがけ<span className="hero-copy__human">人類</span>。
        </h1>
        <p>大喜利でAIに挑め。負けても、その肉体でひっくり返せ。</p>
      </div>

      <div className="hero-score" aria-hidden>
        <div><span>HUMAN</span><strong>03</strong></div>
        <b>:</b>
        <div><span>AI</span><strong>02</strong></div>
      </div>

      <div className="home-actions">
        <AppButton onClick={() => openRoomForm("create")}>ルームを作る</AppButton>
        <AppButton variant="secondary" onClick={() => openRoomForm("join")}>ルームに参加</AppButton>
      </div>

      <Panel className="how-to-panel">
        <span className="section-kicker">HOW TO PLAY</span>
        <ol>
          <li><b>01</b><span>挑戦者とAIが同じお題に回答</span></li>
          <li><b>02</b><span>正体を隠して、面白い方へ投票</span></li>
          <li><b>03</b><span>AIに負けたら肉体チャレンジで挽回</span></li>
        </ol>
        <p>4人のローカルデモプレイヤーで、全ゲームフローを体験できます。</p>
      </Panel>
    </div>
  );

  const renderRoomForm = () => (
    <div className="screen-stack">
      <div className="screen-heading">
        <span className="eyebrow">{roomMode === "create" ? "CREATE ROOM" : "JOIN ROOM"}</span>
        <h1>{roomMode === "create" ? "人類チームを作る" : "人類チームに加わる"}</h1>
        <p>このプロトタイプでは、残り3人をローカルのデモプレイヤーが担当します。</p>
      </div>

      <Panel className="form-panel">
        {roomMode === "join" && (
          <label className="field">
            <span>ルームコード</span>
            <input
              value={roomCodeInput}
              onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="6桁のコード"
              autoComplete="off"
              inputMode="text"
              maxLength={6}
            />
            <small>{roomCodeInput.length}/6</small>
          </label>
        )}

        <label className="field">
          <span>プレイヤー名</span>
          <input
            value={playerNameInput}
            onChange={(event) => setPlayerNameInput(event.target.value)}
            placeholder="例：タナカ"
            autoComplete="nickname"
            maxLength={20}
          />
          <small>{Array.from(playerNameInput).length}/10</small>
        </label>

        {formError && <p className="form-error" role="alert">{formError}</p>}

        <AppButton onClick={enterLobby}>{roomMode === "create" ? "ルームを作成" : "ルームへ参加"}</AppButton>
      </Panel>

      <button className="text-button" type="button" onClick={() => setScreen("home")}>← トップへ戻る</button>
    </div>
  );

  const renderLobby = () => {
    const motionLabel: Record<MotionStatus, string> = {
      unchecked: "未確認",
      available: "利用可能",
      granted: "許可済み",
      unsupported: "非対応（連打へ切替）",
      denied: "利用不可（連打へ切替）",
    };

    return (
      <div className="screen-stack">
        <div className="room-code-card">
          <span>ROOM CODE</span>
          <strong>{roomCode}</strong>
          <button type="button" onClick={() => navigator.clipboard?.writeText(roomCode)}>コピー</button>
        </div>

        <Panel>
          <div className="panel-heading">
            <div><span className="section-kicker">PLAYERS</span><h2>集結した人類</h2></div>
            <strong>{players.length}/5</strong>
          </div>
          <ul className="player-list">
            {players.map((player) => (
              <li key={player.id}>
                <span className="avatar">{Array.from(player.name)[0]}</span>
                <div><strong>{player.name}</strong><small>{player.id === "self" ? "あなた" : "デモプレイヤー"}</small></div>
                {player.isHost && <span className="mini-badge mini-badge--host">HOST</span>}
                <span className={`ready-dot ${player.isReady ? "ready-dot--on" : ""}`} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="device-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">DEVICE CHECK</span><h2>この端末で使える技</h2></div>
          </div>
          <div className="device-row"><span>⚡ 超連打</span><strong>利用可能</strong></div>
          <div className="device-row"><span>〰 スマホ振り</span><strong>{motionLabel[motionStatus]}</strong></div>
          <AppButton variant="ghost" onClick={checkMotion}>モーション機能を確認</AppButton>
        </Panel>

        <label className="ready-toggle">
          <input
            type="checkbox"
            checked={ownPlayer?.isReady ?? false}
            onChange={(event) => setPlayers((current) => current.map((player) => player.id === "self" ? { ...player, isReady: event.target.checked } : player))}
          />
          <span><b>準備OK</b><small>チェックするとゲームを開始できます</small></span>
        </label>

        <AppButton disabled={!allReady} onClick={() => startGame(hostPlayer?.id ?? "")}>
          {ownPlayer?.isHost ? "ゲームを開始する" : `${hostPlayer?.name ?? "ホスト"}がゲームを開始（デモ）`}
        </AppButton>
        {!ownPlayer?.isHost && allReady && (
          <p className="helper-copy">ローカル版では、ホスト役の開始操作もこの端末で再現します</p>
        )}
        {!allReady && <p className="helper-copy">4人以上・全員準備OKで開始できます</p>}
      </div>
    );
  };

  const renderRoundIntro = () => (
    <div className="center-stage">
      <span className="round-number">ROUND {String(roundNumber).padStart(2, "0")}</span>
      <p>今回の挑戦者は——</p>
      <div className="challenger-burst"><span>{Array.from(currentChallenger?.name ?? "?")[0]}</span></div>
      <h1>{currentChallenger?.name}</h1>
      <p className="muted">この端末で挑戦者役を操作します</p>
      <AppButton onClick={startAnswering}>お題を見る</AppButton>
    </div>
  );

  const renderAnswering = () => (
    <div className="screen-stack">
      <Timer remainingMs={remainingMs} totalMs={GAME_CONFIG.answerTimeMs} />
      <Panel className="prompt-card">
        <span className="section-kicker">OGIRI THEME</span>
        <h1>{prompt.text}</h1>
      </Panel>

      <div className="ai-thinking"><span className="ai-dot" />AIも同時に回答を生成中<span className="thinking-dots">•••</span></div>

      <label className="answer-field">
        <span>人類の回答</span>
        <textarea
          value={humanAnswerDraft}
          onChange={(event) => setHumanAnswerDraft(event.target.value.replace(/[\r\n]/g, ""))}
          placeholder="60文字以内で、ひとこと。"
          rows={4}
          maxLength={120}
          autoFocus
        />
        <div>
          <small>{!validation.valid && humanAnswerDraft.length > 0 ? validation.message : "確定後は変更できません"}</small>
          <strong className={Array.from(humanAnswerDraft).length > GAME_CONFIG.maxAnswerLength ? "counter--over" : ""}>
            {Array.from(humanAnswerDraft).length}/{GAME_CONFIG.maxAnswerLength}
          </strong>
        </div>
      </label>

      <AppButton disabled={!validation.valid || remainingSeconds === 0} onClick={() => submitAnswer(false)}>回答を確定する</AppButton>
    </div>
  );

  const renderVoting = () => (
    <div className="screen-stack">
      <Timer remainingMs={remainingMs} totalMs={GAME_CONFIG.voteTimeMs} />
      <div className="screen-heading screen-heading--compact">
        <span className="eyebrow">ANONYMOUS VOTE</span>
        <h1>どっちが面白い？</h1>
        <p>回答者の正体は、投票が終わるまで秘密。</p>
      </div>

      <Panel className="prompt-card prompt-card--small"><p>{prompt.text}</p></Panel>

      <div className="voter-turn" aria-live="polite">
        <span className="avatar avatar--small">{Array.from(currentVoter?.name ?? "?")[0]}</span>
        <p><b>{currentVoter?.name}</b> の投票 <small>{votes.length + 1}/{voters.length}</small></p>
      </div>

      <div className="answer-grid">
        <AnswerOption letter="A" answer={answerA} onSelect={() => castVote("A")} />
        <AnswerOption letter="B" answer={answerB} onSelect={() => castVote("B")} />
      </div>

      <div className="vote-progress" aria-label={`${votes.length}人投票済み`}>
        {voters.map((voter, index) => <span key={voter.id} className={index < votes.length ? "vote-progress__done" : ""} />)}
      </div>
      <p className="helper-copy">この端末で、挑戦者以外の3人を順番に操作しています</p>
    </div>
  );

  const renderReveal = () => {
    const humanWon = voteWinner === "human" && !humanForfeited;
    return (
      <div className="screen-stack">
        <div className={`result-banner result-banner--${humanWon ? "human" : "ai"}`}>
          <span>{humanForfeited ? "TIME UP" : "VOTE RESULT"}</span>
          <h1>{humanForfeited ? "人類、回答できず。" : humanWon ? "人類の勝利！" : "AIの勝利！"}</h1>
          {!humanForfeited && voteCounts.A === voteCounts.B && <p>AIと引き分けた。つまり人類の勝ちです。</p>}
        </div>

        <Panel className="prompt-card prompt-card--small"><p>{prompt.text}</p></Panel>
        <div className="answer-grid">
          <AnswerOption letter="A" answer={answerA} identity={answerOrder.A} voteCount={voteCounts.A} />
          <AnswerOption letter="B" answer={answerB} identity={answerOrder.B} voteCount={voteCounts.B} />
        </div>

        {!humanWon && (
          <div className="revenge-callout"><span>しかし——</span><strong>人類には、肉体がある。</strong></div>
        )}

        <AppButton onClick={continueFromReveal}>{humanWon ? "ラウンド結果へ" : "挽回チャレンジへ"}</AppButton>
      </div>
    );
  };

  const renderRevengeIntro = () => {
    const isTap = challengeType === "rapid_tap";
    const motionEnabled = motionStatus === "available" || motionStatus === "granted";
    return (
      <div className="center-stage revenge-stage">
        <span className="eyebrow eyebrow--danger">HUMANITY COMEBACK</span>
        <div className="challenge-icon">{isTap ? "⚡" : "〰"}</div>
        <h1>{isTap ? "超連打チャレンジ" : "スマホ振りチャレンジ"}</h1>
        <p className="challenge-rule">
          <strong>{isTap ? "5秒で35回" : "6秒で10回"}</strong>
          {isTap ? "ボタンを叩け！" : "スマートフォンを振れ！"}
        </p>
        <Panel className="challenge-note">
          <span>成功</span><b>人類 +1</b><i>／</i><span>失敗</span><b>AI +1</b>
        </Panel>
        {motionEnabled && (
          <button className="text-button" type="button" onClick={() => setChallengeType(isTap ? "shake" : "rapid_tap")}>
            {isTap ? "スマホ振りを試す" : "連打に切り替える"}
          </button>
        )}
        <AppButton variant="danger" onClick={startChallenge}>チャレンジ開始</AppButton>
      </div>
    );
  };

  const renderRevengeActive = () => {
    const isTap = challengeType === "rapid_tap";
    const target = isTap ? GAME_CONFIG.rapidTap.target : GAME_CONFIG.shake.target;
    const totalMs = isTap ? GAME_CONFIG.rapidTap.durationMs : GAME_CONFIG.shake.durationMs;
    const progress = Math.min(100, (challengeProgress / target) * 100);
    const finished = challengeStatus === "success" || challengeStatus === "failure";

    return (
      <div className="screen-stack challenge-active">
        {!finished && <Timer remainingMs={remainingMs} totalMs={totalMs} />}
        <div className="challenge-progress-copy">
          <span>{isTap ? "TAP COUNT" : "SHAKE COUNT"}</span>
          <strong>{challengeProgress}<small>/{target}</small></strong>
        </div>
        <div className="challenge-meter"><span style={{ width: `${progress}%` }} /></div>

        {!finished && isTap && (
          <button
            type="button"
            className="tap-target"
            style={{ touchAction: "none" }}
            onPointerDown={(event) => {
              if (!event.isPrimary) return;
              event.preventDefault();
              addChallengeProgress();
              navigator.vibrate?.(8);
            }}
          >
            <span>人類の</span>
            <strong>連打</strong>
            <small>TAP!</small>
          </button>
        )}

        {!finished && !isTap && (
          <div className="shake-target">
            <div>〰</div><strong>スマホを振れ！</strong><p>強く振るたびにカウント</p>
          </div>
        )}

        {finished && (
          <div className={`challenge-result challenge-result--${challengeStatus}`} role="status">
            <span>{challengeStatus === "success" ? "SUCCESS" : "FAILED"}</span>
            <h1>{challengeStatus === "success" ? "人類、土壇場で生還！" : "人類、力尽きる。"}</h1>
            <p>{challengeStatus === "success" ? "人類に1ポイント" : "AIに1ポイント"}</p>
          </div>
        )}

        {finished && <AppButton onClick={settleChallenge}>結果を確定する</AppButton>}
      </div>
    );
  };

  const renderRoundResult = () => (
    <div className="center-stage">
      <span className={`eyebrow ${lastPointWinner === "ai" ? "eyebrow--ai" : ""}`}>ROUND {roundNumber} COMPLETE</span>
      <ScoreStrip score={score} />
      <h1>{lastPointWinner === "human" ? "人類、1点を奪取。" : "AI、1点を獲得。"}</h1>
      <p className="muted">先に3ポイント取った側がゲームの勝者です。</p>
      <Panel className="next-challenger">
        <span>NEXT CHALLENGER</span>
        <strong>{players[(challengerIndex + 1) % players.length]?.name}</strong>
      </Panel>
      <AppButton onClick={startNextRound}>次のラウンドへ</AppButton>
    </div>
  );

  const renderGameResult = () => {
    const humanWon = winningSide === "human";
    return (
      <div className="screen-stack game-result-screen">
        <div className={`final-hero final-hero--${humanWon ? "human" : "ai"}`}>
          <span>FINAL RESULT</span>
          <ScoreStrip score={score} />
          <h1>{humanWon ? "みたかAI！\nこれが人類だ！" : "人類、\nアップデート失敗。"}</h1>
        </div>

        {mvp && (
          <Panel className="mvp-card">
            <span className="section-kicker">BEST HUMAN ANSWER</span>
            <p>「{mvp.humanAnswer}」</p>
            <small>{mvp.challengerName}・ROUND {mvp.roundNumber}</small>
          </Panel>
        )}

        <Panel>
          <div className="panel-heading"><div><span className="section-kicker">HISTORY</span><h2>全ラウンド</h2></div></div>
          <ol className="history-list">
            {roundHistory.map((record) => (
              <li key={record.roundNumber}>
                <span>{String(record.roundNumber).padStart(2, "0")}</span>
                <div><strong>{record.challengerName}</strong><small>{record.challengeResult ? `挽回 ${record.challengeResult === "success" ? "成功" : "失敗"}` : "投票で決着"}</small></div>
                <b className={`winner-tag winner-tag--${record.pointWinner}`}>{record.pointWinner === "human" ? "人類" : "AI"}</b>
              </li>
            ))}
          </ol>
        </Panel>

        <AppButton onClick={replay}>同じメンバーでもう一度</AppButton>
        <AppButton variant="secondary" onClick={resetToHome}>トップへ戻る</AppButton>
      </div>
    );
  };

  const contentByScreen: Record<Screen, () => React.ReactNode> = {
    home: renderHome,
    "room-form": renderRoomForm,
    lobby: renderLobby,
    "round-intro": renderRoundIntro,
    answering: renderAnswering,
    voting: renderVoting,
    reveal: renderReveal,
    "revenge-intro": renderRevengeIntro,
    "revenge-active": renderRevengeActive,
    "round-result": renderRoundResult,
    "game-result": renderGameResult,
  };

  return (
    <AppFrame
      screen={screen}
      roomCode={roomCode}
      score={score}
      roundNumber={roundNumber}
      onExit={resetToHome}
    >
      {contentByScreen[screen]()}
    </AppFrame>
  );
}

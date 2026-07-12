import { afterEach, describe, expect, it, vi } from "vitest";
import { GAME_CONFIG } from "../../shared/constants";
import { validateAnswer } from "../../shared/validation/answer";
import {
  generateAiAnswer,
  type AiEnv,
} from "./ai";

const VALID_ENV: AiEnv = {
  OPENAI_API_KEY: "test-api-key",
  OPENAI_MODEL: "test-model",
};

const VALID_MINIMAX_ENV: AiEnv = {
  AI_PROVIDER: "minimax",
  MINIMAX_API_KEY: "test-minimax-key",
  MINIMAX_MODEL: "test-minimax-model",
};

function responsePayload(answer: unknown): object {
  return {
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: JSON.stringify({ answer }),
          },
        ],
      },
    ],
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("generateAiAnswer", () => {
  it("Responses APIへモデル名・指示・お題だけを送信し、回答を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(responsePayload("レジが客より先に帰宅する")),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAiAnswer(
      { prompt: "絶対に行きたくないコンビニ。その特徴とは？" },
      VALID_ENV,
    );

    expect(result).toEqual({
      answer: "レジが客より先に帰宅する",
      usedFallback: false,
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as JsonBody;

    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer test-api-key",
    );
    expect(body.model).toBe("test-model");
    expect(body.instructions).toContain("60文字以内");
    expect(body.input[0].content[0].text).toContain(
      "絶対に行きたくないコンビニ。その特徴とは？",
    );
    expect(JSON.stringify(body)).not.toContain("humanAnswer");
    expect(JSON.stringify(body)).not.toContain("test-api-key");
  });

  it("MiniMax Chat Completionsへ専用キー・モデル・お題を送信する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "校長より先にAIが朝礼を始める" } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAiAnswer(
      { prompt: "未来の学校では当たり前になっていること" },
      VALID_MINIMAX_ENV,
    );

    expect(result).toEqual({
      answer: "校長より先にAIが朝礼を始める",
      usedFallback: false,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as MiniMaxJsonBody;

    expect(url).toBe("https://api.minimax.io/v1/chat/completions");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer test-minimax-key",
    );
    expect(body.model).toBe("test-minimax-model");
    expect(body.reasoning_split).toBe(true);
    expect(body.messages[0].content).toContain("60文字以内");
    expect(body.messages[1].content).toContain(
      "未来の学校では当たり前になっていること",
    );
    expect(JSON.stringify(body)).not.toContain("test-minimax-key");
    expect(JSON.stringify(body)).not.toContain("test-api-key");
  });

  it("MiniMaxの推論タグを回答本文から除外する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [
            {
              message: {
                content: "<think>回答を検討する</think>レジが先に帰宅する",
              },
            },
          ],
        }),
      ),
    );

    const result = await generateAiAnswer(
      { prompt: "変なコンビニとは？" },
      VALID_MINIMAX_ENV,
    );

    expect(result).toEqual({
      answer: "レジが先に帰宅する",
      usedFallback: false,
    });
  });

  it("8秒でリクエストを中止し、フォールバック回答を返す", async () => {
    vi.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        receivedSignal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pending = generateAiAnswer({ prompt: "未来の学校とは？" }, VALID_ENV);
    await vi.advanceTimersByTimeAsync(GAME_CONFIG.aiTimeoutMs);
    const result = await pending;

    expect(receivedSignal?.aborted).toBe(true);
    expect(result.usedFallback).toBe(true);
    expect(validateAnswer(result.answer).valid).toBe(true);
  });

  it.each([500, 429])("HTTP %iではフォールバック回答を返す", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, status)));

    const result = await generateAiAnswer({ prompt: "変な店とは？" }, VALID_ENV);

    expect(result.usedFallback).toBe(true);
    expect(validateAnswer(result.answer).valid).toBe(true);
  });

  it("通信エラーではフォールバック回答を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network error")));

    const result = await generateAiAnswer({ prompt: "変なAIとは？" }, VALID_ENV);

    expect(result.usedFallback).toBe(true);
  });

  it.each([
    [{ OPENAI_MODEL: "test-model" }, "APIキー未設定"],
    [{ OPENAI_API_KEY: "test-api-key" }, "モデル未設定"],
    [
      { AI_PROVIDER: "minimax", MINIMAX_MODEL: "test-minimax-model" },
      "MiniMax APIキー未設定",
    ],
    [
      { AI_PROVIDER: "minimax", MINIMAX_API_KEY: "test-minimax-key" },
      "MiniMaxモデル未設定",
    ],
    [{ AI_PROVIDER: "unknown" }, "未対応プロバイダー"],
  ] as const)("%sではAPIを呼ばずフォールバックする: %s", async (env, _label) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAiAnswer({ prompt: "未来の学校とは？" }, env);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.usedFallback).toBe(true);
  });

  it.each([
    ["空文字", responsePayload("")],
    ["空白のみ", responsePayload("   ")],
    ["改行", responsePayload("1行目\n2行目")],
    ["61文字以上", responsePayload("あ".repeat(61))],
    ["テキストなし", { output: [] }],
    ["不正なJSON", { output_text: "not-json" }],
  ])("不正レスポンス（%s）はフォールバックする", async (_label, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));

    const result = await generateAiAnswer({ prompt: "このAI、なぜポンコツ？" }, VALID_ENV);

    expect(result.usedFallback).toBe(true);
    expect(validateAnswer(result.answer).valid).toBe(true);
  });

  it("フォールバック回答はお題群から選ばれ、常に共通検証を通る", async () => {
    const prompts = [
      "絶対に行きたくないコンビニ。その特徴とは？",
      "未来の学校では当たり前になっていること",
      "このAI、ポンコツだな。なぜ？",
      "世界一弱そうな必殺技の名前",
    ];

    const results = await Promise.all(
      prompts.map((prompt) => generateAiAnswer({ prompt }, {})),
    );

    expect(new Set(results.map(({ answer }) => answer)).size).toBeGreaterThan(1);
    for (const result of results) {
      expect(result.usedFallback).toBe(true);
      expect(validateAnswer(result.answer).valid).toBe(true);
    }
  });
});

type JsonBody = {
  model: string;
  instructions: string;
  input: Array<{ content: Array<{ text: string }> }>;
};

type MiniMaxJsonBody = {
  model: string;
  reasoning_split: boolean;
  messages: Array<{ content: string }>;
};

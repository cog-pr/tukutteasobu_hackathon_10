import { GAME_CONFIG } from "../../shared/constants";
import { validateAnswer } from "../../shared/validation/answer";
import type { Env } from "../types/env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MINIMAX_CHAT_COMPLETIONS_URL =
  "https://api.minimax.io/v1/chat/completions";

const RESPONSE_INSTRUCTIONS = `あなたは日本語の大喜利に回答するAIです。
次のお題に対して、最も面白いと思う回答を1つだけ作成してください。

条件:
- 日本語で回答する
- 1行で回答する
- 60文字以内
- 解説を付けない
- 「回答：」などの接頭辞を付けない
- Markdownを使わない
- 実在人物への中傷や差別的な表現を避ける`;

const FALLBACK_GROUPS: ReadonlyArray<{
  keywords: readonly string[];
  answers: readonly string[];
}> = [
  {
    keywords: ["コンビニ", "店", "レストラン"],
    answers: [
      "入店した瞬間に閉店の音楽が流れる",
      "店員より先にレジが休憩へ入る",
      "おすすめ商品が毎日「帰宅」になっている",
    ],
  },
  {
    keywords: ["学校", "校長", "授業", "先生"],
    answers: [
      "校歌の二番から授業が始まる",
      "出席を取る先生が毎回転校してくる",
      "宿題の提出先が未来の自分になっている",
    ],
  },
  {
    keywords: ["AI", "ロボット", "スマートフォン"],
    answers: [
      "質問するたびに自信満々で天気の話をする",
      "充電すると本体より充電器が元気になる",
      "便利な機能ほど「近日公開」と表示される",
    ],
  },
  {
    keywords: [],
    answers: [
      "説明書の最後に「ここからは勘です」と書いてある",
      "成功すると失敗した人だけ拍手してくれる",
      "名前だけは強そうだが効果音が小声",
    ],
  },
];

export type GenerateAiAnswerInput = {
  prompt: string;
};

export type GenerateAiAnswerResult = {
  answer: string;
  usedFallback: boolean;
};

export type AiProvider = "openai" | "minimax";

export type AiEnv = Pick<
  Env,
  | "AI_PROVIDER"
  | "OPENAI_API_KEY"
  | "OPENAI_MODEL"
  | "MINIMAX_API_KEY"
  | "MINIMAX_MODEL"
>;

// 既存のimportを壊さないために残す。
export type OpenAiEnv = AiEnv;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashText(value: string): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

function getFallbackAnswer(prompt: string): string {
  const group =
    FALLBACK_GROUPS.find(
      ({ keywords }) =>
        keywords.length > 0 && keywords.some((keyword) => prompt.includes(keyword)),
    ) ?? FALLBACK_GROUPS[FALLBACK_GROUPS.length - 1];
  const answer = group.answers[hashText(prompt) % group.answers.length];
  const validation = validateAnswer(answer);

  if (!validation.valid) {
    return "人類の予想を超えて、先に休憩へ入った";
  }

  return validation.value;
}

function fallbackResult(prompt: string): GenerateAiAnswerResult {
  return { answer: getFallbackAnswer(prompt), usedFallback: true };
}

function extractOutputText(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return null;

  for (const outputItem of payload.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) continue;

    for (const contentItem of outputItem.content) {
      if (
        isRecord(contentItem) &&
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

function extractAnswer(payload: unknown): unknown {
  const outputText = extractOutputText(payload);
  if (outputText === null) return null;

  try {
    const parsed: unknown = JSON.parse(outputText);
    return isRecord(parsed) ? parsed.answer : null;
  } catch {
    return null;
  }
}

function extractMiniMaxAnswer(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return null;

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return null;

  const content = firstChoice.message.content;
  if (typeof content !== "string") return null;

  // reasoning_split非対応時に推論が混ざっても、回答本文だけを検証する。
  return content.replace(/<think>[\s\S]*?<\/think>/giu, "").trim();
}

function createOpenAiRequestBody(prompt: string, model: string) {
  return {
    model,
    instructions: RESPONSE_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: `お題: ${prompt}` }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ogiri_answer",
        strict: true,
        schema: {
          type: "object",
          properties: { answer: { type: "string" } },
          required: ["answer"],
          additionalProperties: false,
        },
      },
    },
    max_output_tokens: 256,
  };
}

function createMiniMaxRequestBody(prompt: string, model: string) {
  return {
    model,
    messages: [
      { role: "system", content: RESPONSE_INSTRUCTIONS },
      { role: "user", content: `お題: ${prompt}` },
    ],
    reasoning_split: true,
    thinking: { type: "disabled" },
    max_completion_tokens: 1024,
  };
}

type ProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  url: string;
};

function resolveProviderConfig(env: AiEnv): ProviderConfig | null {
  const requestedProvider = env.AI_PROVIDER?.trim().toLowerCase() || "openai";

  if (requestedProvider === "openai") {
    const apiKey = env.OPENAI_API_KEY?.trim();
    const model = env.OPENAI_MODEL?.trim();
    return apiKey && model
      ? { provider: "openai", apiKey, model, url: OPENAI_RESPONSES_URL }
      : null;
  }

  if (requestedProvider === "minimax") {
    const apiKey = env.MINIMAX_API_KEY?.trim();
    const model = env.MINIMAX_MODEL?.trim();
    return apiKey && model
      ? {
          provider: "minimax",
          apiKey,
          model,
          url: MINIMAX_CHAT_COMPLETIONS_URL,
        }
      : null;
  }

  return null;
}

export async function generateAiAnswer(
  input: GenerateAiAnswerInput,
  env: AiEnv,
): Promise<GenerateAiAnswerResult> {
  const prompt = input.prompt.trim();
  const providerConfig = resolveProviderConfig(env);

  if (!prompt || !providerConfig) {
    return fallbackResult(prompt);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    GAME_CONFIG.aiTimeoutMs,
  );

  try {
    const response = await fetch(providerConfig.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        providerConfig.provider === "openai"
          ? createOpenAiRequestBody(prompt, providerConfig.model)
          : createMiniMaxRequestBody(prompt, providerConfig.model),
      ),
      signal: controller.signal,
    });

    if (!response.ok) {
      return fallbackResult(prompt);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return fallbackResult(prompt);
    }

    const answer =
      providerConfig.provider === "openai"
        ? extractAnswer(payload)
        : extractMiniMaxAnswer(payload);
    const validation = validateAnswer(answer);
    if (!validation.valid) {
      return fallbackResult(prompt);
    }

    return { answer: validation.value, usedFallback: false };
  } catch {
    return fallbackResult(prompt);
  } finally {
    clearTimeout(timeoutId);
  }
}

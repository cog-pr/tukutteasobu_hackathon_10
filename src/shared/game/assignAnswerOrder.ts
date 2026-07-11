export type AnswerOrder = {
  A: "human" | "ai";
  B: "human" | "ai";
};

export function assignAnswerOrder(): AnswerOrder {
  if (Math.random() < 0.5) {
    return { A: "human", B: "ai" };
  }

  return { A: "ai", B: "human" };
}

import type { AnswerOrder } from '../types/game'
export type { AnswerOrder } from '../types/game'

export function assignAnswerOrder(): AnswerOrder {
  if (Math.random() < 0.5) {
    return { A: "human", B: "ai" };
  }

  return { A: "ai", B: "human" };
}

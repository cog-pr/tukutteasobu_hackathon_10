import type { Prompt } from '../types/game'

export type SelectNextPromptInput = {
  prompts: readonly Prompt[]
  usedPromptIds: readonly string[]
  random?: () => number
}

export type SelectNextPromptResult =
  | { ok: true; prompt: Prompt; usedPromptIds: string[] }
  | { ok: false; code: 'NO_PROMPTS_AVAILABLE' }

/**
 * Picks a prompt not yet used this game. Resets the used-list only once every
 * prompt has been shown (never partially resets while unused prompts remain).
 */
export function selectNextPrompt({ prompts, usedPromptIds, random = Math.random }: SelectNextPromptInput): SelectNextPromptResult {
  if (prompts.length === 0) return { ok: false, code: 'NO_PROMPTS_AVAILABLE' }

  const usedIdSet = new Set(usedPromptIds)
  const unused = prompts.filter((prompt) => !usedIdSet.has(prompt.id))
  const pool = unused.length > 0 ? unused : prompts
  const baseUsedIds = unused.length > 0 ? [...usedPromptIds] : []

  const prompt = pool[Math.floor(random() * pool.length)]
  return { ok: true, prompt, usedPromptIds: [...baseUsedIds, prompt.id] }
}

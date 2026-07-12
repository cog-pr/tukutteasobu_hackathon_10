import { describe, expect, it } from 'vitest'

import { selectNextPrompt } from './selectNextPrompt'

const prompts = [
  { id: 'p1', type: 'text' as const, text: 'お題1', category: 'normal' as const },
  { id: 'p2', type: 'text' as const, text: 'お題2', category: 'normal' as const },
  { id: 'p3', type: 'text' as const, text: 'お題3', category: 'normal' as const },
]

describe('selectNextPrompt', () => {
  it('picks an unused prompt and appends its id to usedPromptIds', () => {
    const result = selectNextPrompt({ prompts, usedPromptIds: ['p1'], random: () => 0 })

    expect(result).toEqual({ ok: true, prompt: prompts[1], usedPromptIds: ['p1', 'p2'] })
  })

  it('never re-picks an already used prompt while unused ones remain', () => {
    const result = selectNextPrompt({ prompts, usedPromptIds: ['p1', 'p2'], random: () => 0.9 })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.prompt.id).toBe('p3')
  })

  it('resets the used list only once every prompt has been shown', () => {
    const result = selectNextPrompt({ prompts, usedPromptIds: ['p1', 'p2', 'p3'], random: () => 0 })

    expect(result).toEqual({ ok: true, prompt: prompts[0], usedPromptIds: ['p1'] })
  })

  it('fails when there are no prompts at all', () => {
    expect(selectNextPrompt({ prompts: [], usedPromptIds: [] })).toEqual({ ok: false, code: 'NO_PROMPTS_AVAILABLE' })
  })
})

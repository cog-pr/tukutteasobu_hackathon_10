const MOCK_AI_ANSWERS = [
  '入口で会員登録、出口で退会手続きが必要',
  '店員より先にレジが休憩へ入る',
  '検索結果を全部「気のせいです」で返す',
] as const

/** Server版では同じシグネチャのAPI実装へ差し替える。 */
export async function generateAiAnswer(promptId: string): Promise<string> {
  const hash = Array.from(promptId).reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return MOCK_AI_ANSWERS[hash % MOCK_AI_ANSWERS.length]
}

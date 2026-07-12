export function generatePlayerId(): string {
  return `player_${crypto.randomUUID()}`;
}

export function generatePlayerToken(): string {
  return `token_${crypto.randomUUID()}`;
}

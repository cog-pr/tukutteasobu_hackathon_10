export function getRemainingMs(
  deadlineAt: number | null,
  now: number = Date.now(),
): number {
  if (deadlineAt === null) {
    return 0;
  }

  return Math.max(0, deadlineAt - now);
}

export function getRemainingSeconds(
  deadlineAt: number | null,
  now: number = Date.now(),
): number {
  return Math.ceil(getRemainingMs(deadlineAt, now) / 1000);
}

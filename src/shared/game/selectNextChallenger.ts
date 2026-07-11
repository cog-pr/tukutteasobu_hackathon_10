export type ChallengerPlayer = {
  id: string
  isOnline: boolean
}

export type SelectNextChallengerInput = {
  players: readonly ChallengerPlayer[]
  challengerQueue: readonly string[]
  previousChallengerId?: string | null
  random?: () => number
}

export type SelectNextChallengerResult = {
  nextChallengerId: string | null
  challengerQueue: string[]
}

function shuffle(ids: readonly string[], random: () => number): string[] {
  const shuffled = [...ids]

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ]
  }

  return shuffled
}

/**
 * Selects the next online challenger and returns the remaining order.
 * The input arrays are never mutated.
 */
export function selectNextChallenger({
  players,
  challengerQueue,
  previousChallengerId = null,
  random = Math.random,
}: SelectNextChallengerInput): SelectNextChallengerResult {
  const onlineIds = players
    .filter((player) => player.isOnline)
    .map((player) => player.id)
  const onlineIdSet = new Set(onlineIds)
  const seenIds = new Set<string>()

  let queue = challengerQueue.filter((id) => {
    if (!onlineIdSet.has(id) || seenIds.has(id)) {
      return false
    }

    seenIds.add(id)
    return true
  })

  if (queue.length === 0) {
    queue = shuffle(onlineIds, random)
  }

  if (queue.length > 1 && queue[0] === previousChallengerId) {
    const replacementIndex = queue.findIndex(
      (id) => id !== previousChallengerId,
    )
    ;[queue[0], queue[replacementIndex]] = [
      queue[replacementIndex],
      queue[0],
    ]
  }

  const [nextChallengerId = null, ...remainingQueue] = queue

  return {
    nextChallengerId,
    challengerQueue: remainingQueue,
  }
}

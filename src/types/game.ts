export type ChallengeType = 'rapid_tap' | 'shake' | 'smile' | 'color' | 'shout'

export type ChallengeSupport = 'available' | 'granted' | 'unchecked' | 'unsupported'

export type Player = {
  id: string
  name: string
  joinOrder: number
  isHost: boolean
  isOnline: boolean
  isReady: boolean
  supportedChallenges: ChallengeType[]
}

export type RoundHistoryEntry = {
  roundNumber: number
  challengerName: string
  winner: 'human' | 'ai'
  wentToRevenge: boolean
}

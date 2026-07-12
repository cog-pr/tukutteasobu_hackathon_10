import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { CHALLENGE_CONFIG } from '../shared/constants'

const REQUIRED_TAPS = CHALLENGE_CONFIG.rapidTap.requiredCount

export function RevengeWaitingPage() {
  const { roomState } = useRoomSocketContext()
  const round = roomState?.round
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  const challengerName = roomState?.players.find((player) => player.id === round?.challengerId)?.name ?? ''
  const progress = round ? round.challengeProgress : 0

  return (
    <PhoneScreen className="items-center justify-center gap-4 text-center">
      <Card className="border-[#46d6e7] bg-[#e8fbfd]"><p className="text-sm font-black">超連打チャレンジ中</p><p className="mt-1 text-lg font-black">{challengerName}が挽回を狙っています……</p></Card>
      <Card>
        <p className="text-xs">進捗</p>
        <p className="text-3xl font-black">{progress} / {REQUIRED_TAPS}</p>
      </Card>
      <p className="text-sm text-neutral-400">残り{remaining}秒</p>
    </PhoneScreen>
  )
}

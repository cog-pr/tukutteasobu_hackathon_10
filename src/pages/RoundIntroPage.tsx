import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'

export function RoundIntroPage() {
  const { roomState } = useRoomSocketContext()
  const round = roomState?.round
  const challenger = roomState?.players.find((player) => player.id === round?.challengerId)
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  return (
    <PhoneScreen className="items-center justify-between text-center gap-6">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
      <div>
        <span className="rounded-full bg-[#17191f] px-3 py-1 text-[10px] font-black tracking-[0.15em] text-white">ROUND {round?.roundNumber ?? 1}</span>
        <p className="mt-6 text-base text-neutral-500">今回の挑戦者は……</p>
        <div className="mx-auto mt-5 grid h-28 w-28 -rotate-3 place-items-center rounded-full border-[3px] border-[#17191f] bg-[#f4d13f] shadow-[9px_8px_0_#17191f]"><span className="text-4xl font-black">{challenger?.name[0]}</span></div>
        <p className="mt-5 text-4xl font-black">{challenger?.name}</p>
        <p className="text-sm text-neutral-500">さん！</p>
      </div>
      <p className="text-sm text-neutral-400">まもなく回答開始……（{remaining}）</p>
    </PhoneScreen>
  )
}

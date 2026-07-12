import { AnswerCard } from '../components/AnswerCard'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { TimerBar } from '../components/TimerBar'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { GAME_CONFIG } from '../shared/constants'
import type { VoteChoice } from '../shared/types/game'

export function VotingPage() {
  const { roomState, connectionStatus, castVote } = useRoomSocketContext()
  const round = roomState?.round
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  const hasVoted = round && !round.isRevealed && round.hasVoted
  const canVote = connectionStatus === 'connected' && remaining > 0 && !hasVoted

  if (hasVoted) {
    return (
      <PhoneScreen className="items-center justify-center gap-4 text-center">
        <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
        <Card>
          <p className="text-base font-bold text-neutral-900">投票を受け付けました。</p>
          <p className="mt-2 text-sm text-neutral-500">他の人の投票を待っています…</p>
        </Card>
      </PhoneScreen>
    )
  }

  const vote = (choice: VoteChoice) => { if (canVote) castVote(choice) }

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
      <p className="text-center text-lg font-black">どっちが面白い？</p>
      <Card><p className="text-sm font-bold">Q. {round && !round.isRevealed ? round.prompt.text : ''}</p></Card>
      <div className="flex justify-end"><CountdownBadge remainingSeconds={remaining} /></div>
      <TimerBar remainingSeconds={remaining} totalSeconds={GAME_CONFIG.voteTimeMs / 1000} />
      <AnswerCard label="A" text={round && !round.isRevealed ? round.answerA ?? '' : ''} disabled={!canVote} onClick={() => vote('A')} />
      <AnswerCard label="B" text={round && !round.isRevealed ? round.answerB ?? '' : ''} disabled={!canVote} onClick={() => vote('B')} />
    </PhoneScreen>
  )
}

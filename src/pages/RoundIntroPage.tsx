import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { useLocalGame } from '../client/hooks/useLocalGame'

export function RoundIntroPage() {
  const navigate = useNavigate(); const { state, actions } = useLocalGame()
  const challenger = state.players.find((player) => player.id === state.round?.challengerId)
  return <PhoneScreen className="items-center justify-between text-center gap-6">
    <ScoreBoard score={state.score} />
    <div><span className="rounded-full bg-[#17191f] px-3 py-1 text-[10px] font-black tracking-[0.15em] text-white">ROUND {state.roundNumber}</span><p className="mt-6 text-base text-neutral-500">今回の挑戦者は……</p><div className="mx-auto mt-5 grid h-28 w-28 -rotate-3 place-items-center rounded-full border-[3px] border-[#17191f] bg-[#f4d13f] shadow-[9px_8px_0_#17191f]"><span className="text-4xl font-black">{challenger?.name[0]}</span></div><p className="mt-5 text-4xl font-black">{challenger?.name}</p><p className="text-sm text-neutral-500">さん！</p></div>
    <Button onClick={() => { actions.beginAnswering(); navigate('/answering/challenger') }}>回答を始める</Button>
  </PhoneScreen>
}

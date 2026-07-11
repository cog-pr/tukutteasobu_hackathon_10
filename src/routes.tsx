import type { JSX } from 'react'
import { AnsweringChallengerPage } from './pages/AnsweringChallengerPage'
import { AnsweringWaitingPage } from './pages/AnsweringWaitingPage'
import { CreateRoomPage } from './pages/CreateRoomPage'
import { FinalResultPage } from './pages/FinalResultPage'
import { JoinRoomPage } from './pages/JoinRoomPage'
import { LobbyPage } from './pages/LobbyPage'
import { RevealPage } from './pages/RevealPage'
import { RevengePage } from './pages/RevengePage'
import { RoundIntroPage } from './pages/RoundIntroPage'
import { TopPage } from './pages/TopPage'
import { VotingChallengerWaitPage } from './pages/VotingChallengerWaitPage'
import { VotingPage } from './pages/VotingPage'

export type RouteEntry = {
  path: string
  label: string
  description: string
  element: JSX.Element
}

/**
 * 画面一覧(開発用)ページとルーティング定義を1箇所にまとめ、
 * 対象画面を個別に確認できるようにする。
 */
export const ROUTES: RouteEntry[] = [
  { path: '/', label: 'トップ画面', description: 'タイトル・遊び方・ルーム作成/参加', element: <TopPage /> },
  { path: '/rooms/new', label: 'ルーム作成画面', description: 'プレイヤー名を入力してルームコードを発行', element: <CreateRoomPage /> },
  { path: '/rooms/join', label: 'ルーム参加画面', description: 'ルームコードとプレイヤー名を入力', element: <JoinRoomPage /> },
  { path: '/lobby', label: 'ロビー画面', description: '参加者一覧・準備状態・ゲーム開始', element: <LobbyPage /> },
  { path: '/round-intro', label: 'ラウンド開始画面', description: '挑戦者の発表演出', element: <RoundIntroPage /> },
  { path: '/answering/challenger', label: '回答画面(挑戦者)', description: 'お題への回答入力・確定', element: <AnsweringChallengerPage /> },
  { path: '/answering/waiting', label: '回答待ち画面(ほかのプレイヤー)', description: '挑戦者とAIの回答待ち', element: <AnsweringWaitingPage /> },
  { path: '/voting', label: '投票画面', description: '回答A・Bへ投票', element: <VotingPage /> },
  { path: '/voting/waiting', label: '投票中の待機画面(挑戦者)', description: '挑戦者は投票結果を待つのみ', element: <VotingChallengerWaitPage /> },
  { path: '/reveal', label: '回答公開画面', description: '正体・投票数・勝者・得点変動', element: <RevealPage /> },
  { path: '/revenge', label: '挽回チャレンジ画面', description: '超連打チャレンジの進行', element: <RevengePage /> },
  { path: '/result', label: '最終結果画面', description: '最終得点・ラウンド結果・MVP回答', element: <FinalResultPage /> },
]

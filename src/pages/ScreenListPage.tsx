import { Link } from 'react-router-dom'
import { PhoneScreen } from '../components/PhoneScreen'
import { ROUTES } from '../routes'

/**
 * 開発用の画面一覧。対象画面を個別に確認するための仮の導線。
 */
export function ScreenListPage() {
  return (
    <PhoneScreen bare>
      <div className="pt-3">
        <h1 className="mb-1 text-lg font-bold text-neutral-900">画面一覧（開発用）</h1>
        <p className="mb-4 text-xs text-neutral-400">
          本番の画面遷移はゲーム進行にもとづきます。ここでは確認用に各画面へ直接移動できます。
          ロビー以降の画面はルームに参加していないと接続待ち表示のままか、正しいフェーズへ自動的に戻されます。
        </p>
        <ul className="flex flex-col gap-2">
          {ROUTES.map((route) => (
            <li key={route.path}>
              <Link
                to={route.path}
                className="block rounded-[13px] border border-[#d8d3c9] bg-[#fffdf8] px-4 py-3 shadow-[0_4px_0_rgba(37,36,32,0.07)] transition hover:-translate-y-0.5 hover:border-[#17191f]"
              >
                <p className="font-bold text-neutral-900">{route.label}</p>
                <p className="text-xs text-neutral-400">{route.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PhoneScreen>
  )
}

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
        </p>
        <ul className="flex flex-col gap-2">
          {ROUTES.map((route) => (
            <li key={route.path}>
              <Link
                to={route.path}
                className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:border-neutral-400"
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

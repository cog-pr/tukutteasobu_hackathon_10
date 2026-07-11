import { Link } from 'react-router-dom'

/**
 * 開発中に各画面を個別に確認するための仮の導線。
 * 本番の画面仕様には存在しない開発用リンクであることが分かるよう控えめに表示する。
 */
export function DevNavLink() {
  return (
    <div className="mb-2 flex justify-end">
      <Link
        to="/screens"
        className="rounded-full border border-neutral-300 bg-white px-2 py-1 text-[10px] text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600"
      >
        画面一覧（開発用）
      </Link>
    </div>
  )
}

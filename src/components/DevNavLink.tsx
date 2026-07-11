import { Link } from 'react-router-dom'

/**
 * 開発中に各画面を個別に確認するための仮の導線。
 * 本番の画面仕様には存在しない開発用リンクであることが分かるよう控えめに表示する。
 */
export function DevNavLink() {
  return (
    <Link
      to="/screens"
      className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[9px] font-bold text-white/50 transition hover:border-white/30 hover:text-white"
    >
      画面一覧
    </Link>
  )
}

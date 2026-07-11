import type { ReactNode } from 'react'
import { DevNavLink } from './DevNavLink'

type PhoneScreenProps = {
  children: ReactNode
  className?: string
  bare?: boolean
}

/**
 * 幅375pxのスマートフォン縦画面を基準にした共通レイアウト。
 * PCでは同じ最大幅で中央表示し、横スクロールが出ないようにする。
 */
export function PhoneScreen({ children, className = '', bare = false }: PhoneScreenProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-100 text-neutral-900">
      <div
        className={`mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-neutral-50 px-4 pb-8 ${bare ? '' : 'pt-3'} ${className}`}
      >
        {!bare && <DevNavLink />}
        {children}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { DevNavLink } from './DevNavLink'

type PhoneScreenProps = {
  children: ReactNode
  className?: string
  bare?: boolean
}

/**
 * 幅375pxのスマートフォン縦画面を基準にした共通レイアウト。
 * PCでは最大460pxで中央表示し、横スクロールが出ないようにする。
 */
export function PhoneScreen({ children, className = '', bare = false }: PhoneScreenProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0c0e13] text-[#17191f] md:bg-[radial-gradient(circle_at_15%_0%,rgba(70,214,231,0.13),transparent_28rem),radial-gradient(circle_at_90%_100%,rgba(244,209,63,0.12),transparent_30rem)]">
      <div className="mx-auto min-h-screen w-full max-w-[460px] overflow-hidden bg-[#f5f1e8] shadow-[0_0_80px_rgba(0,0,0,0.42)]">
        {!bare && (
          <header className="flex min-h-[66px] items-center gap-2.5 border-b border-white/10 bg-[#11131a] px-4 py-3 text-white">
            <div className="grid h-11 w-11 shrink-0 -rotate-2 place-items-center rounded-[13px] border border-white/20 bg-[#191c24] text-xs font-black tracking-tighter">
              <span><b className="text-[#e5484d]">人</b><i className="mx-0.5 not-italic text-white/30">/</i><b className="text-[#46d6e7]">AI</b></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black tracking-[0.06em]">たかがAI、あがけ人類</p>
            </div>
            <DevNavLink />
          </header>
        )}
        <main
          className={`flex w-full flex-col px-[18px] pb-[max(30px,env(safe-area-inset-bottom))] pt-5 ${bare ? 'min-h-screen' : 'min-h-[calc(100vh-66px)]'} ${className}`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

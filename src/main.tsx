import { StrictMode, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  accent: 'red' | 'yellow'
  eyebrow: string
  icon: ReactNode
}

function ActionButton({ accent, eyebrow, icon, children, className = '', ...props }: ActionButtonProps) {
  return (
    <button type="button" className={`action-button action-button--${accent} ${className}`} {...props}>
      <span className="action-button__icon" aria-hidden="true">{icon}</span>
      <span className="relative z-10 flex flex-col items-start leading-none">
        <span className="mb-1.5 text-[9px] font-black tracking-[0.22em] opacity-55 sm:text-[10px]">{eyebrow}</span>
        <span className="text-[clamp(1.25rem,5vw,1.75rem)] font-black tracking-tight">{children}</span>
      </span>
      <span className="action-button__arrow" aria-hidden="true">→</span>
    </button>
  )
}

const DoorIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M14 12h.01" />
  </svg>
)

const JoinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10 17 5-5-5-5M15 12H3M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
  </svg>
)

function HomePage() {
  return (
    <main className="studio-bg relative min-h-[100svh] overflow-hidden text-[#21170d] selection:bg-[#d94735] selection:text-white">
      <div className="paper-grain" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col items-center justify-center px-5 py-10 sm:px-10 sm:py-14">
        <div className="mb-8 border-y-2 border-[#21170d] px-5 py-2 sm:mb-12">
          <p className="text-center text-[10px] font-black tracking-[0.2em] sm:text-xs">人間 vs 人工知能　爆笑一本勝負</p>
        </div>

        <section className="w-full text-center" aria-labelledby="game-title">
          <p className="title-kicker">たかが</p>
          <h1 id="game-title" className="game-title" aria-label="たかがAI、あがけ人類">
            <span className="title-ai">AI</span><span className="title-comma">、</span>
            <span className="title-human">あがけ人類</span>
          </h1>
        </section>

        <p className="mt-10 max-w-2xl text-center text-xs font-bold tracking-wide text-[#21170d]/65 sm:mt-14 sm:text-base">
          お題に答えて、笑わせろ。AIに人間の意地を見せつけろ！
        </p>

        <nav className="mt-8 grid w-full max-w-2xl gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5" aria-label="ゲームメニュー">
          <ActionButton accent="red" eyebrow="HOST A BATTLE" icon={<DoorIcon />}>ルームを作る</ActionButton>
          <ActionButton accent="yellow" eyebrow="JOIN THE BATTLE" icon={<JoinIcon />}>ルーム参加</ActionButton>
        </nav>

        <p className="mt-8 text-center text-[9px] font-bold tracking-[0.22em] text-[#21170d]/40 sm:text-[10px]">
          笑いのセンスに、機械も人間も関係ない。
        </p>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><HomePage /></StrictMode>,
)

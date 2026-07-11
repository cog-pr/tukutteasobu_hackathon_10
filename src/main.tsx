import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">開発環境の準備ができました</h1>
        <p className="mt-4 text-slate-400">React + Vite + TypeScript + Tailwind CSS</p>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


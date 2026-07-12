import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameplayLayout } from './pages/GameplayLayout'
import { ScreenListPage } from './pages/ScreenListPage'
import { ROUTES } from './routes'
import './styles.css'

function App() {
  const gameplayRoutes = ROUTES.filter((route) => route.layout === 'gameplay')
  const standaloneRoutes = ROUTES.filter((route) => route.layout !== 'gameplay')
  return (
    <HashRouter>
      <Routes>
        {standaloneRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route element={<GameplayLayout />}>
          {gameplayRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="/screens" element={<ScreenListPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

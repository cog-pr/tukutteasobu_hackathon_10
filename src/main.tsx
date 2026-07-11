import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrototypeApp } from './client/PrototypeApp'
import { ScreenListPage } from './pages/ScreenListPage'
import { ROUTES } from './routes'
import './styles.css'

function OriginalUiApp() {
  return (
    <HashRouter>
      <Routes>
        {ROUTES.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="/screens" element={<ScreenListPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

const showOriginalUi = new URLSearchParams(window.location.search).get('ui') === 'original'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showOriginalUi ? <OriginalUiApp /> : <PrototypeApp />}
  </StrictMode>,
)

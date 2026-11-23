import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { initAnalytics } from './services/analytics'
import { initPushEventCapture } from './services/pushEvents'

// Register the PWA service worker (built by vite-plugin-pwa from src/sw.ts).
// `immediate` registers right away; registerType autoUpdate keeps clients fresh.
registerSW({ immediate: true })

// Track 0 instrumentation: no-ops unless VITE_POSTHOG_KEY is set at build time.
initAnalytics()
initPushEventCapture()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

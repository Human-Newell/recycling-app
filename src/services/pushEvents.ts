// Window-side relay for push notification clicks.
//
// The service worker's notificationclick handler posts
// { type: 'push_clicked', kind, url, clickedAt } to the client it is about to
// focus. This module listens for that message and re-emits it on `window` as
// the `ecoscan:push-clicked` CustomEvent, so app code (analytics) can capture
// the click without importing anything from the service worker.
//
// Init is a single line in main.tsx:
//   import { initPushEventCapture } from '@/services/pushEvents'
//   initPushEventCapture()

export const PUSH_CLICKED_EVENT = 'ecoscan:push-clicked'

export interface PushClickedDetail {
  kind?: string
  url?: string
  clickedAt?: number
}

let initialized = false

export function initPushEventCapture(): void {
  if (initialized) return
  if (!('serviceWorker' in navigator)) return
  initialized = true

  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data as (PushClickedDetail & { type?: string }) | null | undefined
    if (!data || data.type !== 'push_clicked') return

    window.dispatchEvent(
      new CustomEvent<PushClickedDetail>(PUSH_CLICKED_EVENT, {
        detail: {
          kind: data.kind,
          url: data.url,
          clickedAt: data.clickedAt,
        },
      })
    )
  })
}

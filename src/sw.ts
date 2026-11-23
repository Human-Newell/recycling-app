/// <reference lib="webworker" />

import { getPushDistinctId } from './services/pushIdentity'

// Custom EcoScan service worker (vite-plugin-pwa, injectManifest strategy).
// At build time the precache manifest is injected in place of
// `self.__WB_MANIFEST`. All URL resolution is relative to the SW scope so the
// app works under any deployment base path (e.g. GitHub Pages /recycling-app/).
//
// Note: workbox-precaching is not directly resolvable in this (pnpm) project,
// so precaching is implemented manually over the injected manifest — same
// revision-keyed cache entries workbox would create.

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: ReadonlyArray<{ url: string; revision: string | null }>
}

const PRECACHE = 'ecoscan-precache-v1'
const RUNTIME = 'ecoscan-runtime-v1'

// Live-data hosts that must never be cached or served from cache
// (Supabase REST/auth/storage, AI providers).
const BYPASS_HOSTS = ['supabase.co', 'huggingface.co', 'nyckel.com']

const manifest = self.__WB_MANIFEST
const precacheUrls = manifest.map((entry) =>
  entry.revision ? `${entry.url}?__WB_REVISION__=${entry.revision}` : entry.url
)

// Precached app shell used as the navigation fallback for SPA routes.
// 'index.html' is relative to the SW location, i.e. base-path aware.
const navigateFallbackUrl = precacheUrls.find((url) => url.endsWith('index.html'))

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(precacheUrls))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Also cleans up caches left by the previous hand-rolled SW
            // (ecoscan-v2 / ecoscan-static-v2 / ecoscan-dynamic-v2).
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function shouldBypass(requestUrl: URL): boolean {
  if (BYPASS_HOSTS.some((host) => requestUrl.hostname.endsWith(host))) return true
  // Same-host auth endpoints (covers token refresh routes if ever co-hosted).
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/auth/')) {
    return true
  }
  return false
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return
  if (shouldBypass(requestUrl)) return

  // SPA navigations: network first, fall back to the precached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = navigateFallbackUrl ? await caches.match(navigateFallbackUrl) : undefined
        return shell ?? new Response('Offline', { status: 503, statusText: 'Offline' })
      })
    )
    return
  }

  // Same-origin assets: cache first, then network (populating the runtime cache).
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(RUNTIME).then((cache) => cache.put(request, clone))
        }
        return response
      })()
    )
  }
  // Cross-origin (non-bypassed) requests are left to the network.
})

interface PushPayload {
  title?: string
  body?: string
  icon?: string
  tag?: string
  url?: string
  kind?: string
}

// --- Analytics from the service worker --------------------------------------
//
// The SW cannot use posthog-js or localStorage, so push events are POSTed
// straight to the PostHog ingestion API. VITE_* values are inlined at build
// time (vite-plugin-pwa compiles this file through the main Vite config).
// Everything below hard-no-ops — zero network calls, zero IndexedDB access —
// unless VITE_POSTHOG_KEY was set at build time.

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

async function captureInSW(event: string, props: Record<string, unknown>): Promise<void> {
  if (!POSTHOG_KEY) return
  try {
    // The distinct id is persisted by pushSubscription.ts at subscribe time.
    // Skip capture entirely when it is missing rather than sending anonymous.
    const distinctId = await getPushDistinctId()
    if (!distinctId) return

    await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...props, $lib: 'ecoscan-sw' },
      }),
      keepalive: true,
    })
  } catch {
    // Fire-and-forget: analytics must never break the notification.
  }
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  try {
    payload = (event.data?.json() as PushPayload | undefined) ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }

  // Resolve icons against the registration scope (subpath-safe).
  const icon = new URL(payload.icon || 'icon-192.png', self.registration.scope).href
  const kind = payload.kind || 'generic'

  event.waitUntil(
    self.registration
      .showNotification(payload.title || 'EcoScan', {
        body: payload.body || 'You have a new update from EcoScan',
        icon,
        badge: icon,
        tag: payload.tag || 'ecoscan-notification',
        data: {
          url: payload.url || './',
          kind,
        },
      })
      // Capture only once the notification actually displayed; the keepalive'd
      // fetch runs inside waitUntil so the SW stays alive for the send without
      // delaying the notification itself.
      .then(() => captureInSW('push_received', { kind }))
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Resolve the target URL against the scope, never against the origin root
  // (important when deployed under a subpath like /recycling-app/).
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href
  const kind = event.notification.data?.kind

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          // Only focus/redirect clients that live inside our scope.
          if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
            // Relay the click to the app before focusing: pushEvents.ts turns
            // this message into the `ecoscan:push-clicked` window event.
            try {
              client.postMessage({
                type: 'push_clicked',
                kind,
                url: target,
                clickedAt: Date.now(),
              })
            } catch {
              // The client may have shut down between matchAll and now.
            }
            try {
              if (new URL(client.url).href !== target) {
                await client.navigate(target)
              }
            } catch {
              // Navigation can fail (e.g. cross-origin); focusing is enough.
            }
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      })
  )
})

export {}

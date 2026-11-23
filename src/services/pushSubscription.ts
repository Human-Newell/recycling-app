import { supabase } from '@/integrations/supabase/client'
import { setPushDistinctId } from '@/services/pushIdentity'

export interface PushSubscriptionResult {
  ok: boolean
  reason?: string
}

// Web Push applicationServerKey expects the raw key bytes, so the VAPID
// public key must be decoded from base64url.
// Typed as <ArrayBuffer> (not the generic default ArrayBufferLike) so it
// satisfies BufferSource under the newer TS lib definitions.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

/**
 * Subscribes the browser to Web Push and upserts the subscription into the
 * Supabase `push_subscriptions` table.
 *
 * Never throws — always resolves with { ok, reason? } so callers can
 * fire-and-forget it after the user grants notification permission.
 */
export async function subscribeToPush(): Promise<PushSubscriptionResult> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, reason: 'unsupported' }
    }

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission' }
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
    if (!vapidKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY is not set — push subscription skipped')
      return { ok: false, reason: 'no-key' }
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    if (!supabase) {
      return { ok: false, reason: 'no-supabase' }
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return { ok: false, reason: 'not-authenticated' }
    }

    // Persist the Supabase user id as the PostHog distinct id so the service
    // worker can attribute push_received / push_clicked events to this user
    // (the SW has no localStorage and cannot run the analytics client).
    // Fire-and-forget: an IndexedDB failure must never fail the subscription.
    void setPushDistinctId(userData.user.id).catch(() => {})

    const json = subscription.toJSON()
    const keys = json.keys as { p256dh?: string; auth?: string } | undefined
    if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
      return { ok: false, reason: 'invalid-subscription' }
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userData.user.id,
        endpoint: json.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      return { ok: false, reason: error.message }
    }

    return { ok: true }
  } catch (error) {
    console.warn('Push subscription failed:', error)
    return { ok: false, reason: 'error' }
  }
}

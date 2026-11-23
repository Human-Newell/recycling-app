// PostHog distinct-id storage shared by the app and the service worker.
//
// The service worker cannot read localStorage and has no access to the
// analytics client, so pushSubscription.ts persists the Supabase user id here
// when push is subscribed; sw.ts reads it back to attribute push_received /
// push_clicked events. idb-keyval works in both window and SW contexts.

import { createStore, del, get, set } from 'idb-keyval'

const DB_NAME = 'ecoscan-push'
const STORE_NAME = 'push-identity'

// IndexedDB key under which the current user's PostHog distinct id is stored.
export const PUSH_DISTINCT_ID_KEY = 'posthog-distinct-id'

// Dedicated named store so identity data never mixes with other idb-keyval users.
const identityStore = createStore(DB_NAME, STORE_NAME)

export async function setPushDistinctId(id: string): Promise<void> {
  await set(PUSH_DISTINCT_ID_KEY, id, identityStore)
}

export async function getPushDistinctId(): Promise<string | null> {
  const id = await get<string>(PUSH_DISTINCT_ID_KEY, identityStore)
  return typeof id === 'string' && id.length > 0 ? id : null
}

// Clears the stored id on logout so a later session's pushes are never
// attributed to the previous user. Logout lives in AuthContext.logout
// (src/contexts/AuthContext.tsx) — wiring it there is tracked separately.
export async function clearPushDistinctId(): Promise<void> {
  await del(PUSH_DISTINCT_ID_KEY, identityStore)
}

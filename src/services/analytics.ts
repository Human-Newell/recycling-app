// Analytics wrapper (ROADMAP.md "Track 0 — Instrumentation").
//
// The only module in the app that touches posthog-js. initAnalytics() is
// called once from src/main.tsx; when VITE_POSTHOG_KEY is absent every
// exported function is a safe no-op (a dev-only console.debug explains why),
// so nothing breaks locally or in prod until a key is added.
//
// Event names and properties mirror the Track 0 event table in ROADMAP.md.
// Events for flows that don't exist yet (litter loop, corrections, programs)
// are exported types only — wire them up as those tracks land. push_received
// is sent from src/sw.ts directly (a service worker cannot load posthog-js);
// push_clicked can be captured window-side where that relay is handled.
import posthog from 'posthog-js';

/** Which product loop the scan belongs to. `found_litter` arrives with Track L. */
export type ScanMode = 'my_item' | 'found_litter';

/** Which picker started the scan. */
export type ScanSource = 'camera' | 'gallery';

/** AI classifier used for a scan. Mirrors apiService's AIProvider union. */
export type AiProvider = 'huggingface' | 'nyckel' | 'mock';

/** Track 0 event names (ROADMAP.md event table). */
export const ANALYTICS_EVENTS = {
  ScanStarted: 'scan_started',
  AiResult: 'ai_result',
  ScanConfirmed: 'scan_confirmed',
  LitterReported: 'litter_reported',
  LitterClaimed: 'litter_claimed',
  LitterCleaned: 'litter_cleaned',
  VerdictRated: 'verdict_rated',
  CorrectionSubmitted: 'correction_submitted',
  CorrectionVote: 'correction_vote',
  ProgramJoined: 'program_joined',
  ProgramReportFiled: 'program_report_filed',
  PushReceived: 'push_received',
  PushClicked: 'push_clicked',
} as const;

// Declared as type aliases (not interfaces) so they carry implicit index
// signatures and satisfy posthog-js's Record<string, any> parameter types.
export type ScanStartedProps = {
  mode: ScanMode;
  source: ScanSource;
};

export type AiResultProps = {
  provider: AiProvider;
  material: string;
  /** Classifier confidence, 0-100. */
  confidence: number;
  /** Wall-clock milliseconds spent in apiService.identifyItem. */
  latency_ms: number;
};

export type ScanConfirmedProps = {
  mode: ScanMode;
  material: string;
  /** Track 1: whether a region-specific verdict was shown. */
  had_local_verdict: boolean;
  /** Track 1: region whose rules applied; null until regions exist. */
  region_id: string | null;
};

export type LitterReportedProps = {
  material: string;
  brand?: string;
  location_context: string;
};

export type LitterClaimedProps = {
  self_cleaned: boolean;
  minutes?: number;
};

export type LitterCleanedProps = {
  self_cleaned: boolean;
  minutes?: number;
};

export type VerdictRatedProps = {
  /** "Was this right?" micro-vote on a verdict. */
  helpful: boolean;
  region_id?: string | null;
};

export type CorrectionSubmittedProps = {
  /** Track 2's two-way first tap: wrong material or wrong rule. */
  correction_type: 'wrong_material' | 'wrong_rule';
  suggested_material?: string;
};

export type CorrectionVoteProps = {
  /** Vote on another user's correction. */
  vote: 'confirm' | 'reject';
};

export type ProgramJoinedProps = {
  program_id: string;
  org_type: string;
};

export type ProgramReportFiledProps = {
  program_id: string;
  org_type: string;
};

export type PushReceivedProps = {
  kind: string;
};

export type PushClickedProps = {
  kind: string;
};

/** Track 0 event table: event name -> required properties. */
export type AnalyticsEventProps = {
  [ANALYTICS_EVENTS.ScanStarted]: ScanStartedProps;
  [ANALYTICS_EVENTS.AiResult]: AiResultProps;
  [ANALYTICS_EVENTS.ScanConfirmed]: ScanConfirmedProps;
  [ANALYTICS_EVENTS.LitterReported]: LitterReportedProps;
  [ANALYTICS_EVENTS.LitterClaimed]: LitterClaimedProps;
  [ANALYTICS_EVENTS.LitterCleaned]: LitterCleanedProps;
  [ANALYTICS_EVENTS.VerdictRated]: VerdictRatedProps;
  [ANALYTICS_EVENTS.CorrectionSubmitted]: CorrectionSubmittedProps;
  [ANALYTICS_EVENTS.CorrectionVote]: CorrectionVoteProps;
  [ANALYTICS_EVENTS.ProgramJoined]: ProgramJoinedProps;
  [ANALYTICS_EVENTS.ProgramReportFiled]: ProgramReportFiledProps;
  [ANALYTICS_EVENTS.PushReceived]: PushReceivedProps;
  [ANALYTICS_EVENTS.PushClicked]: PushClickedProps;
};

export type AnalyticsEventName = keyof AnalyticsEventProps;

// Same env-var contract as src/sw.ts, which sends push events straight to the
// ingestion API because the SW cannot load posthog-js.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

const isDev = import.meta.env.DEV;

function debug(message: string): void {
  if (isDev) {
    console.debug(`[analytics] ${message}`);
  }
}

let initialized = false;

/** Initialise PostHog once. Safe to call regardless of whether a key is set. */
export function initAnalytics(): void {
  if (!POSTHOG_KEY) {
    debug('VITE_POSTHOG_KEY not set — analytics disabled, every call is a no-op.');
    return;
  }
  if (initialized) return;
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Captures happen explicitly through captureEvent — no silent DOM or
    // page-view tracking.
    autocapture: false,
    capture_pageview: false,
  });
  debug(`PostHog initialised (${POSTHOG_HOST}).`);
}

/**
 * Attach the Supabase uid to all future events, optionally with profile
 * properties. No-op until initAnalytics() has run with a key.
 */
export function identifyAnalytics(userId: string, props?: Record<string, unknown>): void {
  if (!initialized) {
    debug(`identify(${userId}) skipped — analytics not initialized.`);
    return;
  }
  posthog.identify(userId, props);
}

/**
 * Capture a Track 0 event. Props are enforced per event by
 * AnalyticsEventProps, so calls are compile-checked against the dictionary.
 */
export function captureEvent<N extends AnalyticsEventName>(
  name: N,
  props: AnalyticsEventProps[N],
): void {
  if (!initialized) {
    debug(`capture(${name}) skipped — analytics not initialized.`);
    return;
  }
  posthog.capture(name, props);
}

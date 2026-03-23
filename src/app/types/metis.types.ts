/**
 * ─────────────────────────────────────────────────────────────────────────────
 * metis.types.ts
 * Central TypeScript type definitions for the Metis extension.
 *
 * INTEGRATION NOTE:
 *   These interfaces describe the shape of data flowing through the extension.
 *   In a real Chrome extension, `MetisMetrics` would be returned by your
 *   background scanner (content script → background worker → side panel).
 *   `AccuracyInputs` would be persisted via chrome.storage.sync so they
 *   survive page navigations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// UI STATE
// ─────────────────────────────────────────────

/**
 * Controls which surface of the extension is visible.
 *
 * - "idle"  → Only the floating "M" tab button is shown (bottom-right)
 * - "mini"  → 288px side panel slides in from the right edge
 * - "full"  → 410px floating panel (detached, with backdrop blur)
 *
 * INTEGRATION NOTE:
 *   Persist this to chrome.storage.session so the panel stays open
 *   when the user navigates between pages in the same tab.
 */
export type PanelMode = "idle" | "mini" | "full";

// ─────────────────────────────────────────────
// ACCURACY INPUTS
// ─────────────────────────────────────────────

/**
 * User-provided context that refines the cost risk score.
 * Lives only in the Full Report modal's "Improve Accuracy" section.
 *
 * INTEGRATION NOTE:
 *   - Persist via `chrome.storage.sync` (synced across devices) or
 *     `chrome.storage.local` (single device) after any onChange call.
 *   - On extension install, read from storage and hydrate DEFAULT_INPUTS.
 *   - `traffic` in a real scanner could be auto-detected from analytics
 *     cookies (Google Analytics __ga, Plausible, etc.) on the page.
 */
export interface AccuracyInputs {
  /** Cloud hosting provider — affects bandwidth pricing floor */
  hosting: string;

  /** Billing plan tier — higher tiers have better included limits */
  plan: string;

  /** Monthly unique visitors — primary traffic volume signal (1–10,000 in demo) */
  traffic: number;

  /** App archetype — static sites vs AI-heavy apps have very different cost profiles */
  appType: string;

  /** Pages visited per user session — multiplies per-request costs */
  pagesPerSession: string;

  /** Total number of pages in the app — affects crawl scope */
  siteSize: string;
}

// ─────────────────────────────────────────────
// COST BREAKDOWN
// ─────────────────────────────────────────────

/**
 * Estimated monthly cost waste split by category (in USD).
 *
 * INTEGRATION NOTE:
 *   In production, these values would come from:
 *   - `bandwidth` → network timing API + asset sizes from performance.getEntries()
 *   - `requests`  → XMLHttpRequest/fetch call count via PerformanceObserver
 *   - `ai`        → heuristic detection of OpenAI/Anthropic calls in Network tab
 *   For the demo these are computed proportionally from the base score.
 */
export interface CostBreakdown {
  /** Estimated monthly bandwidth waste ($/month) */
  bandwidth: number;

  /** Estimated monthly compute / request waste ($/month) */
  requests: number;

  /** Estimated monthly AI API overspend ($/month) */
  ai: number;

  /** Sum of all three categories */
  total: number;
}

// ─────────────────────────────────────────────
// METRICS OUTPUT
// ─────────────────────────────────────────────

/**
 * The complete output of `computeMetrics()` — passed as props to every
 * panel layer (MiniPanel, FullPanel, FullReportModal).
 *
 * INTEGRATION NOTE:
 *   In a Chrome extension this would typically be returned from the
 *   background service worker after scanning the active tab:
 *
 *   ```ts
 *   chrome.runtime.sendMessage({ type: "SCAN_TAB" }, (response: MetisMetrics) => {
 *     setMetrics(response);
 *   });
 *   ```
 *
 *   For this prototype it is derived purely from `computeMetrics(inputs)`.
 */
export interface MetisMetrics {
  /** 0–100 cost risk score. Higher = more waste. */
  score: number;

  /** Itemised cost breakdown by category */
  breakdown: CostBreakdown;

  /** Human-readable risk tier: "High Risk" | "Moderate Risk" | "Low Risk" | "Minimal Risk" */
  riskLabel: string;

  /** Hex colour matching the risk tier for UI accents */
  riskColor: string;

  /** Semi-transparent version of riskColor for badge backgrounds */
  riskBg: string;

  /**
   * Total score adjustment from all AccuracyInputs combined.
   * Shown as "↑ 12 pts" / "↓ 4 pts" in the ScoreChangedBadge.
   */
  scoreAdj: number;

  /** One-line human summary of what's driving the score */
  quickInsight: string;

  /** Lower bound of monthly cost waste estimate ($/month) */
  costRangeMin: number;

  /** Upper bound of monthly cost waste estimate ($/month) */
  costRangeMax: number;

  /**
   * Estimated cost of a single user visit (in dollars).
   * Animated with a count-up effect in SessionCostBlock.
   *
   * INTEGRATION NOTE:
   *   In production: measure actual bytes transferred + API calls
   *   during a real navigation using PerformanceObserver + fetch interception.
   */
  sessionCost: number;

  /** Projected monthly cost at 10,000 users (for scale projection row) */
  monthlyAt10k: number;

  /**
   * Number of pages sampled during the scan (2–5 in demo).
   *
   * INTEGRATION NOTE:
   *   In production this would be the actual crawl depth your
   *   content script walked (following same-origin href links).
   */
  pagesScanned: number;
}

// ─────────────────────────────────────────────
// ISSUE DEFINITION
// ─────────────────────────────────────────────

/** Severity levels — used for sort order and colour coding */
export type IssueSeverity = "critical" | "moderate" | "low";

/**
 * A single detected cost or performance issue.
 *
 * INTEGRATION NOTE:
 *   In production, this array would be built dynamically by the scanner:
 *   - Duplicate API requests → detect via PerformanceObserver ResourceTiming
 *   - Memory leaks          → detect via WeakRef / MutationObserver heuristics
 *   - Unoptimized images    → detect via element.naturalWidth vs rendered size
 *   - AI API calls          → detect via Request URL pattern matching
 *   - Cache headers         → detect via Response.headers in fetch interceptor
 */
export interface IssueDefinition {
  severity: IssueSeverity;
  title: string;
  desc: string;
  /** lucide-react icon component */
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  /** Hex accent colour for this severity level */
  color: string;
  /** Estimated $/month impact at current traffic */
  baseImpact: number;
  /** Technical explanation of WHY this costs money (Plus only) */
  rootCause: string;
  /** Step-by-step code-level fix (Plus only) */
  fix: string;
  /** $/month saved if this issue is resolved */
  saving: number;
  /** What happens to this cost at 10× traffic */
  scaleImpact: string;
}

// ─────────────────────────────────────────────
// STACK ITEM
// ─────────────────────────────────────────────

/**
 * A detected technology in the page's stack.
 *
 * INTEGRATION NOTE:
 *   Real detection strategy per category:
 *   - Framework   → window.__NEXT_DATA__, window.React, window.angular
 *   - Hosting     → Response headers (x-vercel-id, x-amz-cf-id, x-goog-*)
 *   - AI          → Network requests to api.openai.com, api.anthropic.com
 *   - Payment     → window.Stripe, script src containing "js.stripe.com"
 *   - Analytics   → window.dataLayer (GA4), window.plausible, window.mixpanel
 *   - CDN         → Response headers (cf-ray for Cloudflare, x-cache for CloudFront)
 */
export interface StackItem {
  name: string;
  /** Hex brand color for the dot indicator */
  color: string;
  category: "Framework" | "Hosting" | "AI" | "Payment" | "Analytics" | "CDN";
}

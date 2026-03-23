/**
 * ─────────────────────────────────────────────────────────────────────────────
 * metis-mock-data.ts
 * Static mock data for the Metis prototype.
 *
 * INTEGRATION GUIDE:
 *   Every export in this file is a MOCK. To connect real data, replace each
 *   export with the result of your scanner or API. Comments on each export
 *   describe exactly what real data source it maps to.
 *
 *   Suggested approach for a real Chrome extension:
 *   1. Content script runs on page load, sends scan results via postMessage
 *   2. Background service worker receives, aggregates, stores in chrome.storage
 *   3. Side panel reads from chrome.storage via chrome.storage.onChanged listener
 *   4. Replace these static arrays with the live storage values
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { IssueDefinition, StackItem, AccuracyInputs } from "../types/metis.types";

// ─────────────────────────────────────────────
// DESIGN TOKENS (shared across all components)
// ─────────────────────────────────────────────

/** Primary brand red — used for CTA buttons, score borders, risk highlights */
export const METIS_RED = "#dc5e5e";

/** Page background — darkest layer (body, modal backdrops) */
export const DARK_BG = "#0c1623";

/** Panel background — slightly lighter than DARK_BG, used in side panels */
export const PANEL_BG = "#111d2b";

// ─────────────────────────────────────────────
// SCORING ENGINE CONSTANTS
// ─────────────────────────────────────────────

/**
 * Base score before any AccuracyInputs adjustments are applied.
 * Represents a "typical mid-tier Next.js + Vercel SaaS" profile.
 *
 * INTEGRATION NOTE: This is the fallback score when no inputs are provided.
 * In production you might derive this from real telemetry before the user
 * fills in any context (e.g., from the number of issues × their severities).
 */
export const BASE_SCORE = 72;

/** Base bandwidth waste estimate ($/month) at 1k users, no adjustments */
export const BASE_BW = 12;

/** Base request/compute waste estimate ($/month) */
export const BASE_REQ = 10;

/** Base AI API waste estimate ($/month) */
export const BASE_AI = 8;

// ─────────────────────────────────────────────
// SCORE ADJUSTMENT LOOKUP TABLES
// ─────────────────────────────────────────────

/**
 * Hosting provider adjustments.
 * Positive = higher cost risk (e.g., Vercel/Netlify per-request billing).
 * Negative = better pricing / more predictable costs (e.g., AWS reserved instances).
 *
 * INTEGRATION NOTE: Could be derived from response headers detected by the scanner.
 */
export const HOSTING_ADJ: Record<string, number> = {
  AWS: -5,          // Reserved instances + mature cost tooling
  Vercel: 4,        // Per-invocation serverless pricing adds up quickly
  "Google Cloud": -4,
  Azure: -4,
  DigitalOcean: 2,  // Predictable but less granular auto-scaling
  Netlify: 6,       // Similar to Vercel — per-request function billing
  Render: 3,
  Railway: 2,
  Other: 0,
};

/**
 * Plan tier adjustments.
 * Free/Hobby plans have lower included limits → hit billing faster.
 * Enterprise plans have negotiated pricing and higher limits.
 *
 * INTEGRATION NOTE: Could be auto-detected from page metadata,
 * account API responses, or user self-selection.
 */
export const PLAN_ADJ: Record<string, number> = {
  Free: 9,        // Lowest limits, every extra call costs proportionally more
  Hobby: 4,
  Pro: 0,         // Baseline — no adjustment
  Business: -4,
  Enterprise: -8, // Bulk discounts + dedicated capacity
};

/**
 * App type adjustments — reflects typical cost profile for each archetype.
 * AI-Heavy apps can have massive token costs; Static Sites have minimal risk.
 *
 * INTEGRATION NOTE: Auto-detect from window.__NEXT_DATA__.page patterns,
 * presence of AI SDK imports, or network call patterns.
 */
export const APP_ADJ: Record<string, number> = {
  "Static Site": -10,     // Pre-rendered, minimal runtime cost
  "SaaS Dashboard": 8,    // Frequent API polling, auth overhead, dynamic data
  "Content-Heavy": 3,     // Image-heavy but usually cacheable
  "AI-Heavy": 15,         // Token costs dominate — very high risk

  // Legacy values kept for backward compatibility with older sessions
  SaaS: 5,
  "E-commerce": 9,
  "Blog / Content": -6,
  Portfolio: -9,
  Marketplace: 12,
  "Internal Tool": -3,
  Other: 0,
};

/**
 * Pages per session adjustments — most impactful multiplier.
 * Each page load = additional API calls, asset fetches, AI completions.
 *
 * INTEGRATION NOTE: Could be auto-detected from Google Analytics cookies
 * or by tracking navigation events in the content script.
 */
export const PAGES_ADJ: Record<string, number> = {
  "1–2": -6,  // Single-page interactions — low repeat cost
  "3–5": 0,   // Baseline
  "5–10": 8,  // Deep navigators — costs multiply
  "10+": 15,  // Heavy users — every inefficiency compounds
};

/**
 * Mid-point page count per bucket — used in session cost math.
 * Maps each range to a representative average (e.g., "3–5" → 4 pages).
 */
export const PAGES_COUNT: Record<string, number> = {
  "1–2": 1.5,
  "3–5": 4,
  "5–10": 7.5,
  "10+": 12,
};

/**
 * Site size adjustments — larger sites have more pages to scan,
 * more potential API routes, and higher baseline complexity.
 */
export const SITE_SIZE_ADJ: Record<string, number> = {
  "<10 pages": -5,
  "10–50": 0,
  "50–200": 3,
  "200+": 7,
};

// ─────────────────────────────────────────────
// DEFAULT ACCURACY INPUTS
// ─────────────────────────────────────────────

/**
 * Starting state for AccuracyInputs before the user fills in the form.
 *
 * INTEGRATION NOTE:
 *   On extension load, hydrate this from chrome.storage.sync:
 *
 *   ```ts
 *   chrome.storage.sync.get("metisAccuracyInputs", (result) => {
 *     const saved = result.metisAccuracyInputs as AccuracyInputs | undefined;
 *     setInputs(saved ?? DEFAULT_INPUTS);
 *   });
 *   ```
 */
export const DEFAULT_INPUTS: AccuracyInputs = {
  hosting: "",
  plan: "",
  traffic: 1000,       // Default: 1k monthly users
  appType: "",
  pagesPerSession: "3–5",  // Default: mid-range session depth
  siteSize: "",
};

// ─────────────────────────────────────────────
// MOCK DETECTED TECH STACK
// ─────────────────────────────────────────────

/**
 * Mock stack items as would be detected from the scanned page.
 *
 * INTEGRATION NOTE:
 *   Replace with results from your content script's stack detector.
 *   Detection strategies per category:
 *
 *   Framework:
 *     - React:   typeof window.React !== 'undefined'
 *     - Next.js: typeof window.__NEXT_DATA__ !== 'undefined'
 *     - Vue:     typeof window.Vue !== 'undefined'
 *
 *   Hosting:
 *     - Vercel:  Response header 'x-vercel-id'
 *     - AWS CF:  Response header 'x-amz-cf-id'
 *     - GCloud:  Response header 'x-goog-*'
 *
 *   AI:
 *     - OpenAI:    Network request to api.openai.com
 *     - Anthropic: Network request to api.anthropic.com
 *
 *   Payment:
 *     - Stripe: window.Stripe or script from js.stripe.com
 *
 *   Analytics:
 *     - GA4:      window.dataLayer
 *     - Plausible: window.plausible
 *
 *   CDN:
 *     - Cloudflare: Response header 'cf-ray'
 *     - CloudFront: Response header 'x-cache: Hit from cloudfront'
 */
export const MOCK_STACK_ITEMS: StackItem[] = [
  { name: "React 18",          color: "#61dafb", category: "Framework"  },
  { name: "Next.js 14",        color: "#aaaaaa", category: "Framework"  },
  { name: "Vercel",            color: "#6366f1", category: "Hosting"    },
  { name: "OpenAI API",        color: "#10a37f", category: "AI"         },
  { name: "Stripe",            color: "#6772e5", category: "Payment"    },
  { name: "Google Analytics",  color: "#f9a825", category: "Analytics"  },
  { name: "Cloudflare CDN",    color: "#f6821f", category: "CDN"        },
];

/**
 * Grouped stack for the Full Report modal's "Known Stack" section.
 *
 * INTEGRATION NOTE:
 *   Derive this by grouping MOCK_STACK_ITEMS (or real detected items)
 *   by their `category` field.
 */
export const MOCK_DETAILED_STACK = [
  { label: "Framework",    items: ["React 18", "Next.js 14"]     },
  { label: "Hosting / CDN", items: ["Vercel", "Cloudflare CDN"] },
  { label: "AI Providers", items: ["OpenAI GPT-4"]               },
  { label: "Analytics",    items: ["Google Analytics 4"]          },
  { label: "Payment",      items: ["Stripe v3"]                   },
];

// ─────────────────────────────────────────────
// MOCK DETECTED ISSUES
// ─────────────────────────────────────────────

/**
 * Pre-sorted by severity. Sort order: critical → moderate → low.
 *
 * INTEGRATION NOTE:
 *   In production, this array is built dynamically by the scanner:
 *
 *   ISSUE: "Duplicate API Requests"
 *     Detect via: PerformanceObserver 'resource' entries — group by URL,
 *     flag any URL that appears 3+ times within a single page load.
 *     ```ts
 *     const observer = new PerformanceObserver((list) => {
 *       const urls = list.getEntries().map(e => e.name);
 *       const duplicates = urls.filter((url, i) => urls.indexOf(url) !== i);
 *     });
 *     observer.observe({ entryTypes: ['resource'] });
 *     ```
 *
 *   ISSUE: "Memory Leak Pattern"
 *     Detect via: Hook into addEventListener/removeEventListener at
 *     document load time, track add/remove counts per element.
 *     Flag if adds >>> removes after React component unmounts.
 *
 *   ISSUE: "Unoptimized Images"
 *     Detect via: Iterate document.querySelectorAll('img'), compare
 *     element.naturalWidth × naturalHeight against rendered clientWidth × clientHeight.
 *     Flag if naturalSize > 2× rendered size or file size > 500KB.
 *
 *   ISSUE: "AI API Call Frequency"
 *     Detect via: Intercept fetch/XHR, flag calls to known AI endpoints
 *     (api.openai.com, api.anthropic.com) that fire more than once every 400ms.
 *
 *   ISSUE: "Missing Cache Headers"
 *     Detect via: PerformanceResourceTiming.serverTiming and
 *     checking if Cache-Control header is set on static asset responses.
 */
export const MOCK_ISSUES: IssueDefinition[] = [
  {
    severity: "critical",
    title: "Duplicate API Requests",
    desc: "Same endpoint called 8× per page load — wasting compute and budget",
    icon: AlertCircle,
    color: "#ef4444",
    baseImpact: 8,
    rootCause:
      "No request deduplication layer — multiple React components trigger the same fetch independently on mount.",
    fix: "Add a shared SWR or React Query cache key so concurrent callers share a single in-flight request. Alternatively, hoist the fetch to a context provider.",
    saving: 8,
    scaleImpact: "At 10× traffic → ~$80/month wasted on redundant compute alone.",
  },
  {
    severity: "critical",
    title: "Memory Leak Pattern",
    desc: "Unsubscribed event listeners accumulating in 3 components",
    icon: AlertCircle,
    color: "#ef4444",
    baseImpact: 5,
    rootCause:
      "useEffect hooks add event listeners but return no cleanup function, causing them to stack on every re-render.",
    fix: "Return a cleanup function from each useEffect: `return () => window.removeEventListener(...)`. Use AbortController for fetch effects.",
    saving: 5,
    scaleImpact: "At 10× traffic → server restarts increase 3×, inflating uptime cost by ~$50/month.",
  },
  {
    severity: "moderate",
    title: "Unoptimized Images",
    desc: "3 images exceed 2MB — no WebP conversion or lazy loading detected",
    icon: AlertTriangle,
    color: "#f97316",
    baseImpact: 4,
    rootCause:
      "Raw PNG/JPG assets are served directly from Vercel's origin with no image CDN or Next.js <Image> component optimization.",
    fix: "Replace <img> tags with Next.js <Image> — it auto-converts to WebP, lazy-loads, and serves from Vercel's edge cache. Expect 60–80% size reduction.",
    saving: 4,
    scaleImpact: "At 10× traffic → bandwidth bill grows ~$40/month from uncompressed payloads.",
  },
  {
    severity: "moderate",
    title: "AI API Call Frequency",
    desc: "OpenAI called on every keystroke — no debounce or response caching",
    icon: AlertTriangle,
    color: "#f97316",
    baseImpact: 11,
    rootCause:
      "The AI completion handler fires on `onChange` with no debounce. Each keystroke = 1 API call at ~$0.002 each.",
    fix: "Debounce the handler by 400ms using `useDebouncedCallback`. Cache responses for identical prompts using a simple Map or Redis for 5 min.",
    saving: 11,
    scaleImpact: "At 10× traffic → OpenAI bill alone could reach ~$110/month for this single feature.",
  },
  {
    severity: "low",
    title: "Missing Cache Headers",
    desc: "Static assets served without cache-control directives",
    icon: Info,
    color: "#eab308",
    baseImpact: 2,
    rootCause:
      "Vercel's default headers don't set long-lived cache on JS/CSS chunks. Every revisit re-downloads them from the edge.",
    fix: "Add `Cache-Control: public, max-age=31536000, immutable` for hashed static files in next.config.js headers array.",
    saving: 2,
    scaleImpact: "At 10× traffic → ~$20/month in avoidable CDN egress charges.",
  },
];

/** Severity sort weight — lower number = shown first */
export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  moderate: 1,
  low: 2,
};

/**
 * Pre-sorted issue list — used everywhere issues are rendered.
 * Critical issues always appear at the top.
 */
export const SORTED_ISSUES = [...MOCK_ISSUES].sort(
  (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
);

// ─────────────────────────────────────────────
// LIVE DETECTION ANIMATION STEPS
// ─────────────────────────────────────────────

/**
 * Sequential "scanning" messages shown in the LoadingScreen component.
 * Simulates real-time discovery of issues.
 *
 * INTEGRATION NOTE:
 *   Replace the hardcoded steps with events emitted by your real scanner
 *   via chrome.runtime.onMessage. For example:
 *
 *   Content script:
 *   ```ts
 *   chrome.runtime.sendMessage({ type: "SCAN_STEP", text: "API requests detected" });
 *   ```
 *
 *   Side panel:
 *   ```ts
 *   chrome.runtime.onMessage.addListener((msg) => {
 *     if (msg.type === "SCAN_STEP") appendStep(msg.text);
 *   });
 *   ```
 */
export const DETECTION_STEPS = [
  { delay: 0,    text: "Scanning network requests…",        color: "rgba(255,255,255,0.3)", dot: null      },
  { delay: 280,  text: "DOM analysis running…",             color: "rgba(255,255,255,0.3)", dot: null      },
  { delay: 520,  text: "AI usage detected ⚠",              color: "#f97316",               dot: "#f97316" },
  { delay: 700,  text: "Duplicate API calls found",         color: "#ef4444",               dot: "#ef4444" },
  { delay: 860,  text: "Memory leak pattern detected",      color: "#ef4444",               dot: "#ef4444" },
  { delay: 1010, text: "3 unoptimized images identified",   color: "#f97316",               dot: "#f97316" },
  { delay: 1160, text: "Missing cache headers found",       color: "#eab308",               dot: "#eab308" },
  { delay: 1320, text: "Calculating cost risk score…",      color: "rgba(255,255,255,0.3)", dot: null      },
] as const;

/**
 * Total duration (ms) of the detection animation.
 * The LoadingScreen unmounts after this delay.
 *
 * INTEGRATION NOTE:
 *   In production, replace the fixed timer with a Promise that resolves
 *   when the background scanner sends a "SCAN_COMPLETE" message.
 */
export const DETECTION_TOTAL_DURATION_MS = 1100;

// ─────────────────────────────────────────────
// PLUS PLAN FEATURE DEFINITIONS
// ─────────────────────────────────────────────

// These are UI content arrays used in the PlusUpgradeModal.
// No integration changes needed — these are pure marketing copy.

import {
  TrendingDown,
  Zap,
  RefreshCw,
  Target,
  Shield,
  Download,
} from "lucide-react";

export const PLUS_FEATURES = [
  {
    icon: TrendingDown,
    color: "#22c55e",
    title: "Fix Recommendations",
    desc: "Exact code-level fixes for every detected issue, ranked by savings impact.",
    tag: "Most Popular" as string | null,
  },
  {
    icon: Zap,
    color: "#f97316",
    title: "Savings Estimate",
    desc: "See exactly how much each fix saves — per issue, per month, at scale.",
    tag: null,
  },
  {
    icon: RefreshCw,
    color: "#6366f1",
    title: "Multi-Page Scan",
    desc: "Smart crawl up to 50 pages — nav links, footers, main routes — not just the current tab.",
    tag: "Coming Soon" as string | null,
  },
  {
    icon: Target,
    color: "#f97316",
    title: "Scale Impact Preview",
    desc: "\"At 10× traffic this issue costs $840/month\" — dynamic projections for every problem.",
    tag: null,
  },
  {
    icon: Shield,
    color: "#a78bfa",
    title: "Root Cause Analysis",
    desc: "Deeper explanation of why each cost driver exists, not just that it exists.",
    tag: null,
  },
  {
    icon: Download,
    color: "#60a5fa",
    title: "Full PDF Export",
    desc: "Shareable report with all findings, fixes, and cost projections for your team.",
    tag: null,
  },
];

export const FREE_VS_PLUS_ROWS = [
  { feature: "Cost Risk Score",             free: true,  plus: true  },
  { feature: "Quick Insight",               free: true,  plus: true  },
  { feature: "Top 3 Issues (label only)",   free: true,  plus: true  },
  { feature: "Session Cost Estimate",       free: true,  plus: true  },
  { feature: "Full Issue Descriptions",     free: false, plus: true  },
  { feature: "Fix Recommendations",         free: false, plus: true  },
  { feature: "Savings per Fix",             free: false, plus: true  },
  { feature: "Multi-Page Scan (50 pages)",  free: false, plus: true  },
  { feature: "Scale Impact Preview",        free: false, plus: true  },
  { feature: "Root Cause Analysis",         free: false, plus: true  },
  { feature: "Full PDF Export",             free: false, plus: true  },
];

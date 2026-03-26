/**
 * ─────────────────────────────────────────────────────────────────────────────
 * scoring.ts
 * Metis cost risk scoring engine.
 *
 * This is a PURE FUNCTION module — no React, no side effects.
 * Safe to import in a Chrome extension background service worker.
 *
 * HOW THE SCORE WORKS:
 *   score = BASE_SCORE (72)
 *         + hosting_adjustment     (-5 to +6)
 *         + plan_adjustment        (-8 to +9)
 *         + appType_adjustment     (-10 to +15)
 *         + pagesPerSession_adj    (-6 to +15)
 *         + siteSize_adjustment    (-5 to +7)
 *         + traffic_band_adj       (-7 to +16)
 *
 *   Clamped to [1, 100]. Higher score = more cost risk.
 *
 * INTEGRATION NOTE:
 *   In a production Chrome extension, the score would be a BLEND of:
 *   1. Static analysis (this function — user-provided context)
 *   2. Runtime telemetry (actual bytes, request counts, error rates)
 *   3. Optional: server-side model comparing against baseline benchmarks
 *
 *   For the prototype, this pure function is sufficient and runs
 *   synchronously in the legacy demo shell — zero latency.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AccuracyInputs, MetisMetrics } from "../types/metis.types";
import {
  BASE_SCORE,
  BASE_BW,
  BASE_REQ,
  BASE_AI,
  HOSTING_ADJ,
  PLAN_ADJ,
  APP_ADJ,
  PAGES_ADJ,
  PAGES_COUNT,
  SITE_SIZE_ADJ,
} from "../data/metis-mock-data";

/**
 * Computes the full MetisMetrics object from user-provided AccuracyInputs.
 *
 * Called on every render — React's referential equality handles memoization
 * naturally since the result is only used if inputs change.
 *
 * INTEGRATION NOTE:
 *   To add real scanner data as an additional input:
 *   1. Add a `scanData?: ScanData` optional param to the signature
 *   2. Apply an additional `rawIssueAdj` based on actual issue count × severity
 *   3. Override `breakdown` values with real telemetry numbers
 *
 * @param inputs - User-provided context from the ImproveAccuracyForm
 * @returns MetisMetrics - Complete metrics object for rendering all panels
 */
export function computeMetrics(inputs: AccuracyInputs): MetisMetrics {
  // ── Step 1: Accumulate score adjustment from all inputs ────────────────────
  let adj = 0;

  if (inputs.hosting) adj += HOSTING_ADJ[inputs.hosting] ?? 0;
  if (inputs.plan) adj += PLAN_ADJ[inputs.plan] ?? 0;
  if (inputs.appType) adj += APP_ADJ[inputs.appType] ?? 0;
  if (inputs.pagesPerSession) adj += PAGES_ADJ[inputs.pagesPerSession] ?? 0;
  if (inputs.siteSize) adj += SITE_SIZE_ADJ[inputs.siteSize] ?? 0;

  // Traffic band adjustment — six tiers from minimal to viral scale
  // INTEGRATION NOTE: Replace with actual MAU count from analytics cookies
  const t = inputs.traffic;
  if      (t < 200)  adj -= 7;   // Tiny — low absolute cost even if inefficient
  else if (t < 800)  adj -= 3;
  else if (t < 1500) adj += 0;   // Baseline band — no adjustment
  else if (t < 4000) adj += 5;
  else if (t < 7000) adj += 10;
  else               adj += 16;  // High traffic — every inefficiency multiplies hard

  // ── Step 2: Clamp final score to valid range ───────────────────────────────
  const score = Math.min(100, Math.max(1, BASE_SCORE + adj));

  // ── Step 3: Compute cost breakdown proportional to score + traffic ─────────
  //
  // `trafficFactor` scales the bandwidth estimate linearly with traffic.
  // Clamped to [0.35, 3.0] so the estimate stays plausible at both ends.
  //
  // `sf` (score factor) scales all categories proportionally to how
  // far the score has moved from the baseline.
  //
  // INTEGRATION NOTE: In production, replace these with real numbers:
  //   bandwidth = totalBytesTransferred / 1GB × pricePerGB
  //   requests  = totalFunctionInvocations × pricePerInvocation
  //   ai        = totalTokensUsed × pricePerToken
  const trafficFactor = Math.max(0.35, Math.min(3.0, inputs.traffic / 2000));
  const sf = score / BASE_SCORE;

  const bandwidth = Math.max(2, Math.round(BASE_BW * trafficFactor * sf));
  const requests  = Math.max(1, Math.round(BASE_REQ * sf));
  const ai        = Math.max(1, Math.round(BASE_AI * sf));
  const total     = bandwidth + requests + ai;

  // ── Step 4: Risk tier + colours ───────────────────────────────────────────
  //
  // Thresholds: ≥80 = High, ≥60 = Moderate, ≥40 = Low, <40 = Minimal
  // These drive the RiskBadge, ScoreCircle stroke, and tab button pulse colour.
  let riskLabel: string;
  let riskColor: string;
  let riskBg: string;

  if (score >= 80) {
    riskLabel = "High Risk";
    riskColor = "#ef4444";
    riskBg    = "rgba(239,68,68,0.2)";
  } else if (score >= 60) {
    riskLabel = "Moderate Risk";
    riskColor = "#f97316";
    riskBg    = "rgba(249,115,22,0.2)";
  } else if (score >= 40) {
    riskLabel = "Low Risk";
    riskColor = "#eab308";
    riskBg    = "rgba(234,179,8,0.2)";
  } else {
    riskLabel = "Minimal Risk";
    riskColor = "#22c55e";
    riskBg    = "rgba(34,197,94,0.2)";
  }

  // ── Step 5: Quick Insight — one-line summary ───────────────────────────────
  //
  // INTEGRATION NOTE: In production this could be generated by a small
  // language model summarising the actual detected issues.
  let quickInsight: string;
  if      (score >= 80) quickInsight = "Severe API overuse and memory pressure detected";
  else if (score >= 70) quickInsight = "High request count and AI usage detected";
  else if (score >= 55) quickInsight = "Moderate cost inefficiencies across 5 issues";
  else if (score >= 40) quickInsight = "Minor optimizations available, low risk";
  else                  quickInsight = "Site is well-optimized — low cost risk detected";

  // ── Step 6: Cost range (display band around the point estimate) ────────────
  const costRangeMin = Math.round(total * 0.75);
  const costRangeMax = Math.round(total * 1.35);

  // ── Step 7: Session cost + 10k projection ─────────────────────────────────
  //
  // `sessionCost` = estimated USD cost of ONE user visiting the site once,
  //   weighted by their average pages-per-session.
  //   Used in the animated counting counter in SessionCostBlock.
  //
  // `monthlyAt10k` = what the total monthly cost would be at 10,000 users.
  //   Used in the blue "At 10k users →" scale row.
  //
  // INTEGRATION NOTE:
  //   sessionCost in production = sum of:
  //     (bytes transferred / 1 GB × $0.12 / user visit)
  //     + (function invocations × $0.0000002)
  //     + (AI tokens × $0.00002)
  const pagesCount  = PAGES_COUNT[inputs.pagesPerSession] ?? 4;
  const costPerUser = total / Math.max(1, inputs.traffic); // $/user/month
  const sessionCost = costPerUser * (pagesCount / 4);      // scaled to 4-page baseline
  const monthlyAt10k = costPerUser * 10_000;

  // ── Step 8: Pages scanned (simulated smart sample) ────────────────────────
  //
  // INTEGRATION NOTE: In production = actual number of pages your content
  // script crawled. Display in the SessionCostBlock provenance chip.
  const pagesScanned = score >= 70 ? 5 : score >= 50 ? 4 : 3;

  // ── Return assembled metrics object ───────────────────────────────────────
  return {
    score,
    breakdown: { bandwidth, requests, ai, total },
    riskLabel,
    riskColor,
    riskBg,
    scoreAdj: adj,
    quickInsight,
    costRangeMin,
    costRangeMax,
    sessionCost,
    monthlyAt10k,
    pagesScanned,
  };
}

// ─────────────────────────────────────────────
// FORMATTING UTILITIES
// ─────────────────────────────────────────────

/**
 * Formats a small dollar amount with appropriate decimal precision.
 * Used for the animated session cost counter.
 *
 * Examples:
 *   0.000023  → "$0.2"  (sub-cent: shown in tenths of a cent)
 *   0.005     → "$0.0050"
 *   0.15      → "$0.150"
 *   4.20      → "$4.20"
 *   120       → "$120"
 */
export function fmtCost(n: number): string {
  if (n < 0.001) return `$${(n * 10000).toFixed(1)}`;  // Display in sub-cent units
  if (n < 0.01)  return `$${n.toFixed(4)}`;
  if (n < 0.1)   return `$${n.toFixed(3)}`;
  if (n < 10)    return `$${n.toFixed(2)}`;
  return `$${Math.round(n)}`;
}

/**
 * Formats a larger monthly dollar amount with k-shortening.
 * Used in the scale projection row ("~$4.2k/month").
 */
export function fmtMonthly(n: number): string {
  if (n >= 10000) return `$${(n / 1000).toFixed(0)}k`;
  if (n >= 1000)  return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

/**
 * Formats a traffic number for the slider display label.
 * 1200 → "1.2k", 500 → "500"
 */
export function fmtTraffic(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;
}

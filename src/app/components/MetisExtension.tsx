/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MetisExtension.tsx
 * Root component for the Metis Chrome extension UI prototype.
 *
 * ARCHITECTURE:
 *   All state lives here and flows DOWN via props — no Context, no Zustand.
 *   This mirrors the real Chrome extension architecture where the side panel
 *   is a single HTML page with a single React root.
 *
 * COMPONENT TREE:
 *   MetisExtension                 ← All state lives here
 *   ├── TabButton                  ← Idle state: floating "M" button (bottom-right)
 *   ├── MiniPanelContent           ← mode === "mini": 288px side panel
 *   ├── FullPanelContent           ← mode === "full": 410px floating panel
 *   ├── FullReportModal            ← showReport === true: overlay modal
 *   └── PlusUpgradeModal           ← showPlus === true: upgrade overlay
 *
 * STATE FLOW:
 *   inputs (AccuracyInputs)
 *     → computeMetrics(inputs)     ← pure function, runs every render
 *     → metrics (MetisMetrics)     ← passed as props to every panel
 *
 * INTEGRATION CHECKLIST (real Chrome extension):
 *   [ ] Replace chrome.runtime.sendMessage stub with real background scanner
 *   [ ] Replace MOCK_STACK_ITEMS with content script detection results
 *   [ ] Replace SORTED_ISSUES with scanner-produced issue array
 *   [ ] Persist AccuracyInputs via chrome.storage.sync
 *   [ ] Persist PanelMode via chrome.storage.session
 *   [ ] Add chrome.tabs.onActivated listener to re-scan on tab switch
 *   [ ] Connect PlusUpgradeModal to real Stripe Checkout / auth flow
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Maximize2,
  Minimize2,
  AlertCircle,
  AlertTriangle,
  Info,
  Zap,
  ChevronRight,
  Loader2,
  Shield,
  Sparkles,
  FileText,
  Download,
  Target,
  ChevronDown,
  TrendingDown,
  Lock,
  RefreshCw,
  Wrench,
  LogOut,
  Settings,
  Crown,
  Trophy,
  Users,
  ArrowRight,
  Copy,
  CheckCheck,
  Activity,
  Clock,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

// ── Internal imports from our typed modules ────────────────────────────────
import type { PanelMode, AccuracyInputs, MetisMetrics, CostBreakdown } from "../types/metis.types";
import {
  METIS_RED,
  DARK_BG,
  PANEL_BG,
  DEFAULT_INPUTS,
  MOCK_STACK_ITEMS,
  MOCK_DETAILED_STACK,
  SORTED_ISSUES,
  DETECTION_STEPS,
  DETECTION_TOTAL_DURATION_MS,
  PLUS_FEATURES,
  FREE_VS_PLUS_ROWS,
} from "../data/metis-mock-data";
import { computeMetrics, fmtCost, fmtMonthly, fmtTraffic } from "../lib/scoring";


// ═════════════════════════════════════════════
// SECTION 1 — ANIMATION PRIMITIVES
// ═════════════════════════════════════════════

/**
 * ScoreCircle
 * SVG ring that animates from its previous value to a new score using
 * requestAnimationFrame with a cubic ease-out curve.
 *
 * INTEGRATION NOTE:
 *   This component is self-contained — just pass it a `score` prop
 *   and it will animate whenever that value changes. No additional
 *   wiring needed when connecting real scanner data.
 *
 * @param score      - 0–100 risk score
 * @param size       - SVG dimensions in px (default 100)
 * @param riskColor  - Hex colour for the ring stroke (omit for white)
 */
function ScoreCircle({
  score,
  size = 100,
  riskColor,
}: {
  score: number;
  size?: number;
  riskColor?: string;
}) {
  // `displayed` is the interpolated value shown during animation
  const [displayed, setDisplayed] = useState(0);

  // fromRef tracks the animation start value without triggering re-renders
  const fromRef = useRef(0);

  // rafRef holds the active animation frame ID so we can cancel on cleanup
  const rafRef = useRef<number | null>(null);

  /** Animates the displayed score from its current value to `to` over 750ms */
  const animateTo = useCallback((to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    if (from === to) return;
    const duration = 750;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out
      const val = Math.round(from + (to - from) * eased);
      setDisplayed(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to; // Update start reference for next animation
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Re-animate whenever the score prop changes (e.g. user fills in inputs)
  useEffect(() => {
    animateTo(score);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animateTo]);

  // SVG ring geometry
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;

  // When riskColor is provided (dark panel context), use it as the ring stroke.
  // When rendering on the red tab button, fall back to white.
  const strokeColor = riskColor ?? "white";
  const trackColor = riskColor ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.18)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background track ring */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={trackColor} strokeWidth="5.5"
      />
      {/* Animated progress ring */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.04s linear" }}
      />
      {/* Numeric score in the center */}
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill="white"
        fontSize={size * 0.24}
        fontFamily="Jua, sans-serif"
        fontWeight="bold"
      >
        {displayed}
      </text>
    </svg>
  );
}

/**
 * useCountUp
 * Custom hook — counts a numeric value from 0 to `target` over `durationMs`
 * using requestAnimationFrame with a cubic ease-out curve.
 *
 * Used in SessionCostBlock to animate the session cost and monthly projection.
 * The displayed value resets and re-counts whenever `target` changes.
 *
 * @param target     - The final value to animate to
 * @param durationMs - Animation duration in milliseconds (default 900ms)
 * @returns          - The current interpolated value for display
 */
function useCountUp(target: number, durationMs = 900): number {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out
      setDisplayed(0 + (target - 0) * eased); // Always counts from 0
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, durationMs]);

  return displayed;
}


// ═════════════════════════════════════════════
// SECTION 2 — LOADING SCREEN
// WOW Feature #1 — Live Detection Feedback
// Issues appear in real-time as if being discovered
// ═════════════════════════════════════════════

/**
 * LoadingScreen
 * Simulates a live analysis feed by revealing detection steps sequentially.
 * Each step appears with a slide-in animation based on its `delay` value.
 *
 * INTEGRATION NOTE:
 *   Replace the setTimeout-based steps with actual scanner events:
 *   ```ts
 *   chrome.runtime.onMessage.addListener((msg) => {
 *     if (msg.type === "SCAN_STEP") appendVisibleStep(msg.stepIndex);
 *     if (msg.type === "SCAN_COMPLETE") setLoaded(true);
 *   });
 *   ```
 *   The `DETECTION_STEPS` array in metis-mock-data.ts maps to real
 *   scanner events — replace text and colours with real detection results.
 */
function LoadingScreen() {
  // Array of step indices that have been revealed so far
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    // Reveal each step after its specified delay
    const timers = DETECTION_STEPS.map((step, i) =>
      setTimeout(
        () => setVisibleSteps((prev) => [...prev, i]),
        step.delay
      )
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="flex flex-col justify-center h-full px-5 py-6 gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Spinner + "Analyzing page…" header */}
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={14} className="text-white/40" />
        </motion.div>
        <span
          className="text-white/35"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
        >
          Analyzing page…
        </span>
      </div>

      {/* Sequential detection feed */}
      <div className="space-y-1.5">
        {DETECTION_STEPS.map((step, i) => (
          <AnimatePresence key={i}>
            {visibleSteps.includes(i) && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Coloured dot for issue-level steps; invisible spacer for status steps */}
                {step.dot ? (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: step.dot }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 opacity-0" />
                )}
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: step.color }}>
                  {step.text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </motion.div>
  );
}


// ═════════════════════════════════════════════
// SECTION 3 — SHARED DISPLAY PRIMITIVES
// Small reusable UI atoms used across all panels
// ═════════════════════════════════════════════

/**
 * SectionLabel
 * Uppercased, wide-tracked label for major panel sections.
 * Optionally renders a small lucide icon to the left.
 */
function SectionLabel({
  children,
  icon: Icon,
}: {
  children: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Icon && <Icon size={11} className="text-white/30" />}
      <span
        className="text-white/30 text-xs uppercase tracking-widest font-semibold"
        style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.1em" }}
      >
        {children}
      </span>
    </div>
  );
}

/**
 * RiskBadge
 * Pill badge showing the current risk tier (e.g. "Moderate Risk").
 * The coloured dot inside pulses continuously to draw attention.
 *
 * Animates when the `riskLabel` key changes — i.e. when the score
 * crosses a tier boundary due to AccuracyInputs changes.
 */
function RiskBadge({
  metrics,
  small = false,
}: {
  metrics: MetisMetrics;
  small?: boolean;
}) {
  return (
    <motion.div
      key={metrics.riskLabel}         // Re-mount animation on tier change
      layout
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        background: metrics.riskBg,
        padding: small ? "3px 10px" : "4px 12px",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pulsing dot */}
      <motion.div
        className="rounded-full shrink-0"
        style={{
          background: metrics.riskColor,
          width: small ? 6 : 7,
          height: small ? 6 : 7,
        }}
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <span
        className="font-semibold"
        style={{
          color: metrics.riskColor,
          fontFamily: "Inter, sans-serif",
          fontSize: small ? 10 : 11,
        }}
      >
        {metrics.riskLabel}
      </span>
    </motion.div>
  );
}

/**
 * ScoreChangedBadge
 * Shows "↑ 12 pts" or "↓ 4 pts" when AccuracyInputs have shifted the score.
 * Only renders when `adj !== 0` — hidden by default before inputs are filled.
 */
function ScoreChangedBadge({ adj }: { adj: number }) {
  if (adj === 0) return null;
  const up = adj > 0;
  return (
    <motion.span
      key={adj}
      initial={{ opacity: 0, y: -6, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
      style={{
        background: up ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
        color: up ? "#fca5a5" : "#6ee7b7",
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
      }}
    >
      {up ? "↑" : "↓"} {Math.abs(adj)} pts
    </motion.span>
  );
}


// ═════════════════════════════════════════════
// SECTION 4 — ISSUE COMPONENTS
// WOW Feature #2 — Hover-to-Explain tooltips
// WOW Feature #6 — Smart contextual warnings
// ═════════════════════════════════════════════

/**
 * IssueTooltip
 * Floating tooltip that appears above an issue row on hover.
 * Shows the full description + estimated $/month impact.
 *
 * WOW Feature #2: Hover-to-Explain
 * Rather than always-visible text (too noisy in mini panel), the tooltip
 * reveals context only when the developer is actively interested.
 *
 * INTEGRATION NOTE: No changes needed — receives issue data via props.
 */
function IssueTooltip({
  issue,
  visible,
}: {
  issue: (typeof SORTED_ISSUES)[0];
  visible: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute left-0 right-0 z-50 pointer-events-none"
          style={{ bottom: "calc(100% + 6px)" }}
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="rounded-xl px-3 py-2.5 shadow-2xl"
            style={{
              background: "#0c1623",
              border: `1px solid ${issue.color}40`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${issue.color}20`,
            }}
          >
            <p
              className="text-white/70 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
            >
              {issue.desc}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendingDown size={9} style={{ color: issue.color }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: issue.color }}>
                ~${issue.baseImpact}/mo impact · hover for details
              </span>
            </div>
          </div>
          {/* Downward arrow pointer */}
          <div
            className="absolute left-4 w-2.5 h-2.5 rotate-45"
            style={{
              bottom: -5,
              background: "#0c1623",
              borderBottom: `1px solid ${issue.color}40`,
              borderRight: `1px solid ${issue.color}40`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MiniIssueRow
 * Compact issue row for the mini panel — shows severity dot, title, and badge only.
 * Hovering reveals the IssueTooltip with the full description.
 *
 * Used in: MiniPanelContent (side panel — space constrained)
 */
function MiniIssueRow({
  issue,
  delay = 0,
  onDark = false,
}: {
  issue: (typeof SORTED_ISSUES)[0];
  delay?: number;
  onDark?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative flex items-center gap-2 py-1.5 cursor-default"
      style={{
        borderBottom: `1px solid ${onDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <IssueTooltip issue={issue} visible={hovered} />
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: issue.color }} />
      <span className="flex-1 text-white text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
        {issue.title}
      </span>
      <span
        className="rounded-full px-1.5 py-0.5 shrink-0"
        style={{
          background: issue.color + "22",
          color: issue.color,
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
        }}
      >
        {issue.severity}
      </span>
    </motion.div>
  );
}

/**
 * FullIssueRow
 * Expanded issue row for the full panel — shows icon, title, description,
 * and a hover-reveal contextual scale warning.
 *
 * WOW Feature #6: Smart contextual warnings
 * On hover, reveals "⚠ This may scale poorly — ~$X/mo at 10× traffic"
 * to add urgency without cluttering the default state.
 *
 * Used in: FullPanelContent and FullReportModal → Section 3
 */
function FullIssueRow({
  issue,
  delay = 0,
  onDark = false,
}: {
  issue: (typeof SORTED_ISSUES)[0];
  delay?: number;
  onDark?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = onDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative rounded-xl p-3 flex items-start gap-3 cursor-default"
      style={{
        background: hovered
          ? onDark
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.14)"
          : bg,
        transition: "background 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="shrink-0 mt-0.5">
        <issue.icon size={13} style={{ color: issue.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-white font-semibold"
            style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
          >
            {issue.title}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 shrink-0"
            style={{
              background: issue.color + "25",
              color: issue.color,
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
            }}
          >
            {issue.severity}
          </span>
        </div>
        <p
          className="text-white/45 mt-0.5 leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
        >
          {issue.desc}
        </p>
        {/* WOW #6 — Smart contextual warning: appears on hover only */}
        <AnimatePresence>
          {hovered && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 italic"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                color: issue.color + "cc",
              }}
            >
              ⚠ This may scale poorly — ~${issue.baseImpact * 10}/mo at 10× traffic
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


// ═════════════════════════════════════════════
// SECTION 5 — STACK + COST COMPONENTS
// WOW Feature #7 — Smart Stack Detection Badges
// ═════════════════════════════════════════════

/**
 * StackChips
 * Renders technology stack as coloured pill chips.
 *
 * `compact` mode shows only the first 4 items + "+N more" overflow chip.
 * Used in both the mini panel (compact) and full panel/report (full).
 *
 * INTEGRATION NOTE:
 *   Replace MOCK_STACK_ITEMS with your real detected stack from the content
 *   script. The component accepts any StackItem[] array.
 */
function StackChips({
  compact = false,
  delay = 0,
  onDark = false,
}: {
  compact?: boolean;
  delay?: number;
  onDark?: boolean;
}) {
  const shown = compact ? MOCK_STACK_ITEMS.slice(0, 4) : MOCK_STACK_ITEMS;
  const chipBg = onDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.12)";

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + i * 0.04 }}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: chipBg }}
        >
          {/* Brand colour dot */}
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-white/65" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
            {item.name}
          </span>
        </motion.div>
      ))}
      {/* Overflow indicator for compact mode */}
      {compact && MOCK_STACK_ITEMS.length > 4 && (
        <div
          className="flex items-center rounded-full px-2.5 py-1"
          style={{ background: onDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)" }}
        >
          <span
            className="text-white/30"
            style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
          >
            +{MOCK_STACK_ITEMS.length - 4} more
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * CostBreakdownRows
 * Three animated rows showing Bandwidth / Requests / AI costs + total.
 * Values animate via Motion's `key`-based re-mount whenever metrics change.
 *
 * Used in: FullReportModal → Section 2 (Cost Breakdown) and RefinedOutput
 *
 * INTEGRATION NOTE:
 *   Pass real values from your scanner's CostBreakdown object.
 *   The component is display-only; no changes needed to connect real data.
 */
function CostBreakdownRows({
  breakdown,
  delay = 0,
  onDark = false,
}: {
  breakdown: CostBreakdown;
  delay?: number;
  onDark?: boolean;
}) {
  const rows = [
    { label: "Bandwidth",          value: breakdown.bandwidth, icon: "↕" },
    { label: "Requests / Compute", value: breakdown.requests,  icon: "⚡" },
    { label: "AI API Usage",       value: breakdown.ai,        icon: "🤖" },
  ];
  const rowBg = onDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)";

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.06 }}
          className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ background: rowBg }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{row.icon}</span>
            <span
              className="text-white/65"
              style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
            >
              {row.label}
            </span>
          </div>
          {/* Animates whenever value changes (score adjustment) */}
          <motion.span
            key={row.value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-white font-bold"
            style={{ fontFamily: "Jua, sans-serif", fontSize: 12 }}
          >
            ~${row.value}/mo
          </motion.span>
        </motion.div>
      ))}

      {/* Total row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.22 }}
        className="flex items-center justify-between px-4 pt-1"
      >
        <span className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
          Total estimated waste
        </span>
        <motion.span
          key={breakdown.total}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-white font-bold"
          style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}
        >
          ~${breakdown.total}/mo
        </motion.span>
      </motion.div>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 6 — SCALE SIMULATION (Plus only)
// Shown in Full Report Modal → Section 2b
// ═════════════════════════════════════════════

/**
 * ScaleSimulation
 * Projects the current cost profile at 1k, 5k, 10k, 50k, and 100k users.
 * Plus-only — locked behind PremiumSection for Free users.
 *
 * Also shows AI cost per request estimated from detected OpenAI usage.
 *
 * INTEGRATION NOTE:
 *   The cost projections assume linear scaling (cost × traffic multiplier).
 *   For a more accurate model, apply:
 *   - Sub-linear scaling for CDN costs (bulk pricing tiers)
 *   - Non-linear for serverless (cold start overhead at high concurrency)
 *   These can be modelled by replacing `costPerUser * s.mult * 1000` with
 *   a lookup table per hosting provider.
 */
function ScaleSimulation({ metrics }: { metrics: MetisMetrics }) {
  // Base cost per user at 1k users; scaled linearly for projections
  const costPerUser = metrics.breakdown.total / 1000;

  // Rough AI cost per API request — assumes ~120 AI calls/user/month baseline
  // INTEGRATION NOTE: Replace with real token count × price-per-token from scanner
  const aiPerRequest = (metrics.breakdown.ai / 1000 / 120).toFixed(4);

  const scenarios = [
    { users: "1k",   mult: 1,   label: "Current baseline" },
    { users: "5k",   mult: 5,   label: "5× growth"        },
    { users: "10k",  mult: 10,  label: "10× growth"       },
    { users: "50k",  mult: 50,  label: "50× growth"       },
    { users: "100k", mult: 100, label: "Viral / scale"    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* AI cost-per-request row */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 mb-3"
        style={{ background: "rgba(16,163,127,0.08)", border: "1px solid rgba(16,163,127,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <div>
            <p className="text-white/65" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
              AI cost per request (est.)
            </p>
            <p className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
              Based on OpenAI GPT-4 detected usage
            </p>
          </div>
        </div>
        <span className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 13 }}>
          ~${aiPerRequest}
        </span>
      </div>

      {/* Traffic scenario table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Table header */}
        <div
          className="grid grid-cols-3 px-4 py-2"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>Traffic</span>
          <span className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>Scenario</span>
          <span className="text-white/30 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>Est. monthly waste</span>
        </div>

        {scenarios.map((s, i) => {
          const monthly = Math.round(costPerUser * s.mult * 1000);
          const isBase = i === 0;
          return (
            <motion.div
              key={s.users}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="grid grid-cols-3 px-4 py-2.5 items-center"
              style={{
                borderBottom: i < scenarios.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: isBase
                  ? "rgba(220,94,94,0.06)"
                  : i % 2 === 0
                  ? "transparent"
                  : "rgba(255,255,255,0.015)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Users size={10} className="text-white/25" />
                <span
                  className="font-semibold"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: isBase ? METIS_RED : "rgba(255,255,255,0.65)",
                  }}
                >
                  {s.users} users
                </span>
                {isBase && (
                  <span
                    className="rounded-full px-1.5 py-0.5"
                    style={{
                      background: "rgba(220,94,94,0.18)",
                      color: METIS_RED,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 8,
                    }}
                  >
                    now
                  </span>
                )}
              </div>
              <span className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                {s.label}
              </span>
              <motion.span
                key={monthly}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-right font-bold"
                style={{
                  fontFamily: "Jua, sans-serif",
                  fontSize: 12,
                  // Escalating colour: neutral → orange → red as cost grows
                  color: s.mult >= 50 ? "#ef4444" : s.mult >= 10 ? "#f97316" : "rgba(255,255,255,0.75)",
                }}
              >
                {monthly >= 1000 ? `$${(monthly / 1000).toFixed(1)}k` : `$${monthly}`}/mo
              </motion.span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-white/18 mt-2 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 9 }}>
        Projections based on current cost profile · assumes linear scaling
      </p>
    </motion.div>
  );
}


// ═════════════════════════════════════════════
// SECTION 7 — IMPROVE ACCURACY FORM
// Lives ONLY in the Full Report Modal (Section 5)
// Per the MD spec — never shown in side panels
// ═════════════════════════════════════════════

/**
 * SelectField
 * Dark-themed select dropdown used in the ImproveAccuracyForm.
 * Fully controlled — calls onChange with the new string value.
 */
function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-white/55 font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
          {label}
        </span>
        {optional && (
          <span className="text-white/25" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
            (optional)
          </span>
        )}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-3 py-2.5 pr-8 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: value ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            outline: "none",
          }}
        >
          <option value="" disabled style={{ background: "#0c1623", color: "#555" }}>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "#162030", color: "white" }}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={11}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
      </div>
    </div>
  );
}

/**
 * PillGroup
 * Toggle-style pill button row for selecting from a small set of options.
 * Used for Pages per Session (most impactful) and App Type.
 *
 * `important` prop renders an orange "Most Important" badge next to the label.
 */
function PillGroup({
  label,
  options,
  value,
  onChange,
  important = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  important?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-white/55 font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
          {label}
        </span>
        {important && (
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{
              background: "rgba(249,115,22,0.18)",
              color: "#f97316",
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
            }}
          >
            Most Important
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <motion.button
              key={opt}
              onClick={() => onChange(opt)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl px-3 py-1.5 font-semibold cursor-pointer transition-colors"
              style={{
                background: active ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${active ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: active ? "#f97316" : "rgba(255,255,255,0.55)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
              }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ImproveAccuracyForm
 * The only place AccuracyInputs can be changed.
 * Every onChange call propagates up to MetisExtension → computeMetrics() → all panels.
 *
 * Per the MD spec: This form ONLY lives in the Full Report modal (Section 5).
 * It is never rendered in the mini or full side panels.
 *
 * INTEGRATION NOTE:
 *   After onChange fires, also persist to chrome.storage.sync:
 *   ```ts
 *   const handleChange = (next: AccuracyInputs) => {
 *     onInputsChange(next);
 *     chrome.storage.sync.set({ metisAccuracyInputs: next });
 *   };
 *   ```
 */
function ImproveAccuracyForm({
  inputs,
  onChange,
}: {
  inputs: AccuracyInputs;
  onChange: (next: AccuracyInputs) => void;
}) {
  // Helper: returns a setter for a specific key in AccuracyInputs
  const set = (key: keyof AccuracyInputs) => (val: string | number) =>
    onChange({ ...inputs, [key]: val });

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Target size={11} className="text-white/30" />
        <span
          className="text-white/30 uppercase tracking-widest font-semibold"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 11, letterSpacing: "0.1em" }}
        >
          Improve Accuracy
        </span>
        <span className="text-white/20" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
          · updates score in real-time
        </span>
      </div>

      {/* Field 1: Pages per Session — highest scoring weight */}
      <PillGroup
        label="Pages per Session"
        options={["1–2", "3–5", "5–10", "10+"]}
        value={inputs.pagesPerSession}
        onChange={set("pagesPerSession") as (v: string) => void}
        important
      />

      {/* Field 2: App Type */}
      <PillGroup
        label="App Type"
        options={["Static Site", "SaaS Dashboard", "Content-Heavy", "AI-Heavy"]}
        value={inputs.appType}
        onChange={set("appType") as (v: string) => void}
      />

      {/* Field 3: Hosting Provider */}
      <SelectField
        label="Hosting Provider"
        placeholder="Select provider"
        options={["AWS", "Vercel", "Google Cloud", "Azure", "DigitalOcean", "Netlify", "Render", "Railway", "Other"]}
        value={inputs.hosting}
        onChange={set("hosting") as (v: string) => void}
      />

      {/* Field 4: Plan Tier */}
      <SelectField
        label="Plan Tier"
        placeholder="Select plan"
        options={["Free", "Hobby", "Pro", "Business", "Enterprise"]}
        value={inputs.plan}
        onChange={set("plan") as (v: string) => void}
      />

      {/* Field 5: Site Size (optional) */}
      <SelectField
        label="Site Size"
        placeholder="How many pages?"
        options={["<10 pages", "10–50", "50–200", "200+"]}
        value={inputs.siteSize}
        onChange={set("siteSize") as (v: string) => void}
        optional
      />

      {/* Field 6: Monthly Traffic slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/55 font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
            Monthly Traffic
          </span>
          {/* Value label animates on change */}
          <motion.span
            key={inputs.traffic}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold"
            style={{ fontFamily: "Jua, sans-serif", fontSize: 12 }}
          >
            {fmtTraffic(inputs.traffic)} users/mo
          </motion.span>
        </div>
        <input
          type="range"
          min={1}
          max={10000}
          step={10}
          value={inputs.traffic}
          onChange={(e) => set("traffic")(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              rgba(255,255,255,0.6) ${(inputs.traffic / 10000) * 100}%,
              rgba(255,255,255,0.1) ${(inputs.traffic / 10000) * 100}%
            )`,
            outline: "none",
          }}
        />
        <div
          className="flex justify-between text-white/20"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}
        >
          <span>1 user</span>
          <span>10k users</span>
        </div>
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 8 — REFINED OUTPUT
// Full Report Modal → Section 6
// Appears automatically after any input is changed
// ═════════════════════════════════════════════

/**
 * RefinedOutput
 * Conditional section that animates in after the user fills in any
 * AccuracyInputs field. Shows the updated score adjustment + cost range.
 *
 * INTEGRATION NOTE:
 *   `visible` is computed in FullReportModal by checking if any input
 *   deviates from DEFAULT_INPUTS. No changes needed here.
 */
function RefinedOutput({
  metrics,
  inputs,
  visible,
}: {
  metrics: MetisMetrics;
  inputs: AccuracyInputs;
  visible: boolean;
}) {
  // Build a context note from filled inputs (e.g. "Vercel · Pro plan · SaaS Dashboard")
  const contextParts: string[] = [];
  if (inputs.hosting)  contextParts.push(inputs.hosting);
  if (inputs.plan)     contextParts.push(`${inputs.plan} plan`);
  if (inputs.appType)  contextParts.push(inputs.appType);
  const contextNote = contextParts.join(" · ");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 8 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "rgba(220,94,94,0.08)",
              border: "1px solid rgba(220,94,94,0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={11} className="text-white/35" />
                <span
                  className="text-white/35 uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.1em" }}
                >
                  Refined Estimate
                </span>
              </div>
              <ScoreChangedBadge adj={metrics.scoreAdj} />
            </div>

            {contextNote && (
              <p className="text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                Calibrated for <span className="text-white/55">{contextNote}</span>
              </p>
            )}

            {/* Updated cost range */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <span className="text-white/60" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                Estimated cost risk
              </span>
              <motion.span
                key={metrics.breakdown.total}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="text-white font-bold"
                style={{ fontFamily: "Jua, sans-serif", fontSize: 16 }}
              >
                ${metrics.costRangeMin}–${metrics.costRangeMax}/mo
              </motion.span>
            </div>

            <CostBreakdownRows breakdown={metrics.breakdown} onDark />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// ═════════════════════════════════════════════
// SECTION 9 — SESSION COST BLOCK
// WOW Feature #4 — Animated session cost counter
// Shared across mini panel, full panel, and report modal
// ═════════════════════════════════════════════

/**
 * SessionCostBlock
 * Shows the estimated cost of a single user session + the 10k user projection.
 * Both numbers animate from 0 using useCountUp when the component mounts
 * or when metrics change.
 *
 * WOW Feature #4: The count-up animation makes the cost feel "real" —
 * like a taxi meter ticking up as the page loads.
 *
 * INTEGRATION NOTE:
 *   In production, `metrics.sessionCost` should be calculated from:
 *   - Bytes transferred during the actual navigation (PerformanceResourceTiming)
 *   - API calls intercepted × their estimated per-call cost
 *   - AI token usage × price-per-token for the detected model
 */
function SessionCostBlock({
  metrics,
  compact = false,
}: {
  metrics: MetisMetrics;
  compact?: boolean;
}) {
  const pages = metrics.pagesScanned;

  // Both values count up from 0 on mount / metrics change
  const animatedSessionCost  = useCountUp(metrics.sessionCost, 950);
  const animatedMonthly      = useCountUp(metrics.monthlyAt10k, 1100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Provenance chip — which site / how many pages were scanned */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Pulsing "live" indicator dot */}
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#6366f1" }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
          {/* INTEGRATION NOTE: Replace with active tab's URL from chrome.tabs.query */}
          Live · Sampled {pages} pages · app.example.com
        </span>
      </div>

      {/* Animated session cost row */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div>
          <p
            className="text-white/50"
            style={{ fontFamily: "Inter, sans-serif", fontSize: compact ? 10 : 11 }}
          >
            Current session cost ({pages} pages)
          </p>
          {!compact && (
            <p className="text-white/25 mt-0.5" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
              Counting as page loads · estimated
            </p>
          )}
        </div>
        {/* tabular-nums ensures stable digit width during animation */}
        <span
          className="font-bold tabular-nums"
          style={{ fontFamily: "Jua, sans-serif", fontSize: compact ? 13 : 15, color: "white" }}
        >
          {fmtCost(animatedSessionCost)}
        </span>
      </div>

      {/* Scale row — "At 10k users → ~$Xk/month" */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(99,102,241,0.07)", borderTop: "1px solid rgba(99,102,241,0.15)" }}
      >
        <Zap size={10} className="text-indigo-400 shrink-0" />
        <span className="text-white/40" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
          At 10k users →
        </span>
        <span
          className="font-bold tabular-nums"
          style={{ fontFamily: "Jua, sans-serif", fontSize: 11, color: "#a5b4fc" }}
        >
          ~{fmtMonthly(animatedMonthly)}/month
        </span>
      </div>
    </motion.div>
  );
}


// ═════════════════════════════════════════════
// SECTION 10 — PREMIUM LOCKED SECTION
// Shown when isPlusUser === false in FullPanel + FullReport
// ═════════════════════════════════════════════

/**
 * PremiumSection
 * Blurred preview rows with a locked overlay and upgrade CTA.
 * Replaced entirely by the real content when isPlusUser becomes true.
 *
 * `compact` mode (used in side panels) shows fewer preview rows and
 * stacks the CTA buttons vertically to fit the narrower width.
 *
 * INTEGRATION NOTE:
 *   Connect `onUpgrade` to your real payment flow:
 *   ```ts
 *   const handleUpgrade = async () => {
 *     // Redirect to Stripe Checkout
 *     const { url } = await fetch('/api/create-checkout-session').then(r => r.json());
 *     window.open(url, '_blank');
 *   };
 *   ```
 */
function PremiumSection({
  compact = false,
  onUpgrade,
}: {
  compact?: boolean;
  onUpgrade?: () => void;
}) {
  const previews = compact
    ? ["Why this is costing you money", "How to fix each issue"]
    : [
        "Why this is costing you money",
        "How to fix each issue",
        "Estimated savings if fixed",
        "Scale impact at 10× traffic",
      ];

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred preview rows — pointer-events disabled so they can't be interacted with */}
      <div
        className="space-y-2 p-4"
        style={{
          filter: "blur(4px)",
          pointerEvents: "none",
          userSelect: "none",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {previews.map((p) => (
          <div
            key={p}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <TrendingDown size={12} className="text-white/40 shrink-0" />
            <span className="text-white/60" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
              {p}
            </span>
          </div>
        ))}
      </div>

      {/* Upgrade overlay — sits above the blurred preview */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{ background: "rgba(12,22,35,0.7)", backdropFilter: "blur(3px)" }}
      >
        <div className="rounded-full p-2.5" style={{ background: "rgba(255,255,255,0.1)" }}>
          <Lock size={14} className="text-white" />
        </div>
        <p
          className="text-white font-semibold text-center"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
        >
          Unlock Full Metis Report
        </p>
        <div className={`flex ${compact ? "flex-col" : "flex-row"} gap-2`}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpgrade}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold"
            style={{
              background: METIS_RED,
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
            }}
          >
            <Sparkles size={11} />
            Upgrade to Plus
          </motion.button>
          {!compact && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Wrench size={11} />
              Fix this for me
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 11 — PLUS UPGRADE MODAL
// Shown when showPlus === true
// ═════════════════════════════════════════════

/**
 * PlusUpgradeModal
 * Full-screen upgrade flow with feature grid, comparison table, billing toggle,
 * and a success animation that plays before calling onConfirm.
 *
 * INTEGRATION NOTE:
 *   The "Upgrade to Metis+" button currently calls `onConfirm()` after
 *   a 1.8s animation. In production:
 *   1. Replace handleUpgrade with a Stripe Checkout redirect
 *   2. Listen for a successful payment webhook on your backend
 *   3. Update user record: { tier: 'plus' }
 *   4. Call onConfirm() only after verifying payment via your auth API
 *
 *   The `confirmed` animation state would then be triggered by the
 *   Stripe `payment_intent.succeeded` event, not a fixed timeout.
 */
function PlusUpgradeModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [confirmed, setConfirmed] = useState(false);
  const price = billing === "annual" ? 7 : 9;

  const handleUpgrade = () => {
    // INTEGRATION NOTE: Replace with real payment flow
    setConfirmed(true);
    setTimeout(() => { onConfirm(); }, 1800);
  };

  return (
    <>
      {/* Backdrop — click to close */}
      <motion.div
        className="fixed inset-0 z-[300]"
        style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(18px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 z-[310] flex items-center justify-center p-5 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-xl pointer-events-auto flex flex-col"
          style={{
            maxHeight: "90vh",
            background: "#0d1825",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 48px 120px rgba(0,0,0,0.7)",
          }}
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, y: 32, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── SUCCESS STATE — plays after upgrade is confirmed ── */}
          <AnimatePresence>
            {confirmed && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-3xl"
                style={{ background: "#0d1825" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Radial glow */}
                <div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 50% 40%, rgba(220,94,94,0.18) 0%, transparent 65%)",
                  }}
                />

                {/* Crown with sparkle orbit animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center relative"
                  style={{ background: "rgba(220,94,94,0.15)", border: "2px solid rgba(220,94,94,0.4)" }}
                >
                  <Crown size={32} style={{ color: METIS_RED }} />
                  {/* 5-point sparkle orbit */}
                  {[0, 72, 144, 216, 288].map((deg, i) => (
                    <motion.div
                      key={deg}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{ background: METIS_RED, top: "50%", left: "50%", transformOrigin: "0 0" }}
                      initial={{ scale: 0, x: "-50%", y: "-50%" }}
                      animate={{
                        scale: [0, 1, 0],
                        x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 42}px)`,
                        y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 42}px)`,
                      }}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.7 }}
                    />
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center space-y-2"
                >
                  <h3 className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 24 }}>
                    Welcome to Metis+
                  </h3>
                  <p className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                    Your extension is upgrading now…
                  </p>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                  className="w-48 h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: METIS_RED }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── MODAL HEADER ── */}
          <div
            className="relative px-6 pt-6 pb-5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Atmospheric glow blob */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(ellipse, rgba(220,94,94,0.22) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-white/8 transition-colors"
            >
              <X size={14} className="text-white/35" />
            </button>

            <div className="flex flex-col items-center gap-2 relative">
              {/* Metis+ badge */}
              <div
                className="flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{ background: "rgba(220,94,94,0.15)", border: "1px solid rgba(220,94,94,0.3)" }}
              >
                <Crown size={12} style={{ color: METIS_RED }} />
                <span className="font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 14, color: METIS_RED }}>
                  Metis+
                </span>
              </div>

              <h2 className="text-white text-center" style={{ fontFamily: "Jua, sans-serif", fontSize: 22 }}>
                Stop guessing. Start fixing.
              </h2>
              <p
                className="text-white/40 text-center max-w-xs"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
              >
                Everything in Free, plus the full picture — root causes, exact fixes, savings estimates, and multi-page scanning.
              </p>

              {/* Billing toggle — Monthly / Annual */}
              <div
                className="flex items-center gap-1 rounded-full p-1 mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {(["monthly", "annual"] as const).map((b) => (
                  <motion.button
                    key={b}
                    onClick={() => setBilling(b)}
                    className="relative rounded-full px-4 py-1.5 cursor-pointer"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                  >
                    {/* Sliding active indicator */}
                    {billing === b && (
                      <motion.div
                        layoutId="billing-pill"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span
                      className="relative font-semibold"
                      style={{ color: billing === b ? "white" : "rgba(255,255,255,0.35)" }}
                    >
                      {b === "monthly" ? "Monthly" : "Annual"}
                    </span>
                    {b === "annual" && (
                      <span
                        className="relative ml-1.5 rounded-full px-1.5 py-0.5 font-bold"
                        style={{
                          background: "rgba(34,197,94,0.2)",
                          color: "#4ade80",
                          fontSize: 9,
                        }}
                      >
                        Save 22%
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Price — animates when billing mode switches */}
              <div className="flex items-end gap-1.5 mt-1">
                <motion.span
                  key={price}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white"
                  style={{ fontFamily: "Jua, sans-serif", fontSize: 36 }}
                >
                  ${price}
                </motion.span>
                <span
                  className="text-white/35 mb-1.5"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
                >
                  / month{billing === "annual" ? ", billed annually" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Feature grid — 2 columns */}
            <div className="grid grid-cols-2 gap-2.5">
              {PLUS_FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="rounded-2xl p-4 relative"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {f.tag && (
                    <span
                      className="absolute top-3 right-3 rounded-full px-2 py-0.5 font-bold"
                      style={{
                        background: f.tag === "Coming Soon" ? "rgba(99,102,241,0.2)" : "rgba(34,197,94,0.2)",
                        color: f.tag === "Coming Soon" ? "#a5b4fc" : "#4ade80",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 8,
                      }}
                    >
                      {f.tag}
                    </span>
                  )}
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: f.color + "1a" }}
                  >
                    <f.icon size={13} style={{ color: f.color }} />
                  </div>
                  <p className="text-white font-semibold mb-1" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                    {f.title}
                  </p>
                  <p className="text-white/38 leading-relaxed" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Free vs Plus comparison table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div
                className="grid grid-cols-3 px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>Feature</span>
                <span className="text-white/30 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>Free</span>
                <div className="flex items-center justify-center gap-1">
                  <Crown size={9} style={{ color: METIS_RED }} />
                  <span className="font-bold" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: METIS_RED }}>Plus</span>
                </div>
              </div>
              {FREE_VS_PLUS_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-3 px-4 py-2 items-center"
                  style={{
                    borderBottom: i < FREE_VS_PLUS_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  }}
                >
                  <span className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                    {row.feature}
                  </span>
                  <div className="flex justify-center">
                    {row.free ? (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                        <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>
                      </div>
                    ) : (
                      <span className="text-white/15" style={{ fontSize: 12 }}>—</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(220,94,94,0.18)" }}>
                      <span style={{ color: METIS_RED, fontSize: 10 }}>✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MENTAL MODEL ── */}
          <div className="px-6 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-center text-white/20 mb-3" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.06em" }}>
              THE METIS WAY
            </p>
            <div className="flex items-stretch gap-2">
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-white/30 mb-2 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 9, letterSpacing: "0.08em" }}>FREE</p>
                {["🔍 Detect", "📊 Estimate", "👁 Reveal"].map((step, i) => (
                  <div key={step} className="flex items-center gap-1.5 py-1">
                    {i > 0 && <ArrowRight size={8} className="text-white/15 shrink-0" />}
                    {i === 0 && <span className="w-2 shrink-0" />}
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{step}</span>
                  </div>
                ))}
              </div>
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: "rgba(220,94,94,0.06)", border: "1px solid rgba(220,94,94,0.2)" }}
              >
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Crown size={8} style={{ color: METIS_RED }} />
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 9, letterSpacing: "0.08em", color: METIS_RED }}>PLUS</p>
                </div>
                {["💡 Explain", "🛠 Guide", "⚡ Optimize"].map((step, i) => (
                  <div key={step} className="flex items-center gap-1.5 py-1">
                    {i > 0 && <ArrowRight size={8} style={{ color: METIS_RED + "40" }} className="shrink-0" />}
                    {i === 0 && <span className="w-2 shrink-0" />}
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA FOOTER ── */}
          <div
            className="px-6 pb-6 pt-4 shrink-0 space-y-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpgrade}
              disabled={confirmed}
              className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{
                background: METIS_RED,
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                boxShadow: "0 8px 24px rgba(220,94,94,0.35)",
                opacity: confirmed ? 0.6 : 1,
              }}
            >
              <Sparkles size={13} />
              Upgrade to Metis+ — ${price}/mo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Wrench size={11} />
              Fix this for me (Agency)
            </motion.button>
            <p className="text-center text-white/20" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
              Cancel anytime · No credit card needed for free tier
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}


// ═════════════════════════════════════════════
// SECTION 12 — PROFILE BUTTON + DROPDOWN
// Appears in all panel headers
// ═════════════════════════════════════════════

/**
 * ProfileButton
 * Avatar button that opens a dropdown showing user identity, plan badge,
 * and contextual actions (Upgrade / Settings / Sign out).
 *
 * INTEGRATION NOTE:
 *   Replace hardcoded "JD / Jamie Dawson / jamie@acmecorp.io" with real
 *   user data from your auth provider:
 *   ```ts
 *   const { user } = useAuth(); // e.g., Clerk, Auth0, Supabase Auth
 *   ```
 *   The `isPlusUser` prop should reflect the user's real subscription tier
 *   from your database / Stripe subscription status.
 */
function ProfileButton({
  onDark = false,
  onUpgrade,
  isPlusUser = false,
}: {
  onDark?: boolean;
  onUpgrade: () => void;
  isPlusUser?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const avatarBg = onDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)";

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <motion.button
        onClick={() => setOpen((p) => !p)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
        style={{ background: avatarBg, border: "1.5px solid rgba(255,255,255,0.18)" }}
        title="Profile"
      >
        {/* INTEGRATION NOTE: Replace "JD" with user initials */}
        <span className="text-white font-bold select-none" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
          JD
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 z-[200] w-52 rounded-2xl overflow-hidden"
            style={{
              background: "#0d1825",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 56px rgba(0,0,0,0.55)",
            }}
          >
            {/* User identity row */}
            <div
              className="px-4 py-3.5 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: METIS_RED }}
              >
                {/* INTEGRATION NOTE: Replace with user.avatar or initials */}
                <span className="text-white font-bold" style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                  JD
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {/* INTEGRATION NOTE: Replace with user.name and user.email */}
                <p className="text-white font-semibold truncate" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                  Jamie Dawson
                </p>
                <p className="text-white/40 truncate" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                  jamie@acmecorp.io
                </p>
              </div>
            </div>

            {/* Plan badge */}
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-white/40" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                Current plan
              </span>
              <AnimatePresence mode="wait">
                {isPlusUser ? (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(220,94,94,0.18)", border: "1px solid rgba(220,94,94,0.35)" }}
                  >
                    <Crown size={9} style={{ color: METIS_RED }} />
                    <span className="font-bold" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: METIS_RED }}>
                      Plus
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="free"
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <Crown size={9} className="text-white/50" />
                    <span className="font-semibold text-white/60" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                      Free
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menu items — context-aware (Plus vs Free) */}
            <div className="py-1.5">
              {(isPlusUser
                ? [
                    { icon: Crown,     label: "Metis+ Active",    accent: true,  disabled: true  },
                    { icon: Settings,  label: "Settings",          accent: false, disabled: false },
                    { icon: LogOut,    label: "Sign out",          accent: false, disabled: false },
                  ]
                : [
                    { icon: Sparkles,  label: "Upgrade to Plus",   accent: true,  disabled: false },
                    { icon: Settings,  label: "Settings",          accent: false, disabled: false },
                    { icon: LogOut,    label: "Sign out",          accent: false, disabled: false },
                  ]
              ).map(({ icon: Icon, label, accent, disabled }) => (
                <motion.button
                  key={label}
                  whileHover={disabled ? {} : { backgroundColor: "rgba(255,255,255,0.05)" }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left"
                  style={{ background: "transparent", cursor: disabled ? "default" : "pointer" }}
                  onClick={() => {
                    if (disabled) return;
                    setOpen(false);
                    if (label === "Upgrade to Plus") onUpgrade();
                    // INTEGRATION NOTE: Add real handlers for Settings and Sign out
                  }}
                >
                  <Icon size={12} style={{ color: accent ? METIS_RED : "rgba(255,255,255,0.35)" }} />
                  <span
                    className="font-medium"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: accent ? METIS_RED : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 13 — WOW FEATURES
// #5: "What Just Happened?" collapsible panel
// #8: Copy Report button
// ═════════════════════════════════════════════

/**
 * WhatJustHappened
 * WOW Feature #5 — Collapsible breakdown of the last 10 seconds of page activity.
 * Shown at the bottom of both MiniPanel and FullPanel footers.
 *
 * INTEGRATION NOTE:
 *   Replace the hardcoded `events` array with real data from PerformanceObserver:
 *   ```ts
 *   const observer = new PerformanceObserver((list) => {
 *     const entries = list.getEntries();
 *     const apiCalls = entries.filter(e => e.initiatorType === 'fetch');
 *     setEvents([
 *       { label: 'API requests on load', value: `${apiCalls.length} calls` },
 *       // ...
 *     ]);
 *   });
 *   observer.observe({ entryTypes: ['resource', 'navigation'] });
 *   ```
 */
function WhatJustHappened({ metrics }: { metrics: MetisMetrics }) {
  const [open, setOpen] = useState(false);

  // INTEGRATION NOTE: Replace with live data from content script
  const events = [
    { icon: Activity,  color: "#ef4444", label: "API requests on load",  value: "12 calls"       },
    { icon: Cpu,       color: "#f97316", label: "AI completions fired",  value: "3 calls"        },
    { icon: FileText,  color: "#eab308", label: "Heavy assets loaded",   value: "3 files › 2MB"  },
    { icon: Clock,     color: "#6366f1", label: "Time to interactive",   value: "3.4s"           },
  ];

  return (
    <div>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer"
        style={{
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <Activity size={11} className="text-white/40" />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
            What just happened?
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} className="text-white/30" />
        </motion.div>
      </motion.button>

      {/* Collapsible event feed */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="mt-1.5 rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header */}
              <div
                className="px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
                  {/* INTEGRATION NOTE: Replace with real tab URL */}
                  LAST 10 SECONDS · app.example.com
                </span>
              </div>
              {events.map((ev, i) => (
                <motion.div
                  key={ev.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: i < events.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="flex items-center gap-2">
                    <ev.icon size={10} style={{ color: ev.color }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                      {ev.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: "Jua, sans-serif", fontSize: 10, color: ev.color }}>
                    {ev.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * CopyReportButton
 * WOW Feature #8 — Copies a plain-text summary of the current report
 * to the clipboard using the Clipboard API. Shows a checkmark for 2s after copy.
 *
 * The copied text is formatted for pasting into Slack, Notion, or client emails.
 *
 * INTEGRATION NOTE:
 *   The summary text references "app.example.com" — in production, replace
 *   with the actual `chrome.tabs.Tab.url` from the scanned tab.
 */
function CopyReportButton({ metrics }: { metrics: MetisMetrics }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const summary =
`Metis Cost Report — app.example.com
Risk Score: ${metrics.score}/100 (${metrics.riskLabel})
Estimated waste: ~$${metrics.costRangeMin}–$${metrics.costRangeMax}/month
Session cost: ${fmtCost(metrics.sessionCost)} · At 10k users: ~${fmtMonthly(metrics.monthlyAt10k)}/month
Top issues: ${SORTED_ISSUES.slice(0, 3).map((i) => i.title).join(", ")}
Quick insight: ${metrics.quickInsight}
— Scanned by Metis (metis.ward.studio)`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      toast.success("Report copied!", {
        description: "Paste it in Slack, Notion, or a client chat.",
        duration: 2500,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.93 }}
      onClick={handleCopy}
      className="px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.5)",
      }}
      title="Copy summary"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <CheckCheck size={13} />
          </motion.div>
        ) : (
          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy size={13} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}


// ═════════════════════════════════════════════
// SECTION 14 — MINI PANEL CONTENT
// mode === "mini" — 288px right-edge panel
//
// Layout per MD spec:
//   Score → Quick Insight → Session Cost → Issues (label only) → Stack → CTA
//   NO cost breakdown rows, NO inputs, NO sliders
// ═════════════════════════════════════════════

/**
 * MiniPanelContent
 * The compact 288px panel that slides in when the user clicks the tab button.
 * Space-constrained: shows only the most important signals.
 *
 * Per the MD spec, this panel intentionally omits:
 * - Cost breakdown rows
 * - Improve Accuracy inputs
 * - Scale simulation
 *
 * INTEGRATION NOTE:
 *   This component is pure display — wire `metrics` from the background
 *   scanner result and the remaining props to MetisExtension handlers.
 */
function MiniPanelContent({
  metrics,
  onClose,
  onExpand,
  onFullReport,
  onUpgrade,
  isPlusUser,
}: {
  metrics: MetisMetrics;
  onClose: () => void;
  onExpand: () => void;
  onFullReport: () => void;
  onUpgrade: () => void;
  isPlusUser: boolean;
}) {
  // Show loading screen for the first 1.1s to simulate scan completion
  // INTEGRATION NOTE: Replace with a real "scan complete" event from background worker
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), DETECTION_TOTAL_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: PANEL_BG, borderLeft: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          {/* Metis logo mark */}
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: METIS_RED }}
          >
            <span className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}>M</span>
          </div>
          <span className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}>
            Metis
          </span>
          {/* Plus badge — only visible after upgrade */}
          {isPlusUser && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ background: "rgba(220,94,94,0.18)", border: "1px solid rgba(220,94,94,0.3)" }}
            >
              <Crown size={8} style={{ color: METIS_RED }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: METIS_RED, fontWeight: 700 }}>Plus</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <ProfileButton onUpgrade={onUpgrade} isPlusUser={isPlusUser} />
          <button onClick={onExpand} className="p-1.5 rounded-full hover:bg-white/8 transition-colors" title="Open full panel">
            <Maximize2 size={12} className="text-white/40" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/8 transition-colors">
            <X size={12} className="text-white/40" />
          </button>
        </div>
      </div>

      {/* ── BODY — loading → content transition ── */}
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="loading" className="flex-1">
            <LoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ scrollbarWidth: "none" }}
          >
            {/* 1. SCORE */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <ScoreCircle score={metrics.score} size={88} riskColor={metrics.riskColor} />
              <div className="text-center space-y-1.5">
                <motion.p
                  key={metrics.score}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/40"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                >
                  Cost Risk: <span className="text-white font-bold">{metrics.score}</span>
                </motion.p>
                <RiskBadge metrics={metrics} small />
              </div>
            </div>

            {/* 2. QUICK INSIGHT */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-white/60 leading-snug" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                {metrics.quickInsight}
              </p>
            </motion.div>

            {/* 3. SESSION COST — animated money signal */}
            <SessionCostBlock metrics={metrics} compact />

            {/* 4. ISSUES */}
            <div>
              <SectionLabel>
                {isPlusUser ? `All ${SORTED_ISSUES.length} Issues · Metis+` : "Top Issues"}
              </SectionLabel>
              <div>
                {(isPlusUser ? SORTED_ISSUES : SORTED_ISSUES.slice(0, 3)).map((issue, i) => (
                  <div key={issue.title}>
                    <MiniIssueRow issue={issue} delay={0.05 * i} />
                    {/* Plus: show truncated fix hint + savings badge */}
                    {isPlusUser && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.05 * i + 0.1 }}
                        className="ml-3.5 mb-2 px-2.5 py-1.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", borderLeft: `2px solid ${issue.color}40` }}
                      >
                        <p className="text-white/50 mb-1" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                          <span style={{ color: issue.color }}>Fix →</span> {issue.fix.slice(0, 80)}…
                        </p>
                        <span
                          className="rounded-full px-1.5 py-0.5 font-bold"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", fontFamily: "Inter, sans-serif", fontSize: 9 }}
                        >
                          Save ~${issue.saving}/mo
                        </span>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. TECH STACK */}
            <div>
              <SectionLabel>Detected Stack</SectionLabel>
              <StackChips compact delay={0.1} />
              {/* WOW #7 — Smart Stack Detection Badges */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: "rgba(16,163,127,0.15)", border: "1px solid rgba(16,163,127,0.3)" }}
                >
                  <span style={{ fontSize: 9 }}>🤖</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#10a37f" }}>AI usage detected</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  <span style={{ fontSize: 9 }}>⚡</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#a5b4fc" }}>Vercel: cost driver</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER CTA ── */}
      <div
        className="px-4 pb-4 pt-3 shrink-0 space-y-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* WOW #5 — "What Just Happened?" collapsible */}
        <WhatJustHappened metrics={metrics} />
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFullReport}
            className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ background: METIS_RED, color: "white", fontFamily: "Inter, sans-serif", fontSize: 12 }}
          >
            <FileText size={12} />
            Full Report
            <ChevronRight size={12} />
          </motion.button>
          {/* WOW #8 — Copy Report */}
          <CopyReportButton metrics={metrics} />
        </div>
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 15 — FULL SIDE PANEL CONTENT
// mode === "full" — 410px detached floating panel
//
// Layout per MD spec:
//   Score → Quick Insight → All Issues → Stack → Premium/Plus section → CTA
//   Still NO inputs, NO cost breakdown in this layer
// ═════════════════════════════════════════════

/**
 * FullPanelContent
 * The expanded 410px panel with full issue list, stack details,
 * and the Plus upgrade lock gate (replaced when isPlusUser is true).
 *
 * INTEGRATION NOTE:
 *   Same as MiniPanelContent — all data flows through `metrics` prop.
 *   No additional wiring needed when connecting real scanner data.
 */
function FullPanelContent({
  metrics,
  onClose,
  onMinimize,
  onFullReport,
  onUpgrade,
  isPlusUser,
}: {
  metrics: MetisMetrics;
  onClose: () => void;
  onMinimize: () => void;
  onFullReport: () => void;
  onUpgrade: () => void;
  isPlusUser: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), DETECTION_TOTAL_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: PANEL_BG, border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: METIS_RED }}
          >
            <span className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 18 }}>M</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}>
                Metis Scan
              </h2>
              {isPlusUser && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 480, damping: 22 }}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: "rgba(220,94,94,0.18)", border: "1px solid rgba(220,94,94,0.3)" }}
                >
                  <Crown size={8} style={{ color: METIS_RED }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: METIS_RED, fontWeight: 700 }}>Plus</span>
                </motion.div>
              )}
            </div>
            <p className="text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
              {/* INTEGRATION NOTE: Replace with real tab URL + scan timestamp */}
              app.example.com ·{" "}
              {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ProfileButton onDark onUpgrade={onUpgrade} isPlusUser={isPlusUser} />
          <button onClick={onMinimize} className="p-2 rounded-full hover:bg-white/8 transition-colors">
            <Minimize2 size={12} className="text-white/40" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/8 transition-colors">
            <X size={12} className="text-white/40" />
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="loading" className="flex-1"><LoadingScreen /></motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
          >
            {/* SCORE SECTION */}
            <motion.div
              className="px-5 py-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-4">
                <ScoreCircle score={metrics.score} size={92} riskColor={metrics.riskColor} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 28 }}>
                      {metrics.score}
                    </span>
                    <AnimatePresence mode="wait">
                      <RiskBadge key={metrics.riskLabel} metrics={metrics} small />
                    </AnimatePresence>
                    {metrics.scoreAdj !== 0 && <ScoreChangedBadge adj={metrics.scoreAdj} />}
                  </div>
                  <p className="text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                    Cost Risk Score
                  </p>
                  <motion.p
                    key={`${metrics.costRangeMin}-${metrics.costRangeMax}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-white/50 mt-1"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                  >
                    You may be wasting{" "}
                    <span className="text-white font-semibold">
                      ~${metrics.costRangeMin}–${metrics.costRangeMax}/month
                    </span>
                  </motion.p>
                  <motion.p
                    key={metrics.quickInsight}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="text-white/35 mt-1"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                  >
                    {metrics.quickInsight}
                  </motion.p>
                </div>
              </div>
              <div className="mt-4">
                <SessionCostBlock metrics={metrics} />
              </div>
            </motion.div>

            {/* PROBLEMS SECTION */}
            <motion.div
              className="px-5 py-5 space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <SectionLabel icon={AlertCircle}>
                {`${SORTED_ISSUES.length} Issues · By Severity`}
              </SectionLabel>
              {SORTED_ISSUES.map((issue, i) => (
                <FullIssueRow key={issue.title} issue={issue} delay={0.04 * i} onDark />
              ))}
            </motion.div>

            {/* KNOWN STACK */}
            <motion.div
              className="px-5 py-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <SectionLabel icon={Shield}>Detected Stack</SectionLabel>
              <StackChips onDark delay={0.15} />
              <p className="text-white/20 mt-3" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                Auto-detected via network &amp; DOM analysis
              </p>
            </motion.div>

            {/* PREMIUM / PLUS SECTION */}
            <AnimatePresence mode="wait">
              {isPlusUser ? (
                // ── Plus unlocked: show Fix Recommendations ──
                <motion.div
                  key="plus-unlocked"
                  className="px-5 py-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4 }}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={11} style={{ color: METIS_RED }} />
                    <span
                      className="uppercase tracking-widest font-semibold"
                      style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.1em", color: METIS_RED }}
                    >
                      Fix Recommendations · Plus
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {SORTED_ISSUES.map((issue, i) => (
                      <motion.div
                        key={issue.title}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.06 * i }}
                        className="rounded-xl p-3"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${i === 0 ? issue.color + "44" : issue.color + "22"}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {i === 0 ? (
                              <Trophy size={9} style={{ color: "#ffd700" }} />
                            ) : (
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
                                #{i + 1}
                              </span>
                            )}
                            <span className="text-white font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                              {issue.title}
                            </span>
                            {i === 0 && (
                              <span
                                className="rounded-full px-1.5 py-0.5 font-bold"
                                style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700", fontFamily: "Inter, sans-serif", fontSize: 8 }}
                              >
                                Fix First
                              </span>
                            )}
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 font-bold"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", fontFamily: "Inter, sans-serif", fontSize: 9 }}
                          >
                            Save ~${issue.saving}/mo
                          </span>
                        </div>
                        <p className="text-white/45 mb-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, lineHeight: 1.5 }}>
                          <span className="text-white/30">Why: </span>{issue.rootCause}
                        </p>
                        <p className="text-white/60" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, lineHeight: 1.5 }}>
                          <span style={{ color: issue.color }}>Fix → </span>{issue.fix}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                // ── Free: show blurred lock gate ──
                <motion.div
                  key="locked"
                  className="px-5 py-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div
                    className="flex items-center gap-2 mb-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}
                  >
                    <Lock size={11} className="text-white/30" />
                    <span
                      className="text-white/30 uppercase tracking-widest font-semibold"
                      style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.1em" }}
                    >
                      Unlock Full Metis Report
                    </span>
                  </div>
                  <PremiumSection compact onUpgrade={onUpgrade} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER CTA ── */}
      <div
        className="px-5 pb-5 pt-3 shrink-0 space-y-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* WOW #7 — Smart stack detection badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: "rgba(16,163,127,0.12)", border: "1px solid rgba(16,163,127,0.25)" }}
          >
            <span style={{ fontSize: 9 }}>🤖</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#10a37f" }}>AI detected · OpenAI</span>
          </div>
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}
          >
            <span style={{ fontSize: 9 }}>⚡</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#f97316" }}>12 API calls on load</span>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFullReport}
            className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ background: METIS_RED, color: "white", fontFamily: "Inter, sans-serif", fontSize: 12 }}
          >
            <FileText size={12} />
            Full Report
            <ChevronRight size={12} />
          </motion.button>
          <CopyReportButton metrics={metrics} />
        </div>
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════
// SECTION 16 — FULL REPORT MODAL
// 7 sections per cost-optimization-guide.md spec
//
// Section 1: Overview (Score + Cost Range + Severity Pills)
// Section 2: Cost Breakdown (bandwidth/requests/AI rows)
// Section 2b: Scale Simulation (Plus only)
// Section 3: Problems (detailed FullIssueRow list)
// Section 4: Known Stack (grouped by category)
// Section 5: Improve Accuracy (ImproveAccuracyForm — ONLY here)
// Section 6: Refined Output (appears after any input is changed)
// Section 7: Fix Recommendations (Plus) / Premium Lock (Free)
// ═════════════════════════════════════════════

/**
 * FullReportModal
 * The deepest layer of the extension — a centered overlay modal with
 * all 7 sections. The only place AccuracyInputs can be modified.
 *
 * INTEGRATION NOTE:
 *   This modal is fully reactive — every change to `inputs` via
 *   ImproveAccuracyForm propagates up to MetisExtension → computeMetrics()
 *   → back down as updated `metrics`, causing all animated values to update
 *   in real time without any additional wiring.
 */
function FullReportModal({
  metrics,
  inputs,
  onInputsChange,
  onClose,
  onUpgrade,
  isPlusUser,
}: {
  metrics: MetisMetrics;
  inputs: AccuracyInputs;
  onInputsChange: (next: AccuracyInputs) => void;
  onClose: () => void;
  onUpgrade: () => void;
  isPlusUser: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(t);
  }, []);

  // Determines if the Refined Output section should be visible
  // (true when any input deviates from DEFAULT_INPUTS)
  const hasInputs =
    !!inputs.hosting ||
    !!inputs.plan ||
    !!inputs.appType ||
    inputs.traffic !== 1000 ||
    (!!inputs.pagesPerSession && inputs.pagesPerSession !== "3–5") ||
    !!inputs.siteSize;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[90]"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal container */}
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-2xl flex flex-col pointer-events-auto"
          style={{
            maxHeight: "92vh",
            background: DARK_BG,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}
          initial={{ scale: 0.9, y: 28, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 28, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MODAL HEADER ── */}
          <div
            className="flex items-center justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: METIS_RED }}
              >
                <span className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 16 }}>M</span>
              </div>
              <div>
                <h2 className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}>
                  Metis Full Report
                </h2>
                <p className="text-white/30" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                  {/* INTEGRATION NOTE: Replace with real tab URL + scan time */}
                  app.example.com ·{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPlusUser && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 480, damping: 22 }}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(220,94,94,0.18)", border: "1px solid rgba(220,94,94,0.3)" }}
                  >
                    <Crown size={9} style={{ color: METIS_RED }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: METIS_RED, fontWeight: 700 }}>Plus</span>
                  </motion.div>
                  {/* Plus: Export PDF button */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 480, damping: 22, delay: 0.05 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() =>
                      toast.success("Report exported!", {
                        description: "metis-report-acmecorp.pdf downloaded (demo)",
                        duration: 3000,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 cursor-pointer"
                    style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}
                    title="Download PDF report"
                  >
                    <Download size={10} style={{ color: "#60a5fa" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#60a5fa", fontWeight: 600 }}>Export PDF</span>
                  </motion.button>
                </>
              )}
              <ProfileButton onDark onUpgrade={onUpgrade} isPlusUser={isPlusUser} />
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/8 transition-colors">
                <X size={15} className="text-white/35" />
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
          >
            <AnimatePresence mode="wait">
              {!loaded ? (
                <motion.div key="loading" className="h-72">
                  <LoadingScreen />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* ── SECTION 1: Overview ── */}
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start gap-6">
                      <ScoreCircle score={metrics.score} size={108} riskColor={metrics.riskColor} />
                      <div className="flex-1">
                        {/* Score + Risk badge + Adjustment delta */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 42 }}>
                            {metrics.score}
                          </span>
                          <AnimatePresence mode="wait">
                            <RiskBadge key={metrics.riskLabel} metrics={metrics} />
                          </AnimatePresence>
                          {metrics.scoreAdj !== 0 && <ScoreChangedBadge adj={metrics.scoreAdj} />}
                        </div>
                        <p className="text-white/40 mb-3" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                          Cost Risk Score
                        </p>

                        {/* Cost range estimate */}
                        <motion.div
                          key={metrics.breakdown.total}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl px-4 py-3 mb-3"
                          style={{ background: "rgba(255,255,255,0.05)", display: "inline-block" }}
                        >
                          <p className="text-white font-bold" style={{ fontFamily: "Jua, sans-serif", fontSize: 15 }}>
                            ${metrics.costRangeMin}–${metrics.costRangeMax}/month estimated waste
                          </p>
                          <p className="text-white/40 mt-0.5" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                            Driven by bandwidth, requests, and API usage
                          </p>
                        </motion.div>

                        <div className="mb-3">
                          <SessionCostBlock metrics={metrics} />
                        </div>

                        {/* Severity count pills */}
                        <div className="flex gap-2 flex-wrap">
                          {(["critical", "moderate", "low"] as const).map((sev) => {
                            const color = sev === "critical" ? "#ef4444" : sev === "moderate" ? "#f97316" : "#eab308";
                            const count = SORTED_ISSUES.filter((i) => i.severity === sev).length;
                            return (
                              <div
                                key={sev}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                                style={{ background: color + "18" }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                <span
                                  className="font-semibold capitalize"
                                  style={{ color, fontFamily: "Inter, sans-serif", fontSize: 11 }}
                                >
                                  {count} {sev}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 2: Cost Breakdown ── */}
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionLabel icon={Zap}>Cost Breakdown</SectionLabel>
                    <p className="text-white/28 mb-4" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                      Where your estimated waste is coming from
                    </p>
                    <CostBreakdownRows breakdown={metrics.breakdown} onDark delay={0.05} />
                  </div>

                  {/* ── SECTION 2b: Scale Simulation (Plus only) ── */}
                  {isPlusUser && (
                    <motion.div
                      className="px-6 py-6"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        <Target size={11} className="text-white/30" />
                        <span
                          className="text-white/30 text-xs uppercase tracking-widest font-semibold"
                          style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.1em" }}
                        >
                          Scale Simulation · Plus
                        </span>
                      </div>
                      <p className="text-white/28 mb-4" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                        If traffic grows, here's what this cost profile becomes
                      </p>
                      <ScaleSimulation metrics={metrics} />
                    </motion.div>
                  )}

                  {/* ── SECTION 3: Problems (detailed) ── */}
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionLabel icon={AlertCircle}>Problems · Sorted by Severity</SectionLabel>
                    <div className="space-y-2">
                      {SORTED_ISSUES.map((issue, i) => (
                        <FullIssueRow key={issue.title} issue={issue} delay={0.04 * i} onDark />
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 4: Known Stack (detailed, grouped) ── */}
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionLabel icon={Shield}>Known Stack</SectionLabel>
                    <div className="space-y-3">
                      {MOCK_DETAILED_STACK.map((group, i) => (
                        <motion.div
                          key={group.label}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="flex items-start gap-3"
                        >
                          <span
                            className="text-white/25 pt-0.5 shrink-0 w-28"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                          >
                            {group.label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {group.items.map((item) => {
                              const stackItem = MOCK_STACK_ITEMS.find((s) =>
                                s.name.startsWith(item.split(" ")[0])
                              );
                              return (
                                <span
                                  key={item}
                                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white/65"
                                  style={{ background: "rgba(255,255,255,0.07)", fontFamily: "Inter, sans-serif", fontSize: 11 }}
                                >
                                  {stackItem && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ background: stackItem.color, display: "inline-block" }}
                                    />
                                  )}
                                  {item}
                                </span>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-white/20 mt-4" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                      Auto-detected via network &amp; DOM analysis
                    </p>
                  </div>

                  {/* ── SECTION 5: Improve Accuracy — ONLY lives here ── */}
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <ImproveAccuracyForm inputs={inputs} onChange={onInputsChange} />
                  </div>

                  {/* ── SECTION 6: Refined Output — conditional ── */}
                  {hasInputs && (
                    <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <RefinedOutput metrics={metrics} inputs={inputs} visible={hasInputs} />
                    </div>
                  )}

                  {/* ── SECTION 7: Fix Recommendations (Plus) / Premium Lock (Free) ── */}
                  <AnimatePresence mode="wait">
                    {isPlusUser ? (
                      <motion.div
                        key="plus-fixes"
                        className="px-6 py-6"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {/* Header + total savings badge */}
                        <div className="flex items-center gap-2 mb-5">
                          <Crown size={11} style={{ color: METIS_RED }} />
                          <span
                            className="uppercase tracking-widest font-semibold"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.1em", color: METIS_RED }}
                          >
                            Fix Recommendations · Metis+
                          </span>
                          <span
                            className="ml-auto rounded-full px-2.5 py-1 font-bold"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", fontFamily: "Inter, sans-serif", fontSize: 10 }}
                          >
                            Total savings: ~${SORTED_ISSUES.reduce((s, i) => s + i.saving, 0)}/mo
                          </span>
                        </div>

                        {/* One card per issue */}
                        <div className="space-y-4">
                          {SORTED_ISSUES.map((issue, i) => (
                            <motion.div
                              key={issue.title}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.06 * i }}
                              className="rounded-2xl overflow-hidden"
                              style={{
                                border: `1px solid ${i === 0 ? issue.color + "55" : issue.color + "25"}`,
                                boxShadow: i === 0 ? `0 0 20px ${issue.color}10` : "none",
                              }}
                            >
                              {/* Issue card header */}
                              <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ background: issue.color + (i === 0 ? "20" : "12") }}
                              >
                                <div className="flex items-center gap-2">
                                  {/* Priority badge — trophy for #1, numbered for rest */}
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{
                                      background: i === 0 ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.08)",
                                      border: i === 0 ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                    }}
                                  >
                                    {i === 0 ? (
                                      <Trophy size={9} style={{ color: "#ffd700" }} />
                                    ) : (
                                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                                        #{i + 1}
                                      </span>
                                    )}
                                  </div>
                                  <issue.icon size={12} style={{ color: issue.color }} />
                                  <span className="text-white font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                                    {issue.title}
                                  </span>
                                  <span
                                    className="rounded-full px-1.5 py-0.5"
                                    style={{ background: issue.color + "25", color: issue.color, fontFamily: "Inter, sans-serif", fontSize: 9 }}
                                  >
                                    {issue.severity}
                                  </span>
                                  {i === 0 && (
                                    <span
                                      className="flex items-center gap-1 rounded-full px-2 py-0.5 font-bold"
                                      style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700", fontFamily: "Inter, sans-serif", fontSize: 9 }}
                                    >
                                      <Trophy size={8} />
                                      Fix First
                                    </span>
                                  )}
                                </div>
                                <span
                                  className="rounded-full px-2.5 py-1 font-bold shrink-0"
                                  style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", fontFamily: "Inter, sans-serif", fontSize: 10 }}
                                >
                                  Save ~${issue.saving}/mo
                                </span>
                              </div>

                              {/* Issue card body */}
                              <div className="px-4 py-3 space-y-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                                {/* Root cause */}
                                <div>
                                  <p className="text-white/30 mb-1" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.05em" }}>
                                    ROOT CAUSE
                                  </p>
                                  <p className="text-white/55 leading-relaxed" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                                    {issue.rootCause}
                                  </p>
                                </div>

                                {/* Fix with left border accent */}
                                <div
                                  className="rounded-xl px-3 py-2.5"
                                  style={{ background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${issue.color}` }}
                                >
                                  <p className="mb-1" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: issue.color, letterSpacing: "0.05em" }}>
                                    FIX
                                  </p>
                                  <p className="text-white/70 leading-relaxed" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                                    {issue.fix}
                                  </p>
                                </div>

                                {/* Scale impact footer */}
                                <div className="flex items-center gap-2">
                                  <TrendingDown size={10} className="text-indigo-400 shrink-0" />
                                  <p className="text-white/35 italic" style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}>
                                    {issue.scaleImpact}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      // Free: locked section
                      <motion.div
                        key="locked"
                        className="px-6 py-6"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Lock size={11} className="text-white/30" />
                          <span
                            className="text-white/30 uppercase tracking-widest font-semibold"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.1em" }}
                          >
                            Unlock Full Metis Report
                          </span>
                        </div>
                        <PremiumSection onUpgrade={onUpgrade} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── MODAL FOOTER: Copy + Export ── */}
          <div
            className="px-6 py-4 shrink-0 flex items-center justify-between gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-white/20" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
              ward.studio/metis
            </span>
            <div className="flex items-center gap-2">
              {/* Copy plaintext summary */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const txt = `Metis Report — app.example.com\nRisk: ${metrics.score}/100 (${metrics.riskLabel})\nWaste: ~$${metrics.costRangeMin}–$${metrics.costRangeMax}/month\n${SORTED_ISSUES.map((i, idx) => `${idx + 1}. ${i.title} — Save ~$${i.saving}/mo`).join("\n")}\n— metis.ward.studio`;
                  navigator.clipboard.writeText(txt).then(() =>
                    toast.success("Report copied!", {
                      description: "Ready to paste into Slack or Notion.",
                      duration: 2500,
                    })
                  );
                }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                }}
              >
                <Copy size={11} />
                Copy
              </motion.button>

              {/* Export PDF — Plus only (demo toast for Free) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  toast.success("Report exported!", {
                    description: "metis-report-acmecorp.pdf downloaded (demo)",
                    duration: 3000,
                  })
                }
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold"
                style={{
                  background: isPlusUser ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.07)",
                  color: isPlusUser ? "#60a5fa" : "rgba(255,255,255,0.65)",
                  border: isPlusUser ? "1px solid rgba(96,165,250,0.25)" : "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                }}
              >
                <Download size={12} />
                {isPlusUser ? "Export PDF" : "Export PDF (Plus)"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}


// ═════════════════════════════════════════════
// SECTION 17 — ROOT COMPONENT
// MetisExtension — the single exported component
// All extension state lives here
// ═════════════════════════════════════════════

/**
 * MetisExtension
 * The root component for the Metis Chrome extension UI.
 *
 * STATE:
 *   mode       — Which panel layer is open (idle | mini | full)
 *   showReport — Full Report modal overlay
 *   showPlus   — Plus Upgrade modal overlay
 *   isPlusUser — Has the user upgraded? (persisted in production)
 *   isHovered  — Tab button hover state (for tooltip)
 *   inputs     — AccuracyInputs from the Improve Accuracy form
 *
 * METRICS:
 *   Recomputed on every render from inputs. Since inputs change is
 *   the only trigger, React's batching ensures no unnecessary recomputes.
 *
 * INTEGRATION NOTE:
 *   In a real Chrome extension, this component would be mounted in the
 *   side panel HTML page (chrome.sidePanel):
 *
 *   ```ts
 *   // manifest.json
 *   "side_panel": { "default_path": "sidepanel.html" }
 *
 *   // background.js
 *   chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
 *   ```
 *
 *   The component root would then be:
 *   ```tsx
 *   // sidepanel.tsx
 *   import { createRoot } from 'react-dom/client';
 *   import { MetisExtension } from './components/MetisExtension';
 *   createRoot(document.getElementById('root')!).render(<MetisExtension />);
 *   ```
 */
export function MetisExtension() {
  // ── Panel state ────────────────────────────────────────────────────────────
  const [mode, setMode]             = useState<PanelMode>("mini");
  const [showReport, setShowReport] = useState(false);
  const [showPlus, setShowPlus]     = useState(false);
  // INTEGRATION NOTE: Derive from auth session / Stripe subscription
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [isHovered, setIsHovered]   = useState(false);

  // ── Accuracy inputs — the single source of truth for score computation ─────
  // INTEGRATION NOTE: Hydrate from chrome.storage.sync on mount
  const [inputs, setInputs] = useState<AccuracyInputs>(DEFAULT_INPUTS);

  // ── Recompute metrics on every render ─────────────────────────────────────
  // This is intentionally in the render body (not useMemo) because:
  // 1. computeMetrics is extremely fast (pure arithmetic, <0.1ms)
  // 2. It needs to update synchronously with inputs for the "live" UX
  const metrics = computeMetrics(inputs);

  return (
    <>
      {/* ════════════════════════════════════════════
          IDLE STATE — Floating "M" tab button
          WOW Feature #3: Risk pulse ring
          WOW Feature #3: Pulsing risk dot
          Positioned: bottom-right, attached to viewport edge
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {mode === "idle" && (
          <motion.div
            className="fixed right-0 z-50"
            style={{ bottom: "5rem" }} // Per metis-design-spec.md
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            {/* Hover tooltip — "High Risk detected / Click to open Metis" */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap"
                  initial={{ opacity: 0, x: 8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="rounded-xl px-3 py-2 shadow-2xl"
                    style={{ background: DARK_BG, border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: metrics.riskColor }} />
                      <span className="text-white font-semibold" style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                        {metrics.riskLabel} detected
                      </span>
                    </div>
                    <p className="text-white/35 mt-0.5" style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}>
                      Click to open Metis
                    </p>
                    {/* Tooltip arrow pointing right toward the button */}
                    <div
                      className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
                      style={{
                        background: DARK_BG,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The "M" tab button */}
            <motion.button
              onClick={() => setMode("mini")}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative flex flex-col items-center gap-2 py-4 px-3 cursor-pointer shadow-2xl"
              style={{
                background: DARK_BG,
                borderRadius: "12px 0 0 12px",  // Flat right edge — "attached" to viewport
                minWidth: 44,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRight: "none",
              }}
              whileHover={{ x: -3 }}             // Slight left nudge on hover
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              {/* WOW #3 — Risk pulse ring: glows behind the button when score ≥ 60 */}
              {metrics.score >= 60 && (
                <motion.div
                  className="absolute inset-0 rounded-l-xl pointer-events-none"
                  style={{ borderRadius: "12px 0 0 12px" }}
                  animate={{
                    boxShadow: [
                      `inset 0 0 0px 0px ${metrics.riskColor}00`,
                      `inset 0 0 12px 2px ${metrics.riskColor}40`,
                      `inset 0 0 0px 0px ${metrics.riskColor}00`,
                    ],
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Metis "M" glyph */}
              <span className="text-white leading-none" style={{ fontFamily: "Jua, sans-serif", fontSize: 18 }}>
                M
              </span>

              {/* WOW #3 — Pulsing risk dot: pulses when score ≥ 70 (high/moderate risk) */}
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: metrics.riskColor }}
                animate={
                  metrics.score >= 70
                    ? { scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }
                    : {}
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          MINI PANEL — 288px, edge-attached slide-in
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {mode === "mini" && (
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-[288px] shadow-2xl"
            initial={{ x: 310, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 310, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            <MiniPanelContent
              metrics={metrics}
              onClose={() => setMode("idle")}
              onExpand={() => setMode("full")}
              onFullReport={() => setShowReport(true)}
              onUpgrade={() => setShowPlus(true)}
              isPlusUser={isPlusUser}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          FULL SIDE PANEL — 410px detached, with backdrop
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {mode === "full" && (
          <>
            {/* Semi-transparent backdrop — click to close */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(3px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMode("idle")}
            />
            {/* Panel */}
            <motion.div
              className="fixed right-5 top-5 bottom-5 z-50 w-[410px] shadow-2xl"
              initial={{ x: 50, opacity: 0, scale: 0.97 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 50, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
            >
              <FullPanelContent
                metrics={metrics}
                onClose={() => setMode("idle")}
                onMinimize={() => setMode("mini")}
                onFullReport={() => setShowReport(true)}
                onUpgrade={() => setShowPlus(true)}
                isPlusUser={isPlusUser}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          FULL REPORT MODAL — centered overlay
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {showReport && (
          <FullReportModal
            metrics={metrics}
            inputs={inputs}
            onInputsChange={setInputs}
            onClose={() => setShowReport(false)}
            onUpgrade={() => setShowPlus(true)}
            isPlusUser={isPlusUser}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          PLUS UPGRADE MODAL — highest z-index overlay
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPlus && (
          <PlusUpgradeModal
            onClose={() => setShowPlus(false)}
            onConfirm={() => {
              setIsPlusUser(true);
              setShowPlus(false);
              // INTEGRATION NOTE: After real payment verification:
              // 1. Call your auth API to update user tier
              // 2. Store isPlusUser in chrome.storage.sync
              // 3. Optionally reload the scanner to run Plus-tier analysis
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

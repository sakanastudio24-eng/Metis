// Render the injected Metis panel around Phase 3 scoring, issue detection,
// and the supporting diagnostics that help a page owner trust the result.
import {
  ChevronLeft,
  CircleCheckBig,
  Expand,
  Minimize2,
  Radar,
  ScanSearch,
  Sparkles,
  TriangleAlert,
  X
} from "lucide-react";
import { detectIssues } from "../../features/detection";
import { buildMultipageSnapshot } from "../../features/scan";
import { scoreSnapshot } from "../../features/scoring";
import type { PanelMode, ScanScope } from "../useMetisState";
import type {
  DetectedIssue,
  RawScanSnapshot,
  ResourceAggregate,
  ScoreBreakdown
} from "../../shared/types/audit";

const phaseStatus = [
  {
    phase: "Phase 1",
    title: "Extension shell",
    status: "Complete",
    tone: "done"
  },
  {
    phase: "Phase 2",
    title: "Live page scan",
    status: "Complete",
    tone: "done"
  },
  {
    phase: "Phase 3",
    title: "Detection and scoring",
    status: "Active",
    tone: "active"
  },
  {
    phase: "Phase 4",
    title: "Insight and polish",
    status: "Queued",
    tone: "queued"
  }
];

const severityTone = {
  high: {
    badge: "bg-[#3a1d18] text-[#ffb48a]",
    border: "border-[#f97316]/25",
    accent: "text-[#f97316]"
  },
  medium: {
    badge: "bg-[#352f14] text-[#facc15]",
    border: "border-[#facc15]/20",
    accent: "text-[#facc15]"
  },
  low: {
    badge: "bg-[#173226] text-[#86efac]",
    border: "border-[#22c55e]/20",
    accent: "text-[#22c55e]"
  }
} as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">
      {children}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

function formatNumberDelta(value: number) {
  if (value === 0) {
    return "no change";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatByteDelta(value: number) {
  if (value === 0) {
    return "no change";
  }

  const absoluteValue = formatBytes(Math.abs(value));
  return value > 0 ? `+${absoluteValue}` : `-${absoluteValue}`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function getScoreTone(score: ScoreBreakdown) {
  if (score.label === "high risk") {
    return {
      border: "border-[#f97316]/25",
      ring: "bg-[#2f1a13]",
      icon: "text-[#f97316]",
      text: "text-[#ffb48a]"
    };
  }

  if (score.label === "watch") {
    return {
      border: "border-[#facc15]/20",
      ring: "bg-[#2d2812]",
      icon: "text-[#facc15]",
      text: "text-[#fde68a]"
    };
  }

  if (score.label === "warming up") {
    return {
      border: "border-white/10",
      ring: "bg-[#10253a]",
      icon: "text-white/60",
      text: "text-white/80"
    };
  }

  return {
    border: "border-[#22c55e]/20",
    ring: "bg-[#143026]",
    icon: "text-[#22c55e]",
    text: "text-[#bbf7d0]"
  };
}

function buildSummaryLine(
  score: ScoreBreakdown,
  issues: DetectedIssue[],
  scanScope: ScanScope
) {
  const scopeLabel = scanScope === "multi" ? "across the visited pages" : "on this page";

  if (score.label === "warming up") {
    return "Metis is still collecting enough network detail to score this page.";
  }

  if (issues.length === 0) {
    return `No major cost-risk patterns surfaced ${scopeLabel}, so the current request profile looks controlled.`;
  }

  if (score.label === "high risk") {
    return `${issues[0].title} ${scopeLabel}, and the current load pattern likely deserves active cleanup.`;
  }

  if (score.label === "watch") {
    return `${issues[0].title} ${scopeLabel}, so the experience is worth tightening before it grows heavier.`;
  }

  return `Most signals look healthy ${scopeLabel}, but ${issues[0].title.toLowerCase()}.`;
}

function IssueCard({ issue, compact = false }: { issue: DetectedIssue; compact?: boolean }) {
  const tone = severityTone[issue.severity];

  return (
    <div
      className={`rounded-2xl border ${tone.border} bg-[#10253a] px-4 py-4 ${
        compact ? "" : "min-h-[132px]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{issue.title}</div>
          <div className="mt-2 text-sm leading-6 text-white/58">{issue.detail}</div>
        </div>
        <div
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}
        >
          {issue.severity}
        </div>
      </div>
    </div>
  );
}

function OffenderList({
  title,
  items,
  emptyLabel
}: {
  title: string;
  items: ResourceAggregate[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="mt-2 text-sm text-white/50">{emptyLabel}</div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={`${title}-${item.normalizedUrl}`}
              className="rounded-2xl bg-[#0d2234] px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {item.hostname}
                  </div>
                  <div className="truncate text-xs text-white/48">{item.normalizedUrl}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-white">
                    {formatBytes(item.totalEncodedBodySize)}
                  </div>
                  <div className="text-xs text-white/45">{item.requestCount} hits</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreOverview({
  score,
  issues,
  scanScope,
  compact = false
}: {
  score: ScoreBreakdown;
  issues: DetectedIssue[];
  scanScope: ScanScope;
  compact?: boolean;
}) {
  const tone = getScoreTone(score);
  const summary = buildSummaryLine(score, issues, scanScope);

  return (
    <div className={`rounded-3xl border ${tone.border} bg-white/[0.04] p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">
            {compact ? "Phase 3 Score" : "Phase 3 Cost-Risk Score"}
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-[3rem] font-semibold leading-none text-white">{score.score}</div>
            <div className={`pb-1 text-sm font-semibold uppercase tracking-[0.16em] ${tone.text}`}>
              {titleCase(score.label)}
            </div>
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.ring}`}
        >
          {score.label === "high risk" ? (
            <TriangleAlert size={18} className={tone.icon} />
          ) : score.label === "watch" ? (
            <Radar size={18} className={tone.icon} />
          ) : (
            <CircleCheckBig size={18} className={tone.icon} />
          )}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/62">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="rounded-full bg-[#10253a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/58">
          {scanScope === "multi" ? "Multipage scope" : "Single page scope"}
        </div>
        <div className="rounded-full bg-[#10253a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/58">
          {issues.length} issue{issues.length === 1 ? "" : "s"} surfaced
        </div>
      </div>
    </div>
  );
}

function SnapshotSummary({
  scanScope,
  setScanScope,
  rawSnapshot,
  baselineSnapshot,
  visitedSnapshots,
  compact = false
}: {
  scanScope: ScanScope;
  setScanScope: (scope: ScanScope) => void;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
  compact?: boolean;
}) {
  if (!rawSnapshot) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <SectionLabel>Phase 3 Scoring</SectionLabel>
        <div className="text-base text-white/60">Collecting enough signal to score the page…</div>
      </div>
    );
  }

  const activeSnapshot =
    scanScope === "multi" ? buildMultipageSnapshot(rawSnapshot, visitedSnapshots) : rawSnapshot;
  const activeMetrics = activeSnapshot.metrics;
  const issues = detectIssues(activeSnapshot);
  const score = scoreSnapshot(activeSnapshot, issues);
  const visibleIssues = compact ? issues.slice(0, 2) : issues;
  const pagesVisited = Math.max(visitedSnapshots.length, 1);

  const stats = [
    { label: "Requests", value: activeMetrics.requestCount },
    { label: "Unique URLs", value: activeMetrics.uniqueRequestCount },
    { label: "Duplicate Hits", value: activeMetrics.duplicateRequestCount },
    { label: "3P Domains", value: activeMetrics.thirdPartyDomainCount }
  ];

  const qualityStats = [
    { label: "Known Weight", value: formatBytes(activeMetrics.totalEncodedBodySize) },
    { label: "Images >50KB", value: activeMetrics.meaningfulImageCount.toString() },
    { label: "Pages Visited", value: scanScope === "multi" ? pagesVisited.toString() : "1" }
  ];

  const baselineStats = baselineSnapshot
    ? [
        {
          label: "Requests",
          value: baselineSnapshot.metrics.requestCount.toString(),
          delta: activeMetrics.requestCount - baselineSnapshot.metrics.requestCount,
          kind: "number" as const
        },
        {
          label: "Unique URLs",
          value: baselineSnapshot.metrics.uniqueRequestCount.toString(),
          delta: activeMetrics.uniqueRequestCount - baselineSnapshot.metrics.uniqueRequestCount,
          kind: "number" as const
        },
        {
          label: "Known Weight",
          value: formatBytes(baselineSnapshot.metrics.totalEncodedBodySize),
          delta:
            activeMetrics.totalEncodedBodySize - baselineSnapshot.metrics.totalEncodedBodySize,
          kind: "bytes" as const
        },
        {
          label: "3P Domains",
          value: baselineSnapshot.metrics.thirdPartyDomainCount.toString(),
          delta:
            activeMetrics.thirdPartyDomainCount - baselineSnapshot.metrics.thirdPartyDomainCount,
          kind: "number" as const
        }
      ]
    : [];

  const baselinePath = baselineSnapshot?.page.pathname || "/";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <SectionLabel>Phase 3 Scoring</SectionLabel>
      <div className="flex items-center gap-2 text-white">
        <Radar size={16} className="text-[#f97316]" />
        <div className="text-base font-semibold">{rawSnapshot.page.hostname}</div>
      </div>
      <div className="mt-2 text-sm text-white/48">
        {rawSnapshot.page.pathname || "/"} · {new Date(activeSnapshot.scannedAt).toLocaleTimeString()}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setScanScope("single")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            scanScope === "single"
              ? "bg-[#f97316] text-[#0d1b2a]"
              : "bg-[#10253a] text-white/68"
          }`}
        >
          Single Page
        </button>
        <button
          type="button"
          onClick={() => setScanScope("multi")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            scanScope === "multi"
              ? "bg-[#f97316] text-[#0d1b2a]"
              : "bg-[#10253a] text-white/68"
          }`}
        >
          Multipage
        </button>
      </div>

      <div className="mt-5">
        <ScoreOverview score={score} issues={issues} scanScope={scanScope} compact={compact} />
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Surfaced Issues
        </div>
        {visibleIssues.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-[#22c55e]/20 bg-[#10253a] px-4 py-4 text-sm leading-6 text-white/62">
            No major cost-risk patterns surfaced from the current normalized request set.
          </div>
        ) : (
          <div className={`mt-3 grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1"}`}>
            {visibleIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} compact={compact} />
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/15 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Score Breakdown
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {qualityStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[#0d2234] px-4 py-3.5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
                    {stat.label}
                  </div>
                  <div className="mt-1.5 text-xl font-semibold leading-none text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-white/48">
              Normalized from {activeMetrics.rawRequestCount} raw entries. Filtered out{" "}
              {activeMetrics.droppedZeroTransferCount + activeMetrics.droppedTinyCount} noisy requests.
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[#0d2234] px-4 py-3.5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
                    {stat.label}
                  </div>
                  <div className="mt-1.5 text-2xl font-semibold leading-none text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {score.deductions.length === 0 ? (
                <div className="rounded-2xl bg-[#0d2234] px-4 py-3.5 text-sm text-white/58">
                  No deductions were applied from the current issue set.
                </div>
              ) : (
                score.deductions.map((deduction) => (
                  <div
                    key={deduction.reason}
                    className="flex items-center justify-between rounded-2xl bg-[#0d2234] px-4 py-3.5"
                  >
                    <div className="text-sm text-white/74">{deduction.reason}</div>
                    <div className="text-sm font-semibold text-[#f97316]">
                      -{deduction.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 grid-cols-2">
            <OffenderList
              title="Top Offenders"
              items={activeMetrics.topOffenders}
              emptyLabel="No large offenders surfaced from the cleaned request set yet."
            />
            <OffenderList
              title="Large Images"
              items={activeMetrics.topMeaningfulImages}
              emptyLabel="No meaningful image weight was detected above the 50 KB threshold."
            />
          </div>

          {baselineSnapshot && (
            <div className="mt-5 rounded-2xl border border-white/8 bg-black/15 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Original vs Current
              </div>
              <div className="mt-2 text-sm text-white/52">
                Original baseline: {baselinePath}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {baselineStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-[#0d2234] px-4 py-3.5">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-base font-semibold text-white/82">
                      {stat.value} baseline
                    </div>
                    <div
                      className={`mt-1 text-sm font-semibold ${
                        stat.delta > 0
                          ? "text-[#f97316]"
                          : stat.delta < 0
                            ? "text-[#22c55e]"
                            : "text-white/50"
                      }`}
                    >
                      {stat.kind === "bytes"
                        ? formatByteDelta(stat.delta)
                        : formatNumberDelta(stat.delta)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniPanel({
  setPanelMode,
  scanScope,
  setScanScope,
  rawSnapshot,
  baselineSnapshot,
  visitedSnapshots
}: {
  setPanelMode: (mode: PanelMode) => void;
  scanScope: ScanScope;
  setScanScope: (scope: ScanScope) => void;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
}) {
  return (
    <div className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[340px] flex-col border-l border-white/10 bg-[#0d1b2a] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f97316] text-base font-bold text-[#0d1b2a]">
            M
          </div>
          <div>
            <div className="text-base font-semibold">Metis</div>
            <div className="text-sm text-white/48">Phase 3 live scoring</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPanelMode("full")}
            className="rounded-full p-2 text-white/55 transition hover:bg-white/8 hover:text-white"
            title="Open full panel"
          >
            <Expand size={14} />
          </button>
          <button
            type="button"
            onClick={() => setPanelMode("idle")}
            className="rounded-full p-2 text-white/55 transition hover:bg-white/8 hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-3 flex items-center gap-2 text-[#f97316]">
            <ScanSearch size={16} />
            <span className="text-sm font-semibold uppercase tracking-[0.16em]">
              Phase 3
            </span>
          </div>
          <div className="text-[2rem] font-semibold leading-none">Scoring Live Cost Risk</div>
          <p className="mt-3 text-base leading-7 text-white/62">
            Metis now turns cleaned request data into issues and a score instead of only showing raw scan output.
          </p>
          <p className="mt-3 text-sm leading-6 text-white/48">
            Refresh the extension in chrome://extensions and refresh the page whenever the content script changes.
          </p>
        </div>

        <div className="mt-5">
          <SnapshotSummary
            scanScope={scanScope}
            setScanScope={setScanScope}
            rawSnapshot={rawSnapshot}
            baselineSnapshot={baselineSnapshot}
            visitedSnapshots={visitedSnapshots}
            compact
          />
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <SectionLabel>Roadmap Status</SectionLabel>
          <div className="space-y-2.5">
            {phaseStatus.map((item) => (
              <div
                key={item.phase}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/6 bg-[#10253a] px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  {item.tone === "done" ? (
                    <CircleCheckBig size={16} className="mt-0.5 shrink-0 text-[#22c55e]" />
                  ) : item.tone === "active" ? (
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-[#f97316]" />
                  ) : (
                    <TriangleAlert size={16} className="mt-0.5 shrink-0 text-[#facc15]" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.phase} · {item.title}
                    </div>
                    <div className="mt-1 text-sm text-white/58">{item.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <button
          type="button"
          onClick={() => setPanelMode("full")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-4 py-3.5 text-base font-semibold text-[#0d1b2a] transition hover:brightness-105"
        >
          Open Full Panel
          <ChevronLeft size={14} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}

function FullPanel({
  setPanelMode,
  scanScope,
  setScanScope,
  rawSnapshot,
  baselineSnapshot,
  visitedSnapshots
}: {
  setPanelMode: (mode: PanelMode) => void;
  scanScope: ScanScope;
  setScanScope: (scope: ScanScope) => void;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-[2147483646] bg-black/30 backdrop-blur-[2px]"
        onClick={() => setPanelMode("idle")}
      />
      <div className="fixed right-5 top-5 z-[2147483647] flex h-[calc(100vh-40px)] w-[460px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1b2a] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-base font-semibold">Metis Full Panel</div>
            <div className="text-sm text-white/48">Phase 3 cost-risk scoring</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanelMode("mini")}
              className="rounded-full p-2 text-white/55 transition hover:bg-white/8 hover:text-white"
              title="Minimize"
            >
              <Minimize2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPanelMode("idle")}
              className="rounded-full p-2 text-white/55 transition hover:bg-white/8 hover:text-white"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <SectionLabel>Current State</SectionLabel>
            <div className="text-[2.6rem] font-semibold leading-none">Phase 3 Active</div>
            <p className="mt-4 text-base leading-7 text-white/64">
              The extension now converts normalized request data into a score, a short issue stack, and supporting diagnostics that explain why the page looks healthy or risky.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/48">
              This still runs fully in the content script with Manifest V3 and uses chrome.storage.local only for baseline and visited-page state.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <SectionLabel>Surface</SectionLabel>
              <div className="text-xl font-semibold">Content Script UI</div>
              <p className="mt-2 text-base text-white/58">
                Injected into normal webpages inside a Shadow DOM.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <SectionLabel>Permissions</SectionLabel>
              <div className="text-xl font-semibold">Storage + Host Access</div>
              <p className="mt-2 text-base text-white/58">
                No new Phase 3 permissions were added beyond the current scan flow.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <SnapshotSummary
              scanScope={scanScope}
              setScanScope={setScanScope}
              rawSnapshot={rawSnapshot}
              baselineSnapshot={baselineSnapshot}
              visitedSnapshots={visitedSnapshots}
            />
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <SectionLabel>Roadmap Status</SectionLabel>
            <div className="space-y-3">
              {phaseStatus.map((item) => (
                <div
                  key={item.phase}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-[#10253a] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    {item.tone === "done" ? (
                      <CircleCheckBig size={18} className="mt-0.5 shrink-0 text-[#22c55e]" />
                    ) : item.tone === "active" ? (
                      <Sparkles size={18} className="mt-0.5 shrink-0 text-[#f97316]" />
                    ) : (
                      <TriangleAlert size={18} className="mt-0.5 shrink-0 text-[#facc15]" />
                    )}
                    <div>
                      <div className="text-base font-semibold text-white">
                        {item.phase} · {item.title}
                      </div>
                      <div className="mt-1 text-sm text-white/58">{item.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function PhaseOneShell({
  panelMode,
  setPanelMode,
  scanScope,
  setScanScope,
  rawSnapshot,
  baselineSnapshot,
  visitedSnapshots
}: {
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
  scanScope: ScanScope;
  setScanScope: (scope: ScanScope) => void;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
}) {
  return (
    <>
      {panelMode === "idle" && (
        <div className="fixed bottom-20 right-0 z-[2147483647]">
          <button
            type="button"
            onClick={() => setPanelMode("mini")}
            className="group flex min-w-12 items-center gap-3 rounded-l-2xl border border-r-0 border-white/10 bg-[#0d1b2a] px-4 py-4 text-white shadow-2xl transition hover:-translate-x-1"
            title="Open Metis"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f97316] text-base font-bold text-[#0d1b2a]">
              M
            </div>
            <div className="hidden pr-1 text-left group-hover:block">
              <div className="text-sm font-semibold">Metis</div>
              <div className="text-xs text-white/45">Open cost-risk panel</div>
            </div>
          </button>
        </div>
      )}

      {panelMode === "mini" && (
        <MiniPanel
          setPanelMode={setPanelMode}
          scanScope={scanScope}
          setScanScope={setScanScope}
          rawSnapshot={rawSnapshot}
          baselineSnapshot={baselineSnapshot}
          visitedSnapshots={visitedSnapshots}
        />
      )}
      {panelMode === "full" && (
        <FullPanel
          setPanelMode={setPanelMode}
          scanScope={scanScope}
          setScanScope={setScanScope}
          rawSnapshot={rawSnapshot}
          baselineSnapshot={baselineSnapshot}
          visitedSnapshots={visitedSnapshots}
        />
      )}
    </>
  );
}

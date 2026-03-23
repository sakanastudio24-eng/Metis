import {
  ChevronLeft,
  Expand,
  Minimize2,
  Sparkles,
  TriangleAlert,
  X
} from "lucide-react";
import type { PanelMode } from "../useMetisState";

const previewIssues = [
  "Issue detection arrives in Phase 3",
  "Real page scanning arrives in Phase 2",
  "Cost insight arrives in Phase 4"
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
      {children}
    </div>
  );
}

function MiniPanel({ setPanelMode }: { setPanelMode: (mode: PanelMode) => void }) {
  return (
    <div className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[320px] flex-col border-l border-white/10 bg-[#0d1b2a] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f97316] text-sm font-bold text-[#0d1b2a]">
            M
          </div>
          <div>
            <div className="text-sm font-semibold">Metis</div>
            <div className="text-xs text-white/45">Static UI injection preview</div>
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

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#f97316]">
            <Sparkles size={14} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Phase 1
            </span>
          </div>
          <div className="text-2xl font-semibold leading-none">UI Injected</div>
          <p className="mt-2 text-sm leading-6 text-white/60">
            The extension is mounted on the page and ready for the next phases.
          </p>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <SectionLabel>What Works Now</SectionLabel>
          <ul className="space-y-2 text-sm text-white/72">
            <li>Floating trigger mounts on normal webpages</li>
            <li>Mini panel opens and closes inside the page</li>
            <li>Full panel expands without any backend or auth</li>
          </ul>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <SectionLabel>Next Roadmap Layers</SectionLabel>
          <div className="space-y-2">
            {previewIssues.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/6 bg-[#10253a] px-3 py-3"
              >
                <TriangleAlert size={14} className="mt-0.5 shrink-0 text-[#f97316]" />
                <span className="text-sm text-white/68">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          type="button"
          onClick={() => setPanelMode("full")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-4 py-3 text-sm font-semibold text-[#0d1b2a] transition hover:brightness-105"
        >
          Open Full Static Panel
          <ChevronLeft size={14} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}

function FullPanel({ setPanelMode }: { setPanelMode: (mode: PanelMode) => void }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[2147483646] bg-black/30 backdrop-blur-[2px]"
        onClick={() => setPanelMode("idle")}
      />
      <div className="fixed right-5 top-5 z-[2147483647] flex h-[calc(100vh-40px)] w-[420px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1b2a] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Metis Full Panel</div>
            <div className="text-xs text-white/45">Phase 1 static experience</div>
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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <SectionLabel>Current State</SectionLabel>
            <div className="text-4xl font-semibold leading-none">Phase 1 Ready</div>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Extension setup and UI injection are complete. This panel is intentionally
              static so the next sections can add scanning, detections, scoring, and
              insight copy in order.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <SectionLabel>Mount</SectionLabel>
              <div className="text-lg font-semibold">Content Script</div>
              <p className="mt-2 text-sm text-white/58">Injected on normal webpages</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <SectionLabel>Build</SectionLabel>
              <div className="text-lg font-semibold">Manifest V3</div>
              <p className="mt-2 text-sm text-white/58">Chrome loads from `dist/`</p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <SectionLabel>Roadmap Queue</SectionLabel>
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#10253a] px-4 py-3 text-sm text-white/70">
                Phase 2: scan real resources with the Performance APIs and DOM inspection
              </div>
              <div className="rounded-2xl bg-[#10253a] px-4 py-3 text-sm text-white/70">
                Phase 3: turn raw data into detected issues and a cost risk score
              </div>
              <div className="rounded-2xl bg-[#10253a] px-4 py-3 text-sm text-white/70">
                Phase 4: translate signals into useful cost insight and polish
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function PhaseOneShell({
  panelMode,
  setPanelMode
}: {
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
}) {
  return (
    <>
      {panelMode === "idle" && (
        <div className="fixed bottom-20 right-0 z-[2147483647]">
          <button
            type="button"
            onClick={() => setPanelMode("mini")}
            className="group flex min-w-12 items-center gap-3 rounded-l-2xl border border-r-0 border-white/10 bg-[#0d1b2a] px-3 py-4 text-white shadow-2xl transition hover:-translate-x-1"
            title="Open Metis"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f97316] text-sm font-bold text-[#0d1b2a]">
              M
            </div>
            <div className="hidden pr-1 text-left group-hover:block">
              <div className="text-xs font-semibold">Metis</div>
              <div className="text-[11px] text-white/45">Open static panel</div>
            </div>
          </button>
        </div>
      )}

      {panelMode === "mini" && <MiniPanel setPanelMode={setPanelMode} />}
      {panelMode === "full" && <FullPanel setPanelMode={setPanelMode} />}
    </>
  );
}

import { motion } from "motion/react";
import {
  Download,
  FolderArchive,
  LayoutPanelTop,
  RefreshCcw,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import type {
  ExportReportDocument,
  MetisLocalSettings
} from "../../../shared/types/audit";
import type { PageScanStoreSummary } from "../../../shared/lib/pageScanHistory";
import { AcronymText } from "./AcronymTooltipText";

function modalBackdrop(onClose: () => void) {
  return (
    <motion.div
      className="fixed inset-0 z-[320]"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    />
  );
}

function PillButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2"
      style={{
        background: active ? "#dc5e5e" : "rgba(255,255,255,0.06)",
        border: active ? "1px solid rgba(220,94,94,0.35)" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "white" : "rgba(255,255,255,0.68)",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 700
      }}
    >
      <AcronymText text={children} />
    </button>
  );
}

function ToggleRow({
  title,
  detail,
  active,
  onClick
}: {
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[18px] px-4 py-3 text-left"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div>
        <div
          style={{
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <AcronymText text={title} />
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "17px",
            marginTop: 4
          }}
        >
          <AcronymText text={detail} />
        </div>
      </div>
      <div
        className="rounded-full px-3 py-1.5"
        style={{
          background: active ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.08)",
          color: active ? "#4ade80" : "rgba(255,255,255,0.55)",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          fontWeight: 700
        }}
      >
        {active ? "On" : "Off"}
      </div>
    </button>
  );
}

export function LocalSettingsModal({
  settings,
  scanSummary,
  currentSitePages,
  onClose,
  onChange,
  onClearSavedScans,
  onResetCurrentSiteProgress
}: {
  settings: MetisLocalSettings;
  scanSummary: PageScanStoreSummary;
  currentSitePages: number;
  onClose: () => void;
  onChange: (next: MetisLocalSettings) => void;
  onClearSavedScans: () => void;
  onResetCurrentSiteProgress: () => void;
}) {
  return (
    <>
      {modalBackdrop(onClose)}
      <div className="pointer-events-none fixed inset-0 z-[330] flex items-center justify-center p-5">
        <motion.div
          className="pointer-events-auto w-full max-w-[720px] overflow-hidden rounded-[28px]"
          style={{
            background: "#0d1825",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 72px rgba(0,0,0,0.56)"
          }}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.985 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <Settings2 size={16} className="text-white/45" />
              <div>
                <div className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 20 }}>
                  <AcronymText text="Local Settings" />
                </div>
                <div style={{ color: "rgba(255,255,255,0.42)", fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                  <AcronymText text="Preferences and saved analysis stay on this device." />
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-white/40">
              <X size={16} />
            </button>
          </div>

          <div className="metis-scroll max-h-[72vh] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="metis-overline text-white/35">Scan Behavior</div>
                <div className="flex flex-wrap gap-2">
                  <PillButton
                    active={settings.preferredScanScope === "single"}
                    onClick={() => onChange({ ...settings, preferredScanScope: "single" })}
                  >
                    Default to single page
                  </PillButton>
                  <PillButton
                    active={settings.preferredScanScope === "multi"}
                    onClick={() => onChange({ ...settings, preferredScanScope: "multi" })}
                  >
                    Default to multipage
                  </PillButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton
                    active={settings.refreshMode === "smart"}
                    onClick={() => onChange({ ...settings, refreshMode: "smart" })}
                  >
                    Smart updates
                  </PillButton>
                  <PillButton
                    active={settings.refreshMode === "steady"}
                    onClick={() => onChange({ ...settings, refreshMode: "steady" })}
                  >
                    Steady updates
                  </PillButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton
                    active={settings.motionPreference === "full"}
                    onClick={() => onChange({ ...settings, motionPreference: "full" })}
                  >
                    Full motion
                  </PillButton>
                  <PillButton
                    active={settings.motionPreference === "reduced"}
                    onClick={() => onChange({ ...settings, motionPreference: "reduced" })}
                  >
                    Reduced motion
                  </PillButton>
                </div>
              </section>

              <section className="space-y-3">
                <div className="metis-overline text-white/35">Layout</div>
                <ToggleRow
                  title="Attach report to the side panel"
                  detail="Keep the large report anchored to the right edge so it feels like the same Metis surface."
                  active={settings.attachedReport}
                  onClick={() => onChange({ ...settings, attachedReport: !settings.attachedReport })}
                />
                <ToggleRow
                  title="Show sampled-page progress"
                  detail="Keep the saved page count visible in the panel and full report."
                  active={settings.showSampleProgress}
                  onClick={() =>
                    onChange({ ...settings, showSampleProgress: !settings.showSampleProgress })
                  }
                />
              </section>

              <section className="space-y-3">
                <div className="metis-overline text-white/35">Saved Analysis</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="inline-flex items-center gap-2 text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                      <FolderArchive size={12} />
                      <AcronymText text="Saved page snapshots" />
                    </div>
                    <div className="mt-3 metis-display text-white" style={{ fontSize: 22 }}>
                      {scanSummary.savedPageCount}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.46)", fontFamily: "Inter, sans-serif", fontSize: 11, marginTop: 6 }}>
                      Latest capture stays available for cross-page comparison.
                    </div>
                  </div>
                  <div className="rounded-[20px] px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="inline-flex items-center gap-2 text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                      <LayoutPanelTop size={12} />
                      <AcronymText text="Current-site progress" />
                    </div>
                    <div className="mt-3 metis-display text-white" style={{ fontSize: 22 }}>
                      {currentSitePages}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.46)", fontFamily: "Inter, sans-serif", fontSize: 11, marginTop: 6 }}>
                      Distinct pages Metis has seen on this origin.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onResetCurrentSiteProgress}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.72)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    <RefreshCcw size={12} />
                    Reset current-site progress
                  </button>
                  <button
                    type="button"
                    onClick={onClearSavedScans}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#fda4af",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={12} />
                    Clear saved snapshots
                  </button>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export function ExportArchitectureModal({
  document,
  onClose,
  onCopyOutline
}: {
  document: ExportReportDocument;
  onClose: () => void;
  onCopyOutline: () => void;
}) {
  return (
    <>
      {modalBackdrop(onClose)}
      <div className="pointer-events-none fixed inset-0 z-[330] flex items-center justify-center p-5">
        <motion.div
          className="pointer-events-auto w-full max-w-[760px] overflow-hidden rounded-[28px]"
          style={{
            background: "#0d1825",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 72px rgba(0,0,0,0.56)"
          }}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.985 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <Download size={16} className="text-white/45" />
              <div>
                <div className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 20 }}>
                  <AcronymText text="Export Report" />
                </div>
                <div style={{ color: "rgba(255,255,255,0.42)", fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                  <AcronymText text="The PDF pipeline is being shaped around a real report document, not a screenshot." />
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-white/40">
              <X size={16} />
            </button>
          </div>

          <div className="metis-scroll max-h-[72vh] overflow-y-auto px-6 py-6">
            <div className="rounded-[20px] px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="metis-overline text-white/35">Export shape</div>
              <div className="mt-3 text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 22 }}>
                <AcronymText text={document.title} />
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", fontSize: 12, marginTop: 8 }}>
                <AcronymText text="Generated from the live report model so future PDF export can stay deterministic." />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {document.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-[20px] px-4 py-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)"
                  }}
                >
                  <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700 }}>
                    <AcronymText text={section.title} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {section.lines.map((line) => (
                      <div
                        key={line}
                        style={{
                          color: "rgba(255,255,255,0.58)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          lineHeight: "18px"
                        }}
                      >
                        <AcronymText text={line} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onCopyOutline}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.82)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                <Download size={12} />
                <AcronymText text="Copy export outline" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

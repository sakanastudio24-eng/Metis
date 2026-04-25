import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  FolderArchive,
  LayoutPanelTop,
  LayoutDashboard,
  Mail,
  RefreshCcw,
  Settings2,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import type {
  ExportReportDocument,
  MetisLocalSettings
} from "../../../shared/types/audit";
import type { PageScanStoreSummary } from "../../../shared/lib/pageScanHistory";
import {
  buildPermissionControls,
  type PermissionControlId
} from "../../../shared/lib/metisPermissionControls";
import {
  METIS_ACCOUNT_EMAIL,
  METIS_ACCOUNT_NAME,
  METIS_ACCOUNT_URL
} from "../../../shared/lib/metisLinks";
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

function PermissionAbilityRow({
  settings,
  selectedId,
  onSelect,
  onToggle
}: {
  settings: MetisLocalSettings;
  selectedId: PermissionControlId;
  onSelect: (id: PermissionControlId) => void;
  onToggle: (id: PermissionControlId) => void;
}) {
  const controls = buildPermissionControls(settings);
  const selected =
    controls.find((control) => control.id === selectedId) ?? controls[0];
  const enabledCount = controls.filter((control) => control.active).length;

  return (
    <div className="space-y-3">
      <div
        className="rounded-[20px] px-4 py-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
              <AcronymText text="Permission ability" />
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", fontSize: 11, marginTop: 4 }}>
              <AcronymText text={`${enabledCount} of ${controls.length} capabilities active`} />
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
            <AcronymText text={selected.ability} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {controls.map((control) => {
          return (
            <button
              key={control.id}
              type="button"
              onMouseEnter={() => onSelect(control.id)}
              onFocus={() => onSelect(control.id)}
              onClick={() => onToggle(control.id)}
              className="inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-2"
              style={{
                background:
                  selected.id === control.id ? "rgba(220,94,94,0.12)" : "rgba(255,255,255,0.04)",
                borderColor:
                  selected.id === control.id ? "rgba(220,94,94,0.24)" : "rgba(255,255,255,0.07)"
              }}
            >
              <span style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                <AcronymText text={control.title} />
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  background: control.active ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.08)",
                  color: control.active ? "#4ade80" : "rgba(255,255,255,0.55)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 10,
                  fontWeight: 700
                }}
              >
                {control.active ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-[20px] px-4 py-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
            <AcronymText text={selected.title} />
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", fontSize: 11, lineHeight: "17px", marginTop: 6 }}>
          <AcronymText text={selected.description} />
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="space-y-3 rounded-[24px] px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="metis-overline text-white/35">
        <AcronymText text={title} />
      </div>
      {children}
    </section>
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
  const [selectedPermissionId, setSelectedPermissionId] =
    useState<PermissionControlId>("basicScan");

  const handleTogglePermission = (permissionId: PermissionControlId) => {
    switch (permissionId) {
      case "basicScan":
        onChange({
          ...settings,
          basicScanEnabled: !settings.basicScanEnabled
        });
        return;
      case "expandedSiteAccess":
        return;
      case "localHistory":
        onChange({
          ...settings,
          localHistoryEnabled: !settings.localHistoryEnabled
        });
        return;
      case "bridgeRepair":
        onChange({
          ...settings,
          bridgeRepairEnabled: !settings.bridgeRepairEnabled
        });
        return;
      case "sidePanelWorkspace":
        onChange({
          ...settings,
          attachedWorkspaceEnabled: !settings.attachedWorkspaceEnabled
        });
        return;
    }
  };

  return (
    <>
      {modalBackdrop(onClose)}
      <div className="pointer-events-none fixed inset-0 z-[330] flex items-center justify-center p-5">
        <motion.div
          className="pointer-events-auto flex max-h-[calc(100vh-40px)] w-full max-w-[720px] min-h-0 flex-col overflow-hidden rounded-[28px]"
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
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.76)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              <ArrowLeft size={14} />
              <AcronymText text="Back" />
            </button>
          </div>

          <div className="metis-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-20">
            <div className="space-y-6">
              <SettingsSection title="Account">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="inline-flex items-center gap-2 text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                      <UserRound size={12} />
                      <AcronymText text="Name" />
                    </div>
                    <div className="mt-3 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
                      <AcronymText text={METIS_ACCOUNT_NAME} />
                    </div>
                  </div>
                  <div className="rounded-[20px] px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="inline-flex items-center gap-2 text-white/35" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                      <Mail size={12} />
                      <AcronymText text="Email" />
                    </div>
                    <div className="mt-3 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
                      <AcronymText text={METIS_ACCOUNT_EMAIL} />
                    </div>
                  </div>
                </div>
                <a
                  href={METIS_ACCOUNT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-center no-underline"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.82)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  <LayoutDashboard size={12} />
                  <AcronymText text="View my dashboard" />
                </a>
              </SettingsSection>

              <SettingsSection title="Scan Behavior">
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
                    Default to multipage scan beta
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
              </SettingsSection>

              <SettingsSection title="Panel">
                <ToggleRow
                  title="Show sampled-page progress"
                  detail="Keep the saved page count visible in the panel and full report."
                  active={settings.showSampleProgress}
                  onClick={() =>
                    onChange({ ...settings, showSampleProgress: !settings.showSampleProgress })
                  }
                />
              </SettingsSection>

              <SettingsSection title="Permissions">
                <PermissionAbilityRow
                  settings={settings}
                  selectedId={selectedPermissionId}
                  onSelect={setSelectedPermissionId}
                  onToggle={handleTogglePermission}
                />
              </SettingsSection>

              <SettingsSection title="Saved Analysis">
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
                      background: "rgba(220,94,94,0.12)",
                      border: "1px solid rgba(220,94,94,0.2)",
                      color: "#dc5e5e",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={12} />
                    Clear saved snapshots
                  </button>
                </div>
              </SettingsSection>
              <div className="h-8" />
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

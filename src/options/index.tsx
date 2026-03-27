import { StrictMode, useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeInfo,
  Database,
  ExternalLink,
  Gauge,
  Shield,
  Sparkles,
  Trash2
} from "lucide-react";
import { Toaster, toast } from "sonner";
import "../styles/tailwind.css";
import { clearPageScanStore, getPageScanStoreSummary } from "../shared/lib/pageScanHistory";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings,
  saveMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import {
  clearAllSiteHistory,
  getSiteHistorySummary,
  type SiteHistorySummary
} from "../shared/lib/siteBaseline";
import type { MetisLocalSettings } from "../shared/types/audit";

function Section({
  icon: Icon,
  title,
  detail,
  children
}: {
  icon: typeof Gauge;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[24px] border px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "rgba(220,94,94,0.12)",
            border: "1px solid rgba(220,94,94,0.2)"
          }}
        >
          <Icon size={15} style={{ color: "#dc8d72" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 22 }}>
            {title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.52)",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              lineHeight: "20px",
              marginTop: 6
            }}
          >
            {detail}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function PillButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2"
      style={{
        background: active ? "#dc5e5e" : "rgba(255,255,255,0.06)",
        border: active ? "1px solid rgba(220,94,94,0.34)" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "white" : "rgba(255,255,255,0.72)",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {children}
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
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="min-w-0">
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
          {title}
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
          {detail}
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

function ActionButton({
  destructive = false,
  children,
  onClick
}: {
  destructive?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2"
      style={{
        background: destructive ? "rgba(220,94,94,0.12)" : "rgba(255,255,255,0.06)",
        border: destructive
          ? "1px solid rgba(220,94,94,0.22)"
          : "1px solid rgba(255,255,255,0.08)",
        color: destructive ? "#dc8d72" : "rgba(255,255,255,0.76)",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {children}
    </button>
  );
}

function LinkCard({
  href,
  title,
  detail
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 rounded-[18px] px-4 py-3 no-underline"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div>
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
          {title}
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
          {detail}
        </div>
      </div>
      <ExternalLink size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
    </a>
  );
}

function OptionsApp() {
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const [ready, setReady] = useState(false);
  const [savedPageCount, setSavedPageCount] = useState(0);
  const [siteHistory, setSiteHistory] = useState<SiteHistorySummary>({
    baselineOriginCount: 0,
    visitedOriginCount: 0
  });

  const extensionVersion = useMemo(() => chrome.runtime.getManifest().version, []);

  const refreshStorageState = async () => {
    const [pageSummary, siteSummary] = await Promise.all([
      getPageScanStoreSummary(),
      getSiteHistorySummary()
    ]);

    setSavedPageCount(pageSummary.savedPageCount);
    setSiteHistory(siteSummary);
  };

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getMetisLocalSettings(), getPageScanStoreSummary(), getSiteHistorySummary()]).then(
      ([storedSettings, pageSummary, siteSummary]) => {
        if (cancelled) {
          return;
        }

        setSettings(storedSettings);
        setSavedPageCount(pageSummary.savedPageCount);
        setSiteHistory(siteSummary);
        setReady(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void saveMetisLocalSettings(settings);
  }, [ready, settings]);

  const handleClearSnapshots = async () => {
    await clearPageScanStore();
    await refreshStorageState();
    toast.success("Saved snapshots cleared");
  };

  const handleClearHistory = async () => {
    await clearAllSiteHistory();
    await refreshStorageState();
    toast.success("Site history cleared");
  };

  return (
    <div
      className="min-h-screen px-5 py-8 md:px-8"
      style={{
        background: "#0d1825",
        color: "white"
      }}
    >
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#101c2b",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px"
          }
        }}
      />

      <div className="mx-auto max-w-[980px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div style={{ color: "#dc8d72", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Metis
            </div>
            <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 36, marginTop: 8 }}>
              Settings
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.54)",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: "22px",
                marginTop: 10,
                maxWidth: 620
              }}
            >
              A small trust and control surface for how Metis scans, stores local data, and
              applies fallback assumptions when the page cannot answer everything directly.
            </div>
          </div>

          <div
            className="rounded-full px-4 py-2"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.54)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700
            }}
          >
            Version {extensionVersion}
          </div>
        </div>

        <div className="grid gap-5">
          <Section
            icon={Gauge}
            title="Scan behavior"
            detail="Keep scan controls clear and lightweight. These affect how aggressively Metis refreshes while you are actively using it."
          >
            <ToggleRow
              title="Auto-rescan while panel open"
              detail="When this is off, Metis still scans on start and on route changes, but it stops steady background refreshes."
              active={settings.autoRescanWhilePanelOpen}
              onClick={() =>
                setSettings({
                  ...settings,
                  autoRescanWhilePanelOpen: !settings.autoRescanWhilePanelOpen
                })
              }
            />
            <div className="space-y-2">
              <div className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                Scan delay
              </div>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  active={settings.scanDelayProfile === "fast"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "fast" })}
                >
                  Fast
                </PillButton>
                <PillButton
                  active={settings.scanDelayProfile === "balanced"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "balanced" })}
                >
                  Balanced
                </PillButton>
                <PillButton
                  active={settings.scanDelayProfile === "thorough"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "thorough" })}
                >
                  Thorough
                </PillButton>
              </div>
            </div>
          </Section>

          <Section
            icon={Database}
            title="Data and storage"
            detail="Metis keeps saved snapshots and site history locally on this device. These controls let you clear that state without touching any remote account."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border px-4 py-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Saved snapshots
                </div>
                <div className="metis-display mt-3 text-white" style={{ fontSize: 26 }}>
                  {savedPageCount}
                </div>
              </div>
              <div className="rounded-[18px] border px-4 py-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Site history
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <div className="metis-display text-white" style={{ fontSize: 26 }}>
                    {siteHistory.visitedOriginCount}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                    visited origins
                  </div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", fontSize: 12, marginTop: 6 }}>
                  {siteHistory.baselineOriginCount} stored baselines
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton destructive onClick={() => void handleClearSnapshots()}>
                <Trash2 size={12} />
                Clear saved snapshots
              </ActionButton>
              <ActionButton destructive onClick={() => void handleClearHistory()}>
                <Trash2 size={12} />
                Clear history
              </ActionButton>
            </div>
          </Section>

          <Section
            icon={Shield}
            title="Permissions"
            detail="Metis is still running in the trust-first beta model. This page explains the current permission stance instead of hiding it."
          >
            <div className="rounded-[18px] border px-4 py-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700 }}>
                Current mode
              </div>
              <div style={{ color: "rgba(255,255,255,0.56)", fontFamily: "Inter, sans-serif", fontSize: 12, lineHeight: "18px", marginTop: 6 }}>
                Metis shows a page hover on normal sites, then starts scanning only after you click it. Optional per-site permission controls can come later, but they are not part of the current beta surface.
              </div>
              <div className="mt-3 inline-flex rounded-full px-3 py-1.5" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.22)", color: "#4ade80", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                Only run when you activate Metis
              </div>
            </div>
          </Section>

          <Section
            icon={BadgeInfo}
            title="Estimates and assumptions"
            detail="These are conservative fallback assumptions Metis can use when the page itself does not reveal enough context."
          >
            <div className="space-y-2">
              <div className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                Default hosting assumption
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "auto", label: "Auto" },
                  { value: "cloudflare", label: "Cloudflare" },
                  { value: "vercel", label: "Vercel" },
                  { value: "aws", label: "AWS" }
                ].map((option) => (
                  <PillButton
                    key={option.value}
                    active={settings.defaultHostingAssumption === option.value}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        defaultHostingAssumption:
                          option.value as MetisLocalSettings["defaultHostingAssumption"]
                      })
                    }
                  >
                    {option.label}
                  </PillButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                Traffic baseline
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "auto", label: "Auto" },
                  { value: "under1k", label: "Under 1k" },
                  { value: "1kTo10k", label: "1k to 10k" },
                  { value: "10kTo100k", label: "10k to 100k" },
                  { value: "100kPlus", label: "100k plus" }
                ].map((option) => (
                  <PillButton
                    key={option.value}
                    active={settings.trafficBaselineOverride === option.value}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        trafficBaselineOverride:
                          option.value as MetisLocalSettings["trafficBaselineOverride"]
                      })
                    }
                  >
                    {option.label}
                  </PillButton>
                ))}
              </div>
            </div>
          </Section>

          <Section
            icon={Sparkles}
            title="About and feedback"
            detail="Keep the product accountable. Version, intent, and feedback paths should be easy to find."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <LinkCard
                href="https://ward.studio/metis"
                title="Metis site"
                detail="Product overview and public context."
              />
              <LinkCard
                href="https://ward.studio/privacy"
                title="Privacy"
                detail="Review the current privacy policy before wider release."
              />
              <LinkCard
                href="https://ward.studio/metis#feedback"
                title="Report an issue"
                detail="Send beta feedback or flag a broken site."
              />
              <LinkCard
                href="https://ward.studio/metis#plus"
                title="Join Metis+ early"
                detail="Register interest for deeper reports and future premium features."
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("metis-react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <OptionsApp />
    </StrictMode>
  );
}

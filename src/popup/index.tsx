import { StrictMode, useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Database, ExternalLink, Gauge, Shield, Sparkles, Trash2 } from "lucide-react";
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
import { METIS_ACCOUNT_URL, METIS_SITE_URL } from "../shared/lib/metisLinks";
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
      className="rounded-[20px] border px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: "rgba(220,94,94,0.12)",
            border: "1px solid rgba(220,94,94,0.2)"
          }}
        >
          <Icon size={14} style={{ color: "#dc8d72" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 18 }}>
            {title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.52)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: "18px",
              marginTop: 5
            }}
          >
            {detail}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function PillButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-2"
      style={{
        background: active ? "#dc5e5e" : "rgba(255,255,255,0.06)",
        border: active ? "1px solid rgba(220,94,94,0.34)" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "white" : "rgba(255,255,255,0.72)",
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
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
      className="flex w-full items-center justify-between gap-4 rounded-[16px] px-3 py-3 text-left"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="min-w-0">
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
          {title}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "16px",
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
          fontSize: 10,
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
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2"
      style={{
        background: destructive ? "rgba(220,94,94,0.12)" : "rgba(255,255,255,0.06)",
        border: destructive
          ? "1px solid rgba(220,94,94,0.22)"
          : "1px solid rgba(255,255,255,0.08)",
        color: destructive ? "#dc8d72" : "rgba(255,255,255,0.76)",
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
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
      className="flex items-center justify-between gap-4 rounded-[16px] px-3 py-3 no-underline"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="min-w-0">
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
          {title}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "16px",
            marginTop: 4
          }}
        >
          {detail}
        </div>
      </div>
      <ExternalLink size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
    </a>
  );
}

function PopupApp() {
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const [ready, setReady] = useState(false);
  const [savedPageCount, setSavedPageCount] = useState(0);
  const [siteHistory, setSiteHistory] = useState<SiteHistorySummary>({
    baselineOriginCount: 0,
    visitedOriginCount: 0
  });

  const extensionVersion = useMemo(() => chrome.runtime.getManifest().version, []);
  const privacyUrl = useMemo(() => chrome.runtime.getURL("privacy.html"), []);
  const termsUrl = useMemo(() => chrome.runtime.getURL("terms.html"), []);

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
      className="min-h-[640px] w-[380px] px-4 py-4"
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
            fontSize: "12px"
          }
        }}
      />

      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div style={{ color: "#dc8d72", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Metis
          </div>
          <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 28, marginTop: 6 }}>
            Settings
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.54)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: "18px",
              marginTop: 8
            }}
          >
            Trust, storage, and fallback controls for the current beta.
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1.5"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.54)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          v{extensionVersion}
        </div>
      </div>

      <div className="metis-scroll max-h-[560px] space-y-4 overflow-y-auto pr-1">
        <Section
          icon={Gauge}
          title="Scan behavior"
          detail="Keep scan behavior explicit and lightweight."
        >
          <ToggleRow
            title="Auto-rescan while panel open"
            detail="Route changes still rescan even when steady refresh is off."
            active={settings.autoRescanWhilePanelOpen}
            onClick={() =>
              setSettings({
                ...settings,
                autoRescanWhilePanelOpen: !settings.autoRescanWhilePanelOpen
              })
            }
          />
          <div className="space-y-2">
            <div className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
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
          title="Data"
          detail="Metis stores scans locally on this device."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Saved snapshots
              </div>
              <div className="metis-display mt-2 text-white" style={{ fontSize: 22 }}>
                {savedPageCount}
              </div>
            </div>
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Site history
              </div>
              <div className="metis-display mt-2 text-white" style={{ fontSize: 22 }}>
                {siteHistory.visitedOriginCount}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton destructive onClick={() => void handleClearSnapshots()}>
              <Trash2 size={11} />
              Clear snapshots
            </ActionButton>
            <ActionButton destructive onClick={() => void handleClearHistory()}>
              <Trash2 size={11} />
              Clear history
            </ActionButton>
          </div>
        </Section>

        <Section
          icon={Shield}
          title="Permissions"
          detail="Metis only starts scanning after you activate it."
        >
          <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
              Current mode
            </div>
            <div style={{ color: "rgba(255,255,255,0.56)", fontFamily: "Inter, sans-serif", fontSize: 11, lineHeight: "16px", marginTop: 5 }}>
              The page hover is visible on normal sites, but Metis does not begin scanning until you click it. After activation, it scans the current page and same-site routes you open in that session.
            </div>
          </div>
        </Section>

        <Section
          icon={Sparkles}
          title="About"
          detail="A quick way to reach the product site, legal pages, and account access."
        >
          <div className="space-y-2">
            <LinkCard
              href={METIS_SITE_URL}
              title="Metis site"
              detail="Product overview, current direction, and website entry."
            />
            <LinkCard
              href={privacyUrl}
              title="Privacy"
              detail="Current privacy policy."
            />
            <LinkCard
              href={termsUrl}
              title="Terms"
              detail="Current terms of use."
            />
            <LinkCard
              href={METIS_ACCOUNT_URL}
              title="Manage account"
              detail="Open website account access and Plus Beta entry."
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

const root = document.getElementById("metis-react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>
  );
}

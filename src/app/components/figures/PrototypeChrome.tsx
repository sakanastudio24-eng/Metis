/**
 * PrototypeChrome
 * Pulls the higher-fidelity account, loading, and Plus shell behaviors from the
 * Metis prototype into small reusable pieces for the live content-script UI.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  CheckCheck,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Settings,
  UserRound,
  Wrench,
  X
} from "lucide-react";
import { DARK_BG, DETECTION_STEPS, METIS_RED } from "../../data/metis-mock-data";

export function LoadingScreen() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    const timers = DETECTION_STEPS.map((step, index) =>
      window.setTimeout(() => {
        setVisibleSteps((current) => [...current, index]);
      }, step.delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <motion.div
      className="flex h-full flex-col justify-center gap-2 px-5 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-3 flex items-center gap-2">
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

      <div className="space-y-1.5">
        {DETECTION_STEPS.map((step, index) => (
          <AnimatePresence key={index}>
            {visibleSteps.includes(index) && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {step.dot ? (
                  <motion.div
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: step.dot }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  />
                ) : (
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full opacity-0" />
                )}
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: step.color
                  }}
                >
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

export function ProfileButton({
  onManageAccount,
  onSettings,
  onUpgrade,
  onDark = true
}: {
  onManageAccount: () => void;
  onSettings?: () => void;
  onUpgrade?: () => void;
  onDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const avatarBackground = onDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(255,255,255,0.2)";

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="relative flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: avatarBackground,
          border: "1.5px solid rgba(255,255,255,0.18)"
        }}
        title="Profile · Live"
      >
        <UserRound size={12} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full z-[200] mt-2 w-52 overflow-hidden rounded-2xl"
            style={{
              background: "#0d1825",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 56px rgba(0,0,0,0.55)"
            }}
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p
                className="text-white font-semibold"
                style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 12 }}
              >
                Account and settings
              </p>
              <p
                className="text-white/45"
                style={{ margin: "4px 0 0", fontFamily: "Inter, sans-serif", fontSize: 10, lineHeight: "15px" }}
              >
                Manage account access on the website. Keep scan and extension settings here.
              </p>
            </div>

            <div className="py-1.5">
              {[
                { icon: ExternalLink, label: "Manage account", accent: true },
                { icon: Settings, label: "Extension settings", accent: false },
                { icon: Rocket, label: "Upgrade", accent: true }
              ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      {item.label === "Upgrade" ? (
                        <div
                          className="mx-4 mb-1 mt-1"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                        />
                      ) : null}
                      <motion.button
                        type="button"
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
                        onClick={() => {
                          setOpen(false);
                          if (item.label === "Manage account") {
                            onManageAccount();
                            return;
                          }

                          if (item.label === "Extension settings") {
                            onSettings?.();
                            return;
                          }

                          if (item.label === "Upgrade") {
                            onUpgrade?.();
                          }
                        }}
                      >
                        <Icon
                          size={12}
                          style={{
                            color: item.accent ? METIS_RED : "rgba(255,255,255,0.35)"
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 500,
                            color: item.accent ? METIS_RED : "rgba(255,255,255,0.65)"
                          }}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WhatJustHappened({ hostname }: { hostname: string }) {
  const [open, setOpen] = useState(false);
  const events = [
    { icon: Activity, color: "#ef4444", label: "Route profile refreshed", value: "live" },
    { icon: Wrench, color: "#f97316", label: "Issue checks re-ranked", value: "updated" },
    { icon: CheckCheck, color: "#22c55e", label: "Saved scan kept locally", value: "ready" },
    { icon: Activity, color: "#6366f1", label: "Control read re-evaluated", value: "scored" }
  ];

  return (
    <div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2"
        style={{
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div className="flex items-center gap-2">
          <Activity size={11} className="text-white/40" />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "rgba(255,255,255,0.55)"
            }}
          >
            Latest scan activity
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} className="text-white/30" />
        </motion.div>
      </motion.button>

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
              className="mt-1.5 overflow-hidden rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.08em"
                  }}
                >
                  LIVE SESSION · {hostname}
                </span>
              </div>
              {events.map((event, index) => (
                <motion.div
                  key={event.label}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    borderBottom:
                      index < events.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none"
                  }}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="flex items-center gap-2">
                    <event.icon size={10} style={{ color: event.color }} />
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.5)"
                      }}
                    >
                      {event.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "Jua, sans-serif",
                      fontSize: 10,
                      color: event.color
                    }}
                  >
                    {event.value}
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

export function CopyReportButton({
  onCopy
}: {
  onCopy: () => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.93 }}
      onClick={async () => {
        await onCopy();
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.5)"
      }}
      title="Copy summary"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <CheckCheck size={13} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy size={13} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

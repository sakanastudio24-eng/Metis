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
  Crown,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Wrench,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  DARK_BG,
  DETECTION_STEPS,
  FREE_VS_PLUS_ROWS,
  METIS_RED,
  PLUS_FEATURES
} from "../../data/metis-mock-data";

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
  onUpgrade,
  isPlusUser = false,
  onDark = true
}: {
  onUpgrade: () => void;
  isPlusUser?: boolean;
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
        title="Profile"
      >
        <span
          className="select-none text-white font-bold"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}
        >
          JD
        </span>
        {isPlusUser && (
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-[3px]"
            style={{
              background: "linear-gradient(180deg, rgba(220,94,94,0.98) 0%, rgba(196,70,70,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 18px rgba(220,94,94,0.32)"
            }}
            initial={{ opacity: 0, y: -3, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            <span
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1
              }}
            >
              Plus
            </span>
          </motion.div>
        )}
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
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: METIS_RED }}
              >
                <span
                  className="text-white font-bold"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}
                >
                  JD
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-white font-semibold"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
                >
                  Jamie Dawson
                </p>
                <p
                  className="truncate text-white/40"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 10 }}
                >
                  jamie@acmecorp.io
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span
                className="text-white/40"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
              >
                Current plan
              </span>
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: isPlusUser
                    ? "rgba(220,94,94,0.18)"
                    : "rgba(255,255,255,0.08)",
                  border: isPlusUser
                    ? "1px solid rgba(220,94,94,0.35)"
                    : "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <Crown
                  size={9}
                  style={{ color: isPlusUser ? METIS_RED : "rgba(255,255,255,0.5)" }}
                />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    color: isPlusUser ? METIS_RED : "rgba(255,255,255,0.6)"
                  }}
                >
                  {isPlusUser ? "Plus" : "Free"}
                </span>
              </div>
            </div>

            <div className="py-1.5">
              {[
                !isPlusUser
                  ? { icon: Sparkles, label: "Get Plus", accent: true }
                  : null,
                { icon: Settings, label: "Settings", accent: false },
                { icon: LogOut, label: "Sign out", accent: false }
              ]
                .filter(Boolean)
                .map((item) => {
                  if (!item) {
                    return null;
                  }

                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      type="button"
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
                      onClick={() => {
                        setOpen(false);
                        if (item.label === "Get Plus") {
                          onUpgrade();
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
    { icon: Activity, color: "#ef4444", label: "API requests on load", value: "12 calls" },
    { icon: Activity, color: "#f97316", label: "AI completions fired", value: "3 calls" },
    { icon: Activity, color: "#eab308", label: "Heavy assets loaded", value: "3 files › 2MB" },
    { icon: Activity, color: "#6366f1", label: "Time to interactive", value: "3.4s" }
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
            What just happened?
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
                  LAST 10 SECONDS · {hostname}
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

export function PlusUpgradeModal({
  onClose,
  onConfirm
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [confirmed, setConfirmed] = useState(false);
  const price = billing === "annual" ? 7 : 9;

  const handleUpgrade = () => {
    setConfirmed(true);
    window.setTimeout(() => {
      onConfirm();
    }, 1800);
  };

  return (
    <>
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
          className="pointer-events-auto flex w-full max-w-xl flex-col"
          style={{
            maxHeight: "90vh",
            background: "#0d1825",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 48px 120px rgba(0,0,0,0.7)"
          }}
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, y: 32, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          onClick={(event) => event.stopPropagation()}
        >
          <AnimatePresence>
            {confirmed && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-3xl"
                style={{ background: "#0d1825" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 40%, rgba(220,94,94,0.18) 0%, transparent 65%)"
                  }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.1 }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(220,94,94,0.15)",
                    border: "2px solid rgba(220,94,94,0.4)"
                  }}
                >
                  <Crown size={32} style={{ color: METIS_RED }} />
                </motion.div>
                <div className="space-y-2 text-center">
                  <h3 className="text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 24 }}>
                    Welcome to Metis+
                  </h3>
                  <p
                    className="text-white/45"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}
                  >
                    Your extension is upgrading now…
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="relative shrink-0 px-6 pb-5 pt-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-16 w-48 -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(220,94,94,0.22) 0%, transparent 70%)",
                filter: "blur(20px)"
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-1.5 hover:bg-white/8"
            >
              <X size={14} className="text-white/35" />
            </button>

            <div className="relative flex flex-col items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{
                  background: "rgba(220,94,94,0.15)",
                  border: "1px solid rgba(220,94,94,0.3)"
                }}
              >
                <Crown size={12} style={{ color: METIS_RED }} />
                <span
                  className="font-bold"
                  style={{ fontFamily: "Jua, sans-serif", fontSize: 14, color: METIS_RED }}
                >
                  Metis+
                </span>
              </div>
              <h2 className="text-center text-white" style={{ fontFamily: "Jua, sans-serif", fontSize: 22 }}>
                Stop guessing. Start fixing.
              </h2>
              <p
                className="max-w-xs text-center text-white/40"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
              >
                Everything in Free, plus the full picture — root causes, exact fixes, savings estimates, and multi-page scanning.
              </p>

              <div
                className="mt-1 flex items-center gap-1 rounded-full p-1"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                {(["monthly", "annual"] as const).map((option) => (
                  <motion.button
                    key={option}
                    type="button"
                    className="relative rounded-full px-4 py-1.5"
                    onClick={() => setBilling(option)}
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                  >
                    {billing === option && (
                      <motion.div
                        layoutId="billing-pill"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span
                      className="relative font-semibold"
                      style={{ color: billing === option ? "white" : "rgba(255,255,255,0.35)" }}
                    >
                      {option === "monthly" ? "Monthly" : "Annual"}
                    </span>
                    {option === "annual" && (
                      <span
                        className="relative ml-1.5 rounded-full px-1.5 py-0.5 font-bold"
                        style={{
                          background: "rgba(34,197,94,0.2)",
                          color: "#4ade80",
                          fontSize: 9
                        }}
                      >
                        Save 22%
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-1 flex items-end gap-1.5">
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
                  className="mb-1.5 text-white/35"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
                >
                  / month{billing === "annual" ? ", billed annually" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "none" }}>
            <div className="grid grid-cols-2 gap-2.5">
              {PLUS_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="relative rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)"
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index }}
                >
                  {feature.tag && (
                    <span
                      className="absolute right-3 top-3 rounded-full px-2 py-0.5 font-bold"
                      style={{
                        background:
                          feature.tag === "Coming Soon"
                            ? "rgba(99,102,241,0.2)"
                            : "rgba(34,197,94,0.2)",
                        color: feature.tag === "Coming Soon" ? "#a5b4fc" : "#4ade80",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 8
                      }}
                    >
                      {feature.tag}
                    </span>
                  )}
                  <div
                    className="mb-3 flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ background: `${feature.color}1a` }}
                  >
                    <feature.icon size={13} style={{ color: feature.color }} />
                  </div>
                  <p
                    className="mb-1 text-white font-semibold"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}
                  >
                    {feature.title}
                  </p>
                  <p
                    className="leading-relaxed text-white/38"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11 }}
                  >
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div
                className="grid grid-cols-3 px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)"
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  Feature
                </span>
                <span
                  className="text-center"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)" }}
                >
                  Free
                </span>
                <div className="flex items-center justify-center gap-1">
                  <Crown size={9} style={{ color: METIS_RED }} />
                  <span
                    className="font-bold"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: METIS_RED }}
                  >
                    Plus
                  </span>
                </div>
              </div>
              {FREE_VS_PLUS_ROWS.map((row, index) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-3 items-center px-4 py-2"
                  style={{
                    borderBottom:
                      index < FREE_VS_PLUS_ROWS.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"
                  }}
                >
                  <span
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)" }}
                  >
                    {row.feature}
                  </span>
                  <div className="flex justify-center">
                    {row.free ? (
                      <div
                        className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: "rgba(34,197,94,0.15)" }}
                      >
                        <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>—</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: "rgba(220,94,94,0.18)" }}
                    >
                      <span style={{ color: METIS_RED, fontSize: 10 }}>✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 px-6 pb-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpgrade}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold"
              style={{
                background: METIS_RED,
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                boxShadow: "0 8px 24px rgba(220,94,94,0.35)"
              }}
            >
              <Sparkles size={13} />
              Upgrade to Metis+ — ${price}/mo
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                toast("Agency assist", {
                  description: "We'll wire the agency CTA once the core design is locked."
                })
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 font-semibold"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12
              }}
            >
              <Wrench size={11} />
              Fix this for me (Agency)
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

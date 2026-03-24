/**
 * DetectedStackBadges
 * Prototype chips plus grouped stack/context blocks.
 */
import { motion } from "motion/react";
import type { DesignStackChip, DesignStackGroup } from "./liveAdapter";

function chipStyle(tone: DesignStackChip["tone"]) {
  switch (tone) {
    case "provider":
      return {
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.25)",
        color: "#aeb5ff"
      };
    case "ai":
      return {
        background: "rgba(16,163,127,0.15)",
        border: "1px solid rgba(16,163,127,0.3)",
        color: "#18c59a"
      };
    case "warning":
      return {
        background: "rgba(249,115,22,0.12)",
        border: "1px solid rgba(249,115,22,0.25)",
        color: "#ff9c48"
      };
    case "tech":
      return {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.72)"
      };
    default:
      return {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.68)"
      };
  }
}

function brandedChipStyle(
  chip: Pick<DesignStackChip, "tone" | "brandColor">
) {
  if (!chip.brandColor) {
    return chipStyle(chip.tone);
  }

  const color = chip.brandColor;
  return {
    background: `${color}1f`,
    border: `1px solid ${color}40`,
    color
  };
}

interface DetectedStackBadgesProps {
  chips: DesignStackChip[];
  groups?: DesignStackGroup[];
  compact?: boolean;
}

export function DetectedStackBadges({
  chips,
  groups = [],
  compact = false
}: DetectedStackBadgesProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        {compact ? "Detected Stack" : "Known Stack"}
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <motion.div
            key={`${chip.label}-${chip.tone}`}
            className="rounded-full px-4 py-2"
            style={{
              ...brandedChipStyle(chip),
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 11 : 12,
              fontWeight: 500
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
          >
            {chip.label}
          </motion.div>
        ))}
      </div>

      {!compact && groups.length > 0 && (
        <div className="grid gap-3">
          {groups.map((group, index) => (
            <motion.div
              key={group.label}
              className="rounded-[22px] px-4 py-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.06, ease: "easeOut" }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.28)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 10
                }}
              >
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                    <motion.div
                      key={item.label}
                      className="rounded-full px-4 py-2"
                      style={{
                        background: item.brandColor ? `${item.brandColor}1a` : "rgba(255,255,255,0.06)",
                        border: item.brandColor ? `1px solid ${item.brandColor}35` : "1px solid rgba(255,255,255,0.08)",
                        color: item.brandColor ?? "rgba(255,255,255,0.7)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 500
                      }}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {item.label}
                    </motion.div>
                  ))}
                </div>
            </motion.div>
          ))}
          <div
            style={{
              color: "rgba(255,255,255,0.34)",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              lineHeight: "17px",
              paddingTop: 2
            }}
          >
            Auto-detected from network and DOM signals.
          </div>
        </div>
      )}
    </motion.div>
  );
}

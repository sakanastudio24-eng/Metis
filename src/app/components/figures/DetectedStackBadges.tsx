/**
 * DetectedStackBadges
 * Prototype chips plus grouped stack/context blocks.
 */
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
    <div className="space-y-4">
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
        {chips.map((chip) => (
          <div
            key={`${chip.label}-${chip.tone}`}
            className="rounded-full px-4 py-2"
            style={{
              ...chipStyle(chip.tone),
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 11 : 12,
              fontWeight: 500
            }}
          >
            {chip.label}
          </div>
        ))}
      </div>

      {!compact && groups.length > 0 && (
        <div className="grid gap-3">
          {groups.map((group) => (
            <div
              key={group.label}
              className="rounded-[22px] px-4 py-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}
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
                  <div
                    key={item}
                    className="rounded-full px-4 py-2"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

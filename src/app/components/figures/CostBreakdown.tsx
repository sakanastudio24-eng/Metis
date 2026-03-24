/**
 * CostBreakdown
 * Dense report rows for the prototype cost breakdown section.
 */
import { Brain, HardDrive, Zap } from "lucide-react";
import type { DesignCostRow } from "./liveAdapter";

const iconMap = {
  Bandwidth: HardDrive,
  "Requests / Compute": Zap,
  "AI API Usage": Brain,
  "Third-Party / APIs": Zap
} as const;

interface CostBreakdownProps {
  rows: DesignCostRow[];
}

export function CostBreakdown({ rows }: CostBreakdownProps) {
  return (
    <div className="space-y-4">
      <div
        style={{
          color: "rgba(255,255,255,0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        Cost Breakdown
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.45)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          lineHeight: "18px"
        }}
      >
        Where your estimated waste is coming from
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = iconMap[row.label as keyof typeof iconMap] ?? HardDrive;

          return (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-[22px] px-5 py-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.04)"
              }}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} style={{ color: row.accent }} />
                <div
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  {row.label}
                </div>
              </div>
              <div
                style={{
                  color: "white",
                  fontFamily: "Jua, sans-serif",
                  fontSize: 16
                }}
              >
                {row.amount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

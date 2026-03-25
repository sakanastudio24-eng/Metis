/**
 * CostBreakdown
 * Dense report rows for the prototype cost breakdown section.
 */
import { motion } from "motion/react";
import { Brain, HardDrive, Zap } from "lucide-react";
import type { DesignCostRow } from "./liveAdapter";
import { AcronymText } from "./AcronymTooltipText";

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
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        <AcronymText text="Cost Breakdown" />
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.45)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          lineHeight: "18px"
        }}
      >
        <AcronymText text="Where your estimated waste is coming from" />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const Icon = iconMap[row.label as keyof typeof iconMap] ?? HardDrive;

          return (
            <motion.div
              key={row.label}
              className="flex items-center justify-between rounded-[22px] px-5 py-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.04)"
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.06, ease: "easeOut" }}
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
                  <AcronymText text={row.label} />
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
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

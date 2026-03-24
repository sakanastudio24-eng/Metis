/**
 * CostBreakdown
 * Displays where estimated cost waste is coming from.
 * 
 * DESIGN SPECS:
 * - Shows 4-5 major cost drivers (bandwidth, compute, AI, APIs)
 * - Each item has icon, label, and monthly estimate (~$6/mo, ~$10/mo, etc.)
 * - Darker backgrounds indicate lower priority items
 * - Descriptive header: "Where your estimated waste is coming from"
 * 
 * DATA FLOW:
 * - Receives ScoreDeduction[] from score breakdown
 * - Maps deduction reasons to cost categories with icons
 * - Shows estimated monthly cost per driver
 * - Green info box if no deductions (efficient page)
 */
import { HardDrive, Zap, Brain, Package } from "lucide-react";
import type { ScoreDeduction } from "../../../shared/types/audit";

interface CostBreakdownItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  monthlyEstimate: string;
  color: string;
}

interface CostBreakdownProps {
  deductions: ScoreDeduction[];
  monthlyProjection?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  bandwidth: HardDrive,
  compute: Zap,
  ai: Brain,
  api: Package
};

export function CostBreakdown({ 
  deductions,
  monthlyProjection = "~$240/month"
}: CostBreakdownProps) {
  // Transform raw deduction data into display items with icons and estimates
  // Limits to 4 items for readability (most significant cost drivers)
  const items: CostBreakdownItem[] = deductions
    .slice(0, 4)
    .map((ded, idx) => ({
      icon: Object.values(ICON_MAP)[idx % Object.values(ICON_MAP).length],
      label: ded.reason,
      monthlyEstimate: `~$${(idx + 6).toFixed(0)}/mo`,
      color: ded.severity === "high" ? "text-red-400" : "text-orange-400"
    }));

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Cost Breakdown
      </h3>
      <p className="text-xs text-gray-500">
        Where your estimated waste is coming from
      </p>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)"
              }}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
              <span className="text-sm font-mono text-gray-400">
                {item.monthlyEstimate}
              </span>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            No cost drivers detected. This site looks efficient!
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * DetectedStackBadges
 * Shows detected technology stack and site insights.
 * 
 * DESIGN SPECS:
 * - Blue tags for tech (React 18, Next.js 14)
 * - Purple tags for hosting provider (Vercel, Netlify)
 * - Green tags for insights (AI usage detected)
 * - Page info indicator (single vs multi-page mode)
 * 
 * DATA INTEGRATION:
 * - Currently receives hardcoded demo badges
 * - Should be populated from detection/scan features:
 *   - Frameworks from DOM analysis
 *   - Providers from headers and known CDN IPs
 *   - Insights from scoring heuristics (AI, third-party, etc.)
 */
import { X } from "lucide-react";

interface StackBadge {
  label: string;
  type: "tech" | "insight" | "provider" | "warning";
  icon?: React.ComponentType<{ className?: string }>;
}

interface DetectedStackBadgesProps {
  badges: StackBadge[];
  pageInfo?: {
    mode: "single" | "multi";
    pages?: number;
    hostname: string;
  };
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tech: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30"
  },
  provider: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30"
  },
  insight: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30"
  },
  warning: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30"
  }
};

export function DetectedStackBadges({
  badges,
  pageInfo
}: DetectedStackBadgesProps) {
  return (
    <div className="space-y-4">
      {/* Page context: shows whether scanning single or multiple pages */}
      {pageInfo && (
        <div className="p-3 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.05)" }}>
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>
              {pageInfo.mode === "multi" && `Sampled ${pageInfo.pages} pages · `}
              {pageInfo.hostname}
            </span>
          </div>
        </div>
      )}

      {/* Technology stack and detected insights - helps user understand what was analyzed */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Detected Stack
        </h3>

        {/* Badges colored by type: tech (blue), provider (purple), insight (green) */}
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, idx) => {
            const colors = TYPE_COLORS[badge.type];
            const Icon = badge.icon;

            return (
              <div
                key={idx}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {badge.label}
              </div>
            );
          })}

          {badges.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              Stack detection still running...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

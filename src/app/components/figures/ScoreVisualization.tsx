/**
 * ScoreVisualization
 * Displays the cost risk score with a circular progress ring and risk label.
 * Matches the Figma design: large orange ring with centered score number.
 */
import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { ScoreLabel } from "../../../shared/types/audit";

const RISK_COLORS: Record<ScoreLabel, string> = {
  "warming up": "#6b7280",
  healthy: "#22c55e",
  watch: "#f97316",
  "high risk": "#dc2626"
};

const RISK_LABELS: Record<ScoreLabel, string> = {
  "warming up": "Warming up",
  healthy: "Healthy",
  watch: "Moderate Risk",
  "high risk": "High Risk"
};

interface ScoreVisualizationProps {
  score: number;
  label: ScoreLabel;
  size?: number;
}

export function ScoreVisualization({
  score,
  label,
  size = 160
}: ScoreVisualizationProps) {
  const [displayedScore, setDisplayedScore] = useState(score);
  const rafRef = useRef<number | null>(null);

  const animateTo = useCallback((to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = displayedScore;
    if (from === to) return;

    const duration = 750;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out
      const val = Math.round(from + (to - from) * eased);
      setDisplayedScore(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [displayedScore]);

  useEffect(() => {
    animateTo(score);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animateTo]);

  const ringColor = RISK_COLORS[label];
  const circumference = 2 * Math.PI * (size / 2 - 12);
  const strokeDashoffset = circumference * (1 - displayedScore / 100);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score Ring */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: "drop-shadow(0 0 20px rgba(249, 115, 22, 0.2))" }}
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 12}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="10"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 12}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center gap-1">
          <div className="text-4xl font-bold text-white">{displayedScore}</div>
          <div className="text-xs text-gray-400">Cost Risk</div>
        </div>
      </div>

      {/* Risk Label Badge */}
      <div
        className="px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2"
        style={{
          backgroundColor: `${ringColor}25`,
          color: ringColor,
          border: `1px solid ${ringColor}40`
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: ringColor }}
        />
        {RISK_LABELS[label]}
      </div>
    </div>
  );
}

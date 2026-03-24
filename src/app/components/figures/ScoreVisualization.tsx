/**
 * ScoreVisualization
 * Prototype-faithful score ring used across the mini panel and full report.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface ScoreVisualizationProps {
  score: number;
  size?: number;
  color: string;
  trackColor?: string;
}

export function ScoreVisualization({
  score,
  size = 140,
  color,
  trackColor = "rgba(255,255,255,0.08)"
}: ScoreVisualizationProps) {
  const [displayed, setDisplayed] = useState(score);
  const rafRef = useRef<number | null>(null);

  const animateTo = useCallback(
    (target: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      const from = displayed;
      if (from === target) {
        return;
      }

      const start = performance.now();
      const duration = 750;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(from + (target - from) * eased));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [displayed]
  );

  useEffect(() => {
    animateTo(score);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animateTo, score]);

  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayed / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 40ms linear" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          style={{
            color: "white",
            fontFamily: "Jua, sans-serif",
            fontSize: size >= 120 ? 36 : 28,
            lineHeight: 1
          }}
        >
          {displayed}
        </div>
      </div>
    </div>
  );
}

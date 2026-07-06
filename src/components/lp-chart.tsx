import type { RankSnapshot } from "@/lib/types";
import { clamp } from "@/lib/utils";

type LpChartProps = {
  snapshots: RankSnapshot[];
  height?: number;
};

export function LpChart({ snapshots, height = 210 }: LpChartProps) {
  const width = 680;
  const padding = 26;
  const values = snapshots.map((snapshot) => snapshot.lp);
  const min = Math.min(...values) - 20;
  const max = Math.max(...values) + 20;
  const points = snapshots.map((snapshot, index) => {
    const x =
      padding +
      (index / Math.max(snapshots.length - 1, 1)) * (width - padding * 2);
    const ratio = (snapshot.lp - min) / (max - min);
    const y = height - padding - clamp(ratio, 0, 1) * (height - padding * 2);

    return { x, y, snapshot };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[210px] w-full"
        role="img"
        aria-label="LP progression chart"
      >
        <defs>
          <linearGradient id="lp-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="52%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="lp-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
            />
          );
        })}
        <path
          d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="url(#lp-fill)"
        />
        <path
          d={path}
          fill="none"
          stroke="url(#lp-line)"
          strokeLinecap="round"
          strokeWidth="4"
        />
        {points.map((point) => (
          <g key={point.snapshot.date}>
            <text
              x={point.x}
              y={Math.max(point.y - 12, 14)}
              textAnchor="middle"
              fill={point.snapshot.label.startsWith("-") ? "#fecdd3" : "#a7f3d0"}
              fontSize="12"
              fontWeight="700"
            >
              {point.snapshot.label}
            </text>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#09090b"
              stroke="#34d399"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(244,244,245,0.64)"
              fontSize="12"
            >
              {point.snapshot.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

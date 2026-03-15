"use client";

const LABELS = ["fear", "anger", "disgust", "surprise", "sadness", "neutral", "happiness"];
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;

function polarToXY(angle, r) {
  const a = angle - Math.PI / 2;
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
}

export default function EmotionalRadarChart({ values, className = "" }) {
  const n = LABELS.length;
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const v = Math.min(1, Math.max(0, values[i] ?? 0));
    const r = RADIUS * v;
    points.push(polarToXY(angle, r));
  }
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";
  const axisPoints = LABELS.map((_, i) => polarToXY((2 * Math.PI * i) / n, RADIUS));

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Emotional state</p>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[240px] mx-auto" style={{ aspectRatio: "1" }}>
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * f}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        {/* Axes */}
        {axisPoints.map((p, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p[0]}
            y2={p[1]}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        {/* Data polygon */}
        <path d={pathD} fill="rgba(54, 157, 110, 0.35)" stroke="#369d6e" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Labels */}
        {LABELS.map((label, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const r = RADIUS + 18;
          const [x, y] = [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              className="fill-gray-500"
              style={{ fontSize: 9, fontFamily: "system-ui" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

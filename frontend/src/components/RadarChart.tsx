import { useMemo } from "react";

interface RadarChartProps {
  data: Record<string, number>;
  size?: number;
}

const RadarChart = ({ data, size = 250 }: RadarChartProps) => {
  const entries = Object.entries(data);
  const count = entries.length;
  const center = size / 2;
  const radius = size / 2 - 30;

  const points = useMemo(() => {
    return entries.map(([, value], i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const r = (value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
  }, [entries, count, center, radius]);

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={Array.from({ length: count }, (_, i) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            const r = level * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity={0.5}
        />
      ))}

      {/* Axes */}
      {entries.map(([, ], i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.3}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="hsl(var(--neon-purple) / 0.2)"
        stroke="hsl(var(--neon-purple))"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--neon-purple))" />
      ))}

      {/* Labels */}
      {entries.map(([label, value], i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const labelR = radius + 20;
        const x = center + labelR * Math.cos(angle);
        const y = center + labelR * Math.sin(angle);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-xs font-medium"
          >
            {label} {value}%
          </text>
        );
      })}
    </svg>
  );
};

export default RadarChart;

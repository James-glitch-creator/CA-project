// Minimal dependency-free donut chart using an SVG conic-style stroke-dasharray trick.
export default function DonutChart({ segments, size = 140 }) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="donut-track" strokeWidth="14" fill="none" />
        {segments.map(seg => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="donut-legend">
        {segments.map(seg => (
          <div className="legend-row" key={seg.label}>
            <span className="legend-dot" style={{ background: seg.color }} />
            {seg.label}: <strong>{seg.value.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal, dependency-free horizontal bar chart built from plain divs.
export default function BarChart({ data, unit = "" }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label" title={d.label}>{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{d.value.toFixed(d.value < 10 ? 2 : 0)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

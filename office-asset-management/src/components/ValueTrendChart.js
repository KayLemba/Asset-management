export default function ValueTrendChart({ points = [], height = 180 }) {
  const width = 720;
  const padding = 34;
  const values = points.map((point) => Number(point.value) || 0);
  const max = Math.max(1, ...values);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    ...point,
    value: Number(point.value) || 0,
    x: padding + index * stepX,
    y: height - padding - ((Number(point.value) || 0) / max) * (height - padding * 2),
  }));
  const linePath = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`
    : "";

  if (!points.length) return <p className="empty-hint">No value history yet.</p>;

  return (
    <div className="trend-chart" aria-label="Portfolio value trend for the last 12 months">
      <div className="trend-summary">
        <strong>ZMW {(values[values.length - 1] || 0).toLocaleString()}</strong>
        <span className="muted">latest reconstructed value</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Portfolio value trend chart">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="var(--border)" />
        <path d={areaPath} fill="var(--accent-soft)" opacity="0.7" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4" fill="var(--accent)" stroke="var(--card)" strokeWidth="2">
            <title>{point.label}: ZMW {point.value.toLocaleString()}</title>
          </circle>
        ))}
        {coords.map((point) => (
          <text key={`label-${point.label}`} x={point.x} y={height - 10} textAnchor="middle" className="trend-label">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

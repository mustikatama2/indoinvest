/**
 * ProbTrendChart — SVG multiline probability trend chart
 *
 * @prop {Array}  data       - Array of { date: ISOString, probs: [n0,n1,n2,n3,n4] }
 *                             Each probs[i] is 0-100. Up to 90 points but display last 20.
 * @prop {Array}  scenarios  - ['V-shape recovery','Gradual grind','Sideways chop','Extended bear','Full crisis']
 * @prop {Array}  colors     - ['#1E8449','#2874A6','#D35400','#C0392B','#7B241C']
 * @prop {number} [height]   - internal coordinate height, default 160
 */
export function ProbTrendChart({ data, scenarios, colors, height = 160 }) {
  const WIDTH = 500;
  const padL = 36;
  const padR = 70;
  const padT = 10;
  const padB = 24;
  const chartW = WIDTH - padL - padR;
  const chartH = height - padT - padB;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  // Not enough data
  if (!data || data.length < 2) {
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${height}`}
        style={{ display: 'block' }}
      >
        <text
          x={WIDTH / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#555"
          fontSize={12}
        >
          Save 2+ snapshots to see trend
        </text>
      </svg>
    );
  }

  const pts = data.slice(-20);
  const n = pts.length;

  // Coordinate helpers
  const cx = (i) => padL + (i / (n - 1)) * chartW;
  const cy = (prob) => padT + (1 - prob / 100) * chartH;

  // Grid lines at 25 / 50 / 75
  const gridLevels = [25, 50, 75];

  // X-axis: up to 5 evenly spaced indices
  const xLabelCount = Math.min(5, n);
  const xIndices = Array.from({ length: xLabelCount }, (_, k) =>
    Math.round((k / (xLabelCount - 1)) * (n - 1))
  );

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${WIDTH} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Grid lines */}
      {gridLevels.map((pct) => {
        const y = cy(pct);
        return (
          <line
            key={pct}
            x1={padL}
            y1={y}
            x2={padL + chartW}
            y2={y}
            stroke="#222"
            strokeWidth={0.8}
            strokeDasharray="3,3"
          />
        );
      })}

      {/* Y axis */}
      <line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + chartH}
        stroke="#333"
        strokeWidth={0.8}
      />

      {/* X axis */}
      <line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#333"
        strokeWidth={0.8}
      />

      {/* Y axis labels: 0, 25, 50, 75, 100 */}
      {[0, 25, 50, 75, 100].map((pct) => (
        <text
          key={pct}
          x={padL - 4}
          y={cy(pct)}
          textAnchor="end"
          dominantBaseline="middle"
          fill="#666"
          fontSize={8}
        >
          {pct}%
        </text>
      ))}

      {/* X axis labels */}
      {xIndices.map((idx, k) => (
        <text
          key={k}
          x={cx(idx)}
          y={padT + chartH + 14}
          textAnchor="middle"
          fill="#666"
          fontSize={8}
        >
          {formatDate(pts[idx].date)}
        </text>
      ))}

      {/* Lines per scenario */}
      {scenarios.map((_, si) => {
        const points = pts
          .map((pt, i) => `${cx(i)},${cy(pt.probs[si])}`)
          .join(' ');
        const lastPt = pts[n - 1];
        const lastX = cx(n - 1);
        const lastY = cy(lastPt.probs[si]);

        return (
          <g key={si}>
            <polyline
              points={points}
              fill="none"
              stroke={colors[si]}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            {/* End-point dot */}
            <circle cx={lastX} cy={lastY} r={3} fill={colors[si]} />
            {/* Scenario label */}
            <text
              x={lastX + 6}
              y={lastY}
              dominantBaseline="middle"
              fill={colors[si]}
              fontSize={9}
            >
              {scenarios[si]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

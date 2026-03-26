import { useState } from 'react';

function getTestValues(ind) {
  if (ind.isSelect) return ind.options.map(o => ({ value: o.value, label: o.label }));
  const vals = [];
  const zoneMaxes = ind.zones.map(z => z.max).filter(m => m < 99999 && m < 99);
  if (zoneMaxes.length === 0) return [];
  vals.push({
    value: Math.round(zoneMaxes[0] * 0.88),
    label: `${Math.round(zoneMaxes[0] * 0.88).toLocaleString()}`,
  });
  zoneMaxes.forEach((max) => {
    vals.push({ value: max, label: max.toLocaleString() });
  });
  return vals.slice(0, 5);
}

/**
 * @prop {Array}    indicators   - Full INDICATORS array (both macro and price)
 * @prop {Object}   values       - Current { [indicatorId]: value } map
 * @prop {string}   ticker       - Active ticker e.g. 'BBCA'
 * @prop {Object}   baseProbs    - BASE_PROBS object e.g. { BBCA:[15,40,25,15,5], ... }
 * @prop {Array}    scenarios    - ['V-shape recovery',...]
 * @prop {Array}    sColors      - ['#1E8449',...]
 * @prop {Function} computeProbs - (values, ticker) => [n0,n1,n2,n3,n4]
 */
export function SensitivityTable({ indicators, values, ticker, baseProbs, scenarios, sColors, computeProbs }) {
  const macroIndicators = indicators.filter(ind => !ind.ticker);

  const [indAId, setIndAId] = useState('ihsg');
  const [indBId, setIndBId] = useState('fx');

  const indA = macroIndicators.find(i => i.id === indAId) || macroIndicators[0];
  const indB = macroIndicators.find(i => i.id === indBId) || macroIndicators[1];

  if (!indA || !indB) return null;

  const rowVals = getTestValues(indA);
  const colVals = getTestValues(indB);

  const currentA = values[indAId];
  const currentB = values[indBId];

  const isCurrentRow = (rowVal) => Math.abs(rowVal - currentA) <= Math.abs(rowVal * 0.05 + 0.5);
  const isCurrentCol = (colVal) => Math.abs(colVal - currentB) <= Math.abs(colVal * 0.05 + 0.5);

  const selectStyle = {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#e0e0e0',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
    cursor: 'pointer',
    outline: 'none',
  };

  const N = colVals.length;

  return (
    <div style={{
      background: '#1c1c1c',
      border: '1px solid #2a2a2a',
      borderRadius: 8,
      padding: '12px 14px',
      marginTop: 12,
    }}>
      {/* Title + Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#8a8a8a', fontWeight: 600, letterSpacing: '0.04em' }}>
          SENSITIVITY
        </span>
        <select
          value={indAId}
          onChange={e => setIndAId(e.target.value)}
          style={selectStyle}
        >
          {macroIndicators.map(ind => (
            <option key={ind.id} value={ind.id}>{ind.label || ind.id}</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: '#555' }}>vs</span>
        <select
          value={indBId}
          onChange={e => setIndBId(e.target.value)}
          style={selectStyle}
        >
          {macroIndicators.map(ind => (
            <option key={ind.id} value={ind.id}>{ind.label || ind.id}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${N}, 1fr)`,
        gap: 2,
      }}>
        {/* Top-left empty corner */}
        <div style={{ minWidth: 44 }} />

        {/* Column headers (indB values) */}
        {colVals.map((cv) => (
          <div
            key={cv.value}
            style={{
              fontSize: 10,
              color: isCurrentCol(cv.value) ? '#f0c040' : '#8a8a8a',
              textAlign: 'center',
              padding: '2px 4px',
              fontWeight: isCurrentCol(cv.value) ? 700 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cv.label}
          </div>
        ))}

        {/* Rows */}
        {rowVals.map((rv) => {
          const highlightRow = isCurrentRow(rv.value);
          return [
            /* Row header */
            <div
              key={`rh-${rv.value}`}
              style={{
                fontSize: 10,
                color: highlightRow ? '#f0c040' : '#8a8a8a',
                textAlign: 'right',
                padding: '6px 6px 6px 0',
                fontWeight: highlightRow ? 700 : 400,
                whiteSpace: 'nowrap',
                alignSelf: 'center',
              }}
            >
              {rv.label}
            </div>,

            /* Cells */
            ...colVals.map((cv) => {
              const highlightCol = isCurrentCol(cv.value);
              const isActive = highlightRow && highlightCol;

              const modValues = { ...values, [indAId]: rv.value, [indBId]: cv.value };
              const probs = computeProbs(modValues, ticker);
              const maxP = Math.max(...probs);
              const domIdx = probs.indexOf(maxP);
              const domName = (scenarios[domIdx] || '').split(/[\s-]/)[0];
              const bgColor = (sColors[domIdx] || '#888') + '22';
              const borderColor = (sColors[domIdx] || '#888') + '44';

              return (
                <div
                  key={`${rv.value}-${cv.value}`}
                  title={`${scenarios[domIdx]}: ${maxP}%`}
                  style={{
                    background: bgColor,
                    border: isActive
                      ? '1px solid #f0c040'
                      : `1px solid ${borderColor}`,
                    borderRadius: 4,
                    padding: '6px 4px',
                    fontSize: 10,
                    textAlign: 'center',
                    minWidth: 60,
                    color: '#e0e0e0',
                    lineHeight: 1.3,
                    cursor: 'default',
                    boxShadow: isActive ? '0 0 0 1px #f0c04066' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{domName}</div>
                  <div style={{ color: sColors[domIdx] || '#aaa', fontSize: 10 }}>{maxP}%</div>
                </div>
              );
            }),
          ];
        })}
      </div>

      {/* Legend hint */}
      <div style={{ fontSize: 9, color: '#555', marginTop: 8, textAlign: 'right' }}>
        highlighted = current values · hover for full scenario name
      </div>
    </div>
  );
}

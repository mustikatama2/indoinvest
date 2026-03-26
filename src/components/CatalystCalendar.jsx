// src/components/CatalystCalendar.jsx

const TICKER_COLORS = {
  BBCA: '#2874A6',
  BBRI: '#1E8449',
  BMRI: '#8a5cf6',
  BBNI: '#D35400',
  BRIS: '#f0c200',
};

function pillColor(days) {
  if (days <= 7)  return '#C0392B';
  if (days <= 30) return '#D35400';
  return '#555';
}

function formatDate(dateObj) {
  return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * @prop {Array}  catalysts - CATALYSTS array from data/catalysts.js
 * @prop {Object} types     - CATALYST_TYPES map
 * @prop {string} [ticker]  - If set, highlights events for this ticker
 */
export function CatalystCalendar({ catalysts, types, ticker }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = catalysts
    .map(c => ({ ...c, dateObj: new Date(c.date) }))
    .filter(c => c.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 10);

  const daysUntil = (dateObj) => Math.ceil((dateObj - today) / 86400000);

  return (
    <div style={{
      background: '#1c1c1c',
      border: '1px solid #2a2a2a',
      borderRadius: 10,
      padding: 14,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e4' }}>
          Upcoming Catalysts
        </span>
        <span style={{ fontSize: 10, color: '#555' }}>next 10 events</span>
      </div>

      {/* Event list */}
      {upcoming.length === 0 ? (
        <div style={{ fontSize: 12, color: '#555', padding: '8px 0' }}>
          No upcoming events scheduled.
        </div>
      ) : (
        upcoming.map((c, i) => {
          const typeInfo  = types[c.type] || { label: c.type, color: '#888', icon: '•' };
          const days      = daysUntil(c.dateObj);
          const isLast    = i === upcoming.length - 1;
          const highlight = ticker && c.ticker === ticker;

          return (
            <div
              key={`${c.date}-${c.type}-${i}`}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '8px 6px',
                borderBottom: isLast ? 'none' : '1px solid #1e1e1e',
                background: highlight ? '#222' : 'transparent',
                borderRadius: highlight ? 6 : 0,
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: typeInfo.color + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {typeInfo.icon}
              </div>

              {/* Left col — title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#e4e4e4', lineHeight: '1.3', marginBottom: 2 }}>
                  {c.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: typeInfo.color }}>
                    {typeInfo.label}
                  </span>
                  {c.ticker && (
                    <>
                      <span style={{ fontSize: 10, color: '#444' }}>·</span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: '#fff',
                        background: TICKER_COLORS[c.ticker] || '#555',
                        borderRadius: 3,
                        padding: '1px 4px',
                      }}>
                        {c.ticker}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right col — days pill + date */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 3,
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: pillColor(days),
                  whiteSpace: 'nowrap',
                }}>
                  {days === 0 ? 'Today' : `${days}d`}
                </span>
                <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap' }}>
                  {formatDate(c.dateObj)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

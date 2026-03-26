import React, { useState } from 'react';
import Dashboard from './Dashboard.jsx';
import { CompareView } from './components/CompareView.jsx';
import { JournalPage } from './pages/JournalPage.jsx';

const VIEWS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'compare',   label: '⚖️ Compare'   },
  { id: 'journal',   label: '📓 Journal'   },
];

export default function App() {
  const [view, setView]               = useState('dashboard');
  const [activeTicker, setActiveTicker] = useState(0);

  // When user clicks a ticker in CompareView, switch to Dashboard on that ticker
  const handleSelectTicker = (idx) => {
    setActiveTicker(idx);
    setView('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        height: 48,
        borderBottom: '1px solid #1e1e1e',
        background: '#111',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 12,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#f0c200' }}>Indo</span>
            <span style={{ color: '#e4e4e4' }}>Invest</span>
          </span>
          <span style={{
            fontSize: 8, fontWeight: 600, color: '#555',
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: 4, padding: '2px 5px',
            textTransform: 'uppercase', letterSpacing: 0.5,
            display: 'none', // hide on very small screens
          }}>
            ID Bank Monitor
          </span>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                fontSize: 12,
                fontWeight: view === v.id ? 600 : 400,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: view === v.id ? '#1e1e1e' : 'transparent',
                color: view === v.id ? '#e4e4e4' : '#555',
                cursor: 'pointer',
                transition: 'background .15s, color .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {v.label}
            </button>
          ))}
        </nav>

        {/* Ticker mini-label */}
        <div style={{ fontSize: 10, color: '#333', flexShrink: 0 }}>
          BBCA · BBRI · BMRI
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 14px 40px' }}>
        {view === 'dashboard' && (
          <Dashboard
            externalActiveTicker={activeTicker}
            onActiveTickerChange={setActiveTicker}
          />
        )}
        {view === 'compare' && (
          <CompareView onSelectTicker={handleSelectTicker} />
        )}
        {view === 'journal' && (
          <JournalPage />
        )}
      </div>
    </div>
  );
}

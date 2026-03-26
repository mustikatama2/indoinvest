import React from 'react';
import Dashboard from './Dashboard.jsx';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: '1px solid #1e1e1e',
        background: '#111',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#f0c200' }}>Indo</span>
            <span style={{ color: '#e4e4e4' }}>Invest</span>
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            color: '#555',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 4,
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Indonesian Bank Monitor
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#555' }}>
          BBCA · BBRI · BMRI
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 14px 40px' }}>
        <Dashboard />
      </div>
    </div>
  );
}

// src/components/SaveWithNote.jsx
import { useState, useRef, useEffect } from 'react';

/**
 * @prop {boolean}  saving  - Is save in progress?
 * @prop {Function} onSave  - Called with (note: string) — empty string = no note
 */
export function SaveWithNote({ saving, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote]         = useState('');
  const inputRef                = useRef(null);

  // Auto-focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  function handleOpen() {
    setNote('');
    setExpanded(true);
  }

  function handleSave() {
    onSave(note.trim());
    setExpanded(false);
    setNote('');
  }

  function handleCancel() {
    setExpanded(false);
    setNote('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
  }

  const btnBase = {
    fontSize: 12, borderRadius: 5, cursor: 'pointer', border: '1px solid #333',
    background: '#1c1c1c', color: '#e4e4e4', fontFamily: 'inherit',
  };

  if (!expanded) {
    return (
      <button onClick={handleOpen} disabled={saving}
        style={{ ...btnBase, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        💾 {saving ? 'Saving…' : 'Save'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        style={{
          width: 180, fontSize: 12,
          background: '#1a1a1a', color: '#e4e4e4',
          border: '1px solid #333', borderRadius: 5,
          padding: '5px 8px', outline: 'none',
        }}
      />
      <button onClick={handleSave} disabled={saving}
        style={{ ...btnBase, padding: '5px 12px', background: '#1e3554', color: '#93c5fd', border: 'none' }}>
        {saving ? '…' : 'Save'}
      </button>
      <button onClick={handleCancel} disabled={saving}
        style={{ ...btnBase, padding: '5px 8px', color: '#8a8a8a' }} title="Cancel">
        ×
      </button>
    </div>
  );
}

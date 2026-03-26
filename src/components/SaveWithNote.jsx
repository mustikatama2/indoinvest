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

  if (!expanded) {
    return (
      <button
        className="btn"
        onClick={handleOpen}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
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
          width: 200,
          fontSize: 12,
          background: 'var(--input-bg, #1a1a1a)',
          color: 'var(--text-primary, #e4e4e4)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 5,
          padding: '4px 8px',
          outline: 'none',
        }}
      />
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ fontSize: 12, padding: '4px 10px' }}
      >
        {saving ? '…' : 'Save'}
      </button>
      <button
        className="btn"
        onClick={handleCancel}
        disabled={saving}
        style={{ fontSize: 12, padding: '4px 8px' }}
        title="Cancel"
      >
        ×
      </button>
    </div>
  );
}

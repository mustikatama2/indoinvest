import { useState, useEffect, useCallback } from 'react';

/**
 * Encode a values object to a base64 string for use in a URL hash.
 */
export function encodeState(values) {
  try {
    return btoa(JSON.stringify(values));
  } catch {
    return '';
  }
}

/**
 * Decode a base64 hash string back to a values object, or return null.
 */
export function decodeState(hash) {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

/**
 * Drop-in useState replacement that syncs to window.location.hash.
 * On mount: reads hash and merges over defaultValues.
 * On change: writes updated state to hash (replaceState, no reload).
 */
export function useUrlState(defaultValues) {
  const [values, setValuesRaw] = useState(() => {
    const fromHash = decodeState(window.location.hash);
    if (fromHash && typeof fromHash === 'object') {
      return { ...defaultValues, ...fromHash };
    }
    return defaultValues;
  });

  // Sync to hash whenever values change
  useEffect(() => {
    const encoded = encodeState(values);
    const newHash = '#' + encoded;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [values]);

  const setValues = useCallback((updater) => {
    setValuesRaw(prev =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
    );
  }, []);

  return [values, setValues];
}

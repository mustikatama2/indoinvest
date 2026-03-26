import { useEffect, useRef } from 'react';

/**
 * Calls `callback` every `intervalMs` milliseconds.
 * Pass intervalMs=null to disable.
 * Uses a ref so callback identity changes don't restart the timer.
 */
export function useAutoRefresh(callback, intervalMs) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; });

  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

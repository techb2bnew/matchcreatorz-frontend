'use client';
import { useEffect, useRef } from 'react';

/**
 * Silently re-runs `callback` on an interval so list pages stay current
 * without the user having to reload the page.
 *
 * - Always calls the LATEST `callback` (via ref), so callers don't need to
 *   memoize it or list it in a dependency array — just pass the function.
 * - Skips a tick if the previous call is still in flight (slow network), so
 *   requests never pile up.
 * - Pauses while the browser tab is hidden, so a backgrounded tab doesn't
 *   keep polling the API for no one to see.
 * - Pass `enabled: false` to turn polling off entirely (e.g. while a modal
 *   with unsaved input is open, so a background refresh can't yank data out
 *   from under the user mid-edit).
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs = 20000,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  // Keep the ref in sync via an effect (runs after every render/commit) rather
  // than mutating it directly in the render body, which React's stricter
  // render-purity rules flag as unsafe.
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    let inFlight = false;
    const tick = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } finally {
        inFlight = false;
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

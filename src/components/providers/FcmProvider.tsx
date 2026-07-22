'use client';
/**
 * FcmProvider
 * ─────────────────────────────────────────────────────────────────────────────
 * Watches Redux auth state.
 *   • When user logs in  → calls initWebFcm(role)  to register FCM web token
 *   • When user logs out → calls clearWebFcm(role) to clear FCM web token
 *
 * Renders nothing — purely a side-effect provider.
 */
import { useEffect, useRef } from 'react';
import { useSelector }       from 'react-redux';
import { initWebFcm, clearWebFcm } from '@/lib/fcm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectAuth = (state: any) => state.auth;

export default function FcmProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useSelector(selectAuth);
  const prevAuth = useRef<boolean>(false);
  const prevRole = useRef<string | null>(null);

  useEffect(() => {
    const wasAuthenticated = prevAuth.current;
    const role             = user?.type || null;

    if (isAuthenticated && role && !wasAuthenticated) {
      // Just logged in
      console.log('[FCM] Triggering initWebFcm for role:', role);
      initWebFcm(role);
      prevRole.current = role;
    }

    if (!isAuthenticated && wasAuthenticated && prevRole.current) {
      // Just logged out
      clearWebFcm(prevRole.current);
      prevRole.current = null;
    }

    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, user]);

  return <>{children}</>;
}

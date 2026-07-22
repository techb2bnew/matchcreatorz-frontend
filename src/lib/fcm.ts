/**
 * fcm.ts — Web push notification management (native Web Push API)
 *
 * initWebFcm(role)  → request permission → subscribe via PushManager → register with backend
 * clearWebFcm(role) → clear subscription from backend + unsubscribe browser (call on logout)
 *
 * Does NOT use firebase/messaging — avoids the fcmregistrations.googleapis.com 401 issue.
 * Backend uses web-push package with VAPID to send notifications.
 */

import Cookies from 'js-cookie';

const API   = process.env.NEXT_PUBLIC_API_URL || '';
const VAPID = process.env.NEXT_PUBLIC_VAPID_KEY || '';

const getAuthHeaders = () => {
  const token = Cookies.get('mc_token');
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const roleEndpoint = (role: string): string | null => {
  const r = role.toLowerCase();
  if (r === 'admin') return null;
  return `${API}/api/v1/${r}/fcm-token`;
};

/** Convert base64url string to Uint8Array for applicationServerKey */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  const output  = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Request notification permission, subscribe via PushManager, and register with backend.
 * Call after login / on app load when authenticated.
 */
export const initWebFcm = async (role: string): Promise<void> => {
  try {
    const endpoint = roleEndpoint(role);
    if (!endpoint) return;

    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.info('[Push] Push notifications not supported in this browser');
      return;
    }

    if (!VAPID) {
      console.warn('[Push] NEXT_PUBLIC_VAPID_KEY not set');
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[Push] Notification permission denied');
      return;
    }

    // Register service worker and wait until active
    await navigator.serviceWorker.register('/push-sw.js');
    const swReg = await navigator.serviceWorker.ready;
    console.info('[Push] SW active:', swReg.active?.state);

    const storedEndpoint = localStorage.getItem('push_endpoint');

    // Try to reuse existing subscription if it matches what we registered
    let subscription = await swReg.pushManager.getSubscription();

    if (subscription && storedEndpoint === subscription.endpoint) {
      // Same subscription already registered with backend — nothing to do
      console.info('[Push] Already registered — skipping');
      return;
    }

    // Unsubscribe old subscription (may have been created with a different VAPID key)
    if (subscription) {
      await subscription.unsubscribe();
      subscription = null;
    }

    // Create fresh subscription with our VAPID key
    subscription = await swReg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID) as BufferSource,
    });

    console.info('[Push] Got push subscription:', subscription.endpoint.substring(0, 40) + '…');

    // Register subscription with backend
    const res = await fetch(endpoint, {
      method:  'PUT',
      headers: getAuthHeaders(),
      body:    JSON.stringify({ subscription: subscription.toJSON(), platform: 'web' }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[Push] Backend PUT failed:', res.status, body);
      return;
    }

    localStorage.setItem('push_endpoint', subscription.endpoint);
    console.info('[Push] Web push subscription registered ✅');
  } catch (err) {
    // Never crash the app
    console.error('[Push] initWebFcm error:', err);
  }
};

/**
 * Unsubscribe from push and clear from backend.
 * Call on logout.
 */
export const clearWebFcm = async (role: string): Promise<void> => {
  try {
    const endpoint = roleEndpoint(role);
    if (!endpoint) return;
    if (typeof window === 'undefined') return;

    // Clear from backend
    await fetch(endpoint, {
      method:  'DELETE',
      headers: getAuthHeaders(),
      body:    JSON.stringify({ platform: 'web' }),
    });

    localStorage.removeItem('push_endpoint');

    // Unsubscribe browser
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }

    console.info('[Push] Web push cleared');
  } catch (err) {
    console.error('[Push] clearWebFcm error:', err);
  }
};

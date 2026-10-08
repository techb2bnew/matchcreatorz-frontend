'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import type { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

const API              = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
// Apple "Services ID" (e.g. com.naim.matchcreatorsapp.web) — NOT the iOS Bundle ID
const APPLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_WEB_CLIENT_ID;
// Must exactly match a Return URL registered on that Services ID (https only)
const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

const roleRedirect: Record<UserRole, string> = {
  ADMIN:  '/admin/dashboard',
  SELLER: '/seller/dashboard',
  BUYER:  '/buyer/home',
};

// minimal defaults to satisfy the User type when setting credentials
const USER_BASE = {
  profileStatus: 'APPROVED', isEmailVerified: true, isPhoneVerified: true,
  isActive: true, isSuspended: false, walletAmount: 0, holdAmount: 0,
  totalEarningAmount: 0, totalConnects: 0, totalCompletedJobs: 0,
  avgRating: 0, totalRating: 0, step: 1, created: new Date().toISOString(),
} as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { google?: any; AppleID?: any } }

interface ApiUser { id: number; name: string; email: string; phone?: string; role: UserRole }

type Provider = 'google' | 'apple';
const PROVIDER_LABEL: Record<Provider, string> = { google: 'Google', apple: 'Apple' };

// The provider token is re-posted with the chosen role for brand-new users
interface Pending { provider: Provider; body: Record<string, unknown> }

const loadScript = (id: string, src: string, onLoad: () => void) => {
  const existing = document.getElementById(id);
  if (existing) { existing.addEventListener('load', onLoad); return; }
  const s = document.createElement('script');
  s.src = src; s.async = true; s.defer = true; s.id = id;
  s.onload = onLoad;
  document.body.appendChild(s);
};

export default function SocialAuthBox() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const btnRef   = useRef<HTMLDivElement>(null);

  const [pending, setPending]   = useState<Pending | null>(null);
  const [busy, setBusy]         = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  const finishLogin = useCallback((apiUser: ApiUser, token: string, provider: Provider) => {
    const user = {
      ...USER_BASE,
      id: apiUser.id, fullName: apiUser.name, email: apiUser.email,
      phone: apiUser.phone || '', type: apiUser.role,
    } as unknown as User;
    dispatch(setCredentials({ user, token }));
    toast.success(`Signed in with ${PROVIDER_LABEL[provider]}`);
    router.push(roleRedirect[apiUser.role]);
  }, [dispatch, router]);

  // POST the provider token (optionally with a chosen role)
  const submit = useCallback(async (provider: Provider, body: Record<string, unknown>, role?: UserRole) => {
    setBusy(true);
    try {
      const res  = await fetch(`${API}/api/v1/auth/${provider}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, ...(role ? { role } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message || `${PROVIDER_LABEL[provider]} sign-in failed`); return; }

      const d = json.data || {};
      if (d.token && d.user) { finishLogin(d.user, d.token, provider); return; }
      if (d.pendingApproval) { toast.success(d.message || 'Account created, pending approval'); setPending(null); return; }
      if (d.isNew) { setPending({ provider, body }); return; } // ask role, then resend
    } catch {
      toast.error('Server unreachable. Make sure backend is running.');
    } finally { setBusy(false); }
  }, [finishLogin]);

  // Load Google Identity Services and render the official button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => submit('google', { credential: resp.credential }),
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'pill',
      });
    };
    if (window.google) { init(); return; }
    loadScript('gsi-script', 'https://accounts.google.com/gsi/client', init);
  }, [submit]);

  // Load Sign in with Apple JS (popup mode — the page never navigates away)
  useEffect(() => {
    if (!APPLE_WEB_CLIENT_ID) return;
    const init = () => {
      if (!window.AppleID) return;
      window.AppleID.auth.init({
        clientId:    APPLE_WEB_CLIENT_ID,
        scope:       'name email',
        redirectURI: APPLE_REDIRECT_URI || `${window.location.origin}/login`,
        usePopup:    true,
      });
      setAppleReady(true);
    };
    if (window.AppleID) { init(); return; }
    loadScript('apple-signin-script',
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', init);
  }, []);

  const signInWithApple = async () => {
    if (!window.AppleID) return;
    try {
      const data = await window.AppleID.auth.signIn();
      const idToken = data?.authorization?.id_token;
      if (!idToken) { toast.error('Apple sign-in failed'); return; }
      // `user` (name/email) is only sent on the very first authorization — forward it as-is
      submit('apple', { id_token: idToken, ...(data.user ? { user: data.user } : {}) });
    } catch (err: any) {
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') return;
      toast.error('Apple sign-in failed');
    }
  };

  if (!GOOGLE_CLIENT_ID && !APPLE_WEB_CLIENT_ID) return null; // hide entirely until configured

  return (
    <div className="mb-1">
      <div className={`flex flex-col items-center gap-2 ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
        {GOOGLE_CLIENT_ID && <div ref={btnRef} />}
        {APPLE_WEB_CLIENT_ID && (
          <button
            type="button"
            onClick={signInWithApple}
            disabled={!appleReady || busy}
            className="w-[320px] max-w-full h-10 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition disabled:opacity-60"
          >
            <i className="fa fa-apple text-lg" />
            Continue with Apple
          </button>
        )}
      </div>

      {/* Role picker for brand-new social users */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setPending(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">One last step</h3>
            <p className="text-sm text-gray-500 mb-5">How do you want to use MatchCreatorz?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy}
                onClick={() => submit(pending.provider, pending.body, 'BUYER')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#e84545] hover:bg-red-50 transition disabled:opacity-60"
              >
                <i className="fa fa-shopping-bag text-2xl text-[#e84545]" />
                <span className="text-sm font-semibold text-gray-800">I&apos;m a Buyer</span>
                <span className="text-[11px] text-gray-400 text-center">Hire creators &amp; post jobs</span>
              </button>
              <button
                disabled={busy}
                onClick={() => submit(pending.provider, pending.body, 'SELLER')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#e84545] hover:bg-red-50 transition disabled:opacity-60"
              >
                <i className="fa fa-briefcase text-2xl text-[#e84545]" />
                <span className="text-sm font-semibold text-gray-800">I&apos;m a Seller</span>
                <span className="text-[11px] text-gray-400 text-center">Offer services &amp; bid on jobs</span>
              </button>
            </div>
            <button onClick={() => setPending(null)} disabled={busy}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

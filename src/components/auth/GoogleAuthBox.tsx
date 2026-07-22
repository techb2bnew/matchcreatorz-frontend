'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import type { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

const API          = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
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
declare global { interface Window { google?: any } }

interface ApiUser { id: number; name: string; email: string; phone?: string; role: UserRole }

export default function GoogleAuthBox() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const btnRef   = useRef<HTMLDivElement>(null);

  const [credential, setCredential] = useState<string | null>(null);
  const [askRole, setAskRole]       = useState(false);
  const [busy, setBusy]             = useState(false);

  const finishLogin = useCallback((apiUser: ApiUser, token: string) => {
    const user = {
      ...USER_BASE,
      id: apiUser.id, fullName: apiUser.name, email: apiUser.email,
      phone: apiUser.phone || '', type: apiUser.role,
    } as unknown as User;
    dispatch(setCredentials({ user, token }));
    toast.success('Signed in with Google');
    router.push(roleRedirect[apiUser.role]);
  }, [dispatch, router]);

  // POST the credential (optionally with a chosen role)
  const sendCredential = useCallback(async (cred: string, role?: UserRole) => {
    setBusy(true);
    try {
      const res  = await fetch(`${API}/api/v1/auth/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: cred, ...(role ? { role } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message || 'Google sign-in failed'); return; }

      const d = json.data || {};
      if (d.token && d.user) { finishLogin(d.user, d.token); return; }
      if (d.pendingApproval) { toast.success(d.message || 'Account created, pending approval'); setAskRole(false); return; }
      if (d.isNew) { setCredential(cred); setAskRole(true); return; } // ask role, then resend
    } catch {
      toast.error('Server unreachable. Make sure backend is running.');
    } finally { setBusy(false); }
  }, [finishLogin]);

  // Load Google Identity Services and render the official button
  useEffect(() => {
    if (!CLIENT_ID) return;
    const init = () => {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp: { credential: string }) => sendCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'pill',
      });
    };
    if (window.google) { init(); return; }
    const existing = document.getElementById('gsi-script');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.id = 'gsi-script';
    s.onload = init;
    document.body.appendChild(s);
  }, [sendCredential]);

  if (!CLIENT_ID) return null; // hide entirely until configured

  return (
    <div className="mb-1">
      <div className="flex justify-center">
        <div ref={btnRef} className={busy ? 'opacity-60 pointer-events-none' : ''} />
      </div>

      {/* Role picker for brand-new Google users */}
      {askRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setAskRole(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">One last step</h3>
            <p className="text-sm text-gray-500 mb-5">How do you want to use MatchCreatorz?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy}
                onClick={() => credential && sendCredential(credential, 'BUYER')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#e84545] hover:bg-red-50 transition disabled:opacity-60"
              >
                <i className="fa fa-shopping-bag text-2xl text-[#e84545]" />
                <span className="text-sm font-semibold text-gray-800">I&apos;m a Buyer</span>
                <span className="text-[11px] text-gray-400 text-center">Hire creators &amp; post jobs</span>
              </button>
              <button
                disabled={busy}
                onClick={() => credential && sendCredential(credential, 'SELLER')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#e84545] hover:bg-red-50 transition disabled:opacity-60"
              >
                <i className="fa fa-briefcase text-2xl text-[#e84545]" />
                <span className="text-sm font-semibold text-gray-800">I&apos;m a Seller</span>
                <span className="text-[11px] text-gray-400 text-center">Offer services &amp; bid on jobs</span>
              </button>
            </div>
            <button onClick={() => setAskRole(false)} disabled={busy}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

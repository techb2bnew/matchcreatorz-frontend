'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { profileApi } from '@/lib/adminApi';

type Tab = 'profile' | 'professional' | 'security';
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile',      label: 'Profile',      icon: 'fa-user'      },
  { key: 'professional', label: 'Professional',  icon: 'fa-briefcase' },
  { key: 'security',     label: 'Security',      icon: 'fa-shield'    },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

export default function SellerAccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState<number | null>(null);

  // Personal form
  const [form, setForm] = useState({
    name: '', email: '', phone: '', bio: '', location: '',
  });

  // Professional form
  const [profForm, setProfForm] = useState({
    skills:          [] as string[],
    hourly_rate:     '',
    city:            '',
    country:         '',
    resume:          '',
    portfolio_links: [] as string[],
  });
  const [skillInput,     setSkillInput]     = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);

  // Security form
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  // Status states
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg,    setProfMsg]    = useState<{ ok: boolean; text: string } | null>(null);
  const [proSaving,  setProSaving]  = useState(false);
  const [proMsg,     setProMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwMsg,      setPwMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  const [pwErrors,   setPwErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    profileApi.get('seller')
      .then((r) => {
        const u = r.data;
        setUserId(u.id);
        setForm({
          name:     u.name     || '',
          email:    u.email    || '',
          phone:    u.phone    || '',
          bio:      u.bio      || '',
          location: u.location || '',
        });
        const sp = u.seller_profile;
        if (sp) {
          setProfForm({
            skills:          sp.skills          || [],
            hourly_rate:     sp.hourly_rate      != null ? String(sp.hourly_rate) : '',
            city:            sp.city             || '',
            country:         sp.country          || '',
            resume:          sp.resume           || '',
            portfolio_links: sp.portfolio_links  || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = form.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';

  // ── Save personal profile ────────────────────────────────────────────
  const saveProfile = async () => {
    setProfSaving(true); setProfMsg(null);
    try {
      await profileApi.update('seller', {
        user_id: userId, name: form.name, phone: form.phone,
        bio: form.bio, location: form.location,
      });
      setProfMsg({ ok: true, text: 'Profile saved!' });
    } catch (e: unknown) {
      setProfMsg({ ok: false, text: (e as Error).message || 'Failed to save' });
    } finally {
      setProfSaving(false);
      setTimeout(() => setProfMsg(null), 3000);
    }
  };

  // ── Save professional profile ────────────────────────────────────────
  const saveProfessional = async () => {
    setProSaving(true); setProMsg(null);
    try {
      await profileApi.update('seller', {
        skills:          profForm.skills,
        hourly_rate:     profForm.hourly_rate ? Number(profForm.hourly_rate) : 0,
        city:            profForm.city,
        country:         profForm.country,
        resume:          profForm.resume,
        portfolio_links: profForm.portfolio_links,
      });
      setProMsg({ ok: true, text: 'Professional profile saved!' });
    } catch (e: unknown) {
      setProMsg({ ok: false, text: (e as Error).message || 'Failed to save' });
    } finally {
      setProSaving(false);
      setTimeout(() => setProMsg(null), 3000);
    }
  };

  // ── Resume file upload ───────────────────────────────────────────────
  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const r = await profileApi.uploadResume(file);
      setProfForm(f => ({ ...f, resume: r.data.url }));
    } catch (err: unknown) {
      alert((err as Error).message || 'Upload failed');
    } finally {
      setResumeUploading(false);
      e.target.value = '';
    }
  };

  // ── Skills helpers ───────────────────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profForm.skills.includes(s))
      setProfForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput('');
  };
  const removeSkill = (s: string) =>
    setProfForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  // ── Portfolio helpers ────────────────────────────────────────────────
  const addPortfolio = () => {
    const url = portfolioInput.trim();
    if (url && !profForm.portfolio_links.includes(url))
      setProfForm(f => ({ ...f, portfolio_links: [...f.portfolio_links, url] }));
    setPortfolioInput('');
  };
  const removePortfolio = (url: string) =>
    setProfForm(f => ({ ...f, portfolio_links: f.portfolio_links.filter(x => x !== url) }));

  // ── Change password ──────────────────────────────────────────────────
  const savePassword = async () => {
    const errs: Record<string, string> = {};
    if (!passwords.current) errs.current = 'Current password is required';
    if (!passwords.newPass) errs.newPass = 'New password is required';
    else if (passwords.newPass.length < 8) errs.newPass = 'Min 8 characters required';
    else if (!/[A-Z]/.test(passwords.newPass)) errs.newPass = 'Must include at least one uppercase letter';
    else if (!/[0-9]/.test(passwords.newPass)) errs.newPass = 'Must include at least one number';
    else if (!/[^A-Za-z0-9]/.test(passwords.newPass)) errs.newPass = 'Must include at least one symbol';
    if (!passwords.confirm) errs.confirm = 'Please confirm your password';
    else if (passwords.newPass && passwords.newPass !== passwords.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true); setPwMsg(null);
    try {
      await profileApi.changePassword('seller', {
        user_id: userId, current_password: passwords.current, new_password: passwords.newPass,
      });
      setPwMsg({ ok: true, text: 'Password updated!' });
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (e: unknown) {
      setPwMsg({ ok: false, text: (e as Error).message || 'Failed to update' });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 3000);
    }
  };

  return (
    <DashboardLayout role="SELLER" title="My Account">
      <div className="space-y-5">

        {/* Banner Card */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden">
          <div className="relative h-32 w-full" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
            <div className="absolute -bottom-10 left-8 h-20 w-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center bg-[#e84545]">
              <span className="text-white text-2xl font-bold">{loading ? '...' : initials}</span>
            </div>
          </div>
          <div className="px-8 pb-5 pt-14">
            <h2 className="text-xl font-bold text-gray-900">{form.name || '--'}</h2>
            <p className="text-sm text-gray-500">{form.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#4f9ef8] border border-blue-200">
              <i className="fa fa-briefcase" /> Seller
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e8e8] shadow-sm p-1 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              )}>
              <i className={`fa ${t.icon}`} />{t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa fa-user text-[#e84545]" /> Personal Information
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400"><i className="fa fa-spinner fa-spin text-2xl" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input className={inputCls + ' bg-gray-50 cursor-not-allowed'} type="email"
                    value={form.email} readOnly title="Email cannot be changed" />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inputCls} value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="City, Country" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Bio</label>
                  <textarea className={inputCls + ' resize-none py-3'} rows={3} value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell buyers about yourself..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button onClick={saveProfile} disabled={profSaving}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                    {profSaving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> Save Profile</>}
                  </button>
                  {profMsg && (
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${profMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      <i className={`fa ${profMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {profMsg.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Professional Tab ────────────────────────────────────── */}
        {activeTab === 'professional' && (
          <div className="space-y-5">

            {/* Skills & Rates */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fa fa-star text-[#e84545]" /> Skills &amp; Rates
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-400"><i className="fa fa-spinner fa-spin text-2xl" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Skills */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input className={inputCls} placeholder="e.g. Video Editing"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                      <button onClick={addSkill}
                        className="px-4 py-2.5 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition whitespace-nowrap">
                        + Add
                      </button>
                    </div>
                    {profForm.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profForm.skills.map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#e84545] text-xs font-semibold border border-red-200">
                            {s}
                            <button onClick={() => removeSkill(s)} className="hover:text-red-700 ml-0.5">
                              <i className="fa fa-times text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Hourly Rate (₹)</label>
                    <input className={inputCls} type="number" min="0" placeholder="e.g. 500"
                      value={profForm.hourly_rate}
                      onChange={e => setProfForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelCls}>City</label>
                    <input className={inputCls} placeholder="e.g. Mumbai"
                      value={profForm.city}
                      onChange={e => setProfForm(f => ({ ...f, city: e.target.value }))} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>Country</label>
                    <input className={inputCls} placeholder="e.g. India"
                      value={profForm.country}
                      onChange={e => setProfForm(f => ({ ...f, country: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {/* Resume */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fa fa-file-text text-[#e84545]" /> Resume
              </h3>

              {/* Upload button */}
              <div className="mb-3">
                <label className={labelCls}>Upload File (PDF / DOC / DOCX, max 10 MB)</label>
                <label className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#e84545] text-[#e84545] text-sm font-semibold cursor-pointer hover:bg-red-50 transition',
                  resumeUploading && 'opacity-60 pointer-events-none'
                )}>
                  {resumeUploading
                    ? <><i className="fa fa-spinner fa-spin" /> Uploading...</>
                    : <><i className="fa fa-upload" /> Choose File &amp; Upload</>}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeFile} />
                </label>
              </div>

              {/* Manual URL fallback */}
              <label className={labelCls}>Or paste URL (Google Drive / Dropbox / S3)</label>
              <input className={inputCls} type="url"
                placeholder="https://drive.google.com/..."
                value={profForm.resume}
                onChange={e => setProfForm(f => ({ ...f, resume: e.target.value }))} />

              {profForm.resume && (
                <a href={profForm.resume} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#e84545] hover:underline font-medium">
                  <i className="fa fa-external-link" /> View Resume
                </a>
              )}
            </div>

            {/* Portfolio Links */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fa fa-globe text-[#e84545]" /> Portfolio Links
              </h3>
              <label className={labelCls}>Add Portfolio URL</label>
              <div className="flex gap-2 mb-3">
                <input className={inputCls} type="url"
                  placeholder="https://your-portfolio.com"
                  value={portfolioInput}
                  onChange={e => setPortfolioInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPortfolio(); } }} />
                <button onClick={addPortfolio}
                  className="px-4 py-2.5 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition whitespace-nowrap">
                  + Add
                </button>
              </div>
              {profForm.portfolio_links.length === 0 ? (
                <p className="text-xs text-gray-400">No portfolio links added yet.</p>
              ) : (
                <div className="space-y-2">
                  {profForm.portfolio_links.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <i className="fa fa-link text-[#e84545] text-sm flex-shrink-0" />
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-sm text-blue-600 hover:underline truncate">{url}</a>
                      <button onClick={() => removePortfolio(url)}
                        className="text-gray-400 hover:text-red-500 transition flex-shrink-0">
                        <i className="fa fa-trash text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button onClick={saveProfessional} disabled={proSaving}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                {proSaving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> Save Professional Profile</>}
              </button>
              {proMsg && (
                <span className={`flex items-center gap-1.5 text-sm font-medium ${proMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  <i className={`fa ${proMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {proMsg.text}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Security Tab ────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <i className="fa fa-lock text-[#e84545]" /> Change Password
            </h3>
            <p className="text-xs text-gray-400 mb-5">Keep your account secure with a strong password</p>
            <div className="space-y-4">
              {[
                { key: 'current', label: 'Current Password', show: showCur, toggle: () => setShowCur(v => !v) },
                { key: 'newPass', label: 'New Password',     show: showNew, toggle: () => setShowNew(v => !v) },
                { key: 'confirm', label: 'Confirm Password', show: showCon, toggle: () => setShowCon(v => !v) },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <div className="relative">
                    <input
                      className={inputCls + ' pr-10' + (pwErrors[f.key] ? ' border-red-400 focus:border-red-400 focus:ring-red-400' : '')}
                      type={f.show ? 'text' : 'password'} placeholder={f.label}
                      value={passwords[f.key as keyof typeof passwords]}
                      onChange={e => { setPasswords(p => ({ ...p, [f.key]: e.target.value })); setPwErrors(p => { const n = {...p}; delete n[f.key]; return n; }); }} />
                    <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i className={`fa ${f.show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {pwErrors[f.key] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fa fa-times-circle" /> {pwErrors[f.key]}
                    </p>
                  )}
                </div>
              ))}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                <i className="fa fa-info-circle mr-1.5" />Use at least 8 characters including uppercase, numbers, and symbols.
              </div>
              {pwMsg && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${pwMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <i className={`fa ${pwMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {pwMsg.text}
                </div>
              )}
              <div className="pt-1">
                <button onClick={savePassword} disabled={pwSaving}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                  {pwSaving ? <><i className="fa fa-spinner fa-spin" /> Updating...</> : <><i className="fa fa-shield" /> Update Password</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

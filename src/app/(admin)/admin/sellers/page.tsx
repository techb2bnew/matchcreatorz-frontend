'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { getProfileStatusColor, formatDate, formatCurrency } from '@/lib/utils';
import { sellerApi, categoryApi } from '@/lib/adminApi';
import { TableSkeleton, Spinner } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

const COUNTRIES  = ['India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Singapore', 'Germany'];
const STATES     = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];
const RANGES     = ['$500-$1,000/project', '$1,000-$5,000/project', '$5,000-$15,000/project', '$15,000-$50,000/project', '$50,000+/project'];
const RESP_TIMES = ['Within 1 hour', 'Within 6 hours', 'Within 24 hours', 'Within 48 hours', 'Within a week'];

const selectCls = 'w-full h-11 border border-gray-200 rounded-xl px-3 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#e84545]/30 focus:border-[#e84545] bg-white transition appearance-none';
const labelCls  = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

const MODAL_STEPS = [
  { label: 'Account', icon: 'fa-user' },
  { label: 'Profile', icon: 'fa-id-card' },
  { label: 'Portfolio', icon: 'fa-picture-o' },
];

const emptyForm = {
  name: '', email: '', phone: '', password: '', countryCode: '+91',
  dob: '', gender: 'Male', range: RANGES[0], hourlyRate: '',
  country: 'India', state: 'Delhi', city: '', zip: '',
  tags: [] as string[], bio: '', responseTime: RESP_TIMES[2],
  portfolioLinks: '',
};

// Map backend seller -> display shape
const mapSeller = (s: any) => ({
  id:          s.id,
  name:        s.name,
  email:       s.email,
  phone:       s.phone || '--',
  category:    s.profile?.skills?.[0] || '--',
  hourlyRate:  s.profile?.hourly_rate || 0,
  rating:      s.profile?.rating || 0,
  jobs:        0,
  earnings:    0,
  status:      (s.profile?.approval_status || 'pending').toUpperCase(),
  userStatus:  s.status,
  joined:      s.joined || s.createdAt,
  city:        s.profile?.city || '--',
  country:     s.profile?.country || '--',
  bio:         s.profile?.bio || '',
  skills:      s.profile?.skills || [],
  raw:         s,
});

export default function SellersPage() {
  const [sellers, setSellers]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const LIMIT = 10;

  // -- Categories from API (used as tag chips) ---------------
  const [categoryTags, setCategoryTags] = useState<string[]>([]);

  useEffect(() => {
    categoryApi.list({ page: 1, limit: 100 })
      .then(json => setCategoryTags((json.data || []).map((c: any) => c.name)))
      .catch(() => {/* fallback to empty */});
  }, []);

  const [showAdd, setShowAdd]       = useState(false);
  const [addStep, setAddStep]       = useState(1);
  const [form, setForm]             = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [viewSeller, setViewSeller] = useState<any | null>(null);

  // -- Edit state --------------------------------------------
  const [editSeller, setEditSeller] = useState<any | null>(null);
  const [editForm, setEditForm]     = useState({ name: '', phone: '', countryCode: '+91', bio: '', city: '', country: 'India', hourlyRate: '', tags: [] as string[] });
  const [editLoading, setEditLoading] = useState(false);

  // -- Validation errors -------------------------------------
  const [addErrs, setAddErrs]   = useState<Record<string, string>>({});
  const [editErrs, setEditErrs] = useState<Record<string, string>>({});

  const toggleTag = (t: string) => setForm(f => ({
    ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
  }));

  // -- Debounce search (400ms) -------------------------------
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // -- Fetch sellers -----------------------------------------
  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (activeFilter !== 'All') {
        params.approval_status = activeFilter.toLowerCase();
      }

      const json = await sellerApi.list(params);
      setSellers((json.data || []).map(mapSeller));
      setTotal(json.meta?.total || 0);
      setTotalPages(json.meta?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);
  useEffect(() => { setPage(1); }, [activeFilter]);

  // -- Actions -----------------------------------------------
  const handleAction = async (id: number, action: 'approve' | 'reject' | 'block' | 'unblock', label: string) => {
    setActionLoading(id);
    try {
      await sellerApi[action](id);
      toast.success(`Seller ${label} successfully`);
      fetchSellers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // -- Add seller --------------------------------------------
  const handleAdd = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                           e.name     = 'Name is required';
    if (!form.email.trim())                          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))      e.email    = 'Enter a valid email address';
    if (!form.password)                              e.password = 'Password is required';
    else if (form.password.length < 6)               e.password = 'Minimum 6 characters';
    if (form.phone && !/^\d{7,10}$/.test(form.phone)) e.phone  = 'Enter valid digits (7-10)';
    if (Object.keys(e).length) { setAddErrs(e); if (addStep !== 1) setAddStep(1); return; }
    setAddErrs({});
    setAddLoading(true);
    try {
      await sellerApi.add({
        name:        form.name,
        email:       form.email,
        password:    form.password,
        phone:       form.phone ? form.countryCode + form.phone : undefined,
        bio:         form.bio   || undefined,
        skills:      form.tags.length ? form.tags : undefined,
        hourly_rate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        city:        form.city    || undefined,
        country:     form.country || undefined,
      });
      toast.success('Seller added successfully');
      setForm(emptyForm);
      setAddErrs({});
      setAddStep(1);
      setShowAdd(false);
      fetchSellers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add seller');
    } finally {
      setAddLoading(false);
    }
  };

  const closeAdd = () => { setShowAdd(false); setAddStep(1); setForm(emptyForm); setAddErrs({}); };

  // -- Split stored phone into code + digits -----------------
  const splitPhone = (full: string) => {
    const codes = ['+971', '+966', '+65', '+61', '+44', '+91', '+1'];
    for (const c of codes) {
      if (full.startsWith(c)) return { countryCode: c, phone: full.slice(c.length) };
    }
    return { countryCode: '+91', phone: full };
  };

  // -- Open edit ---------------------------------------------
  const openEdit = (s: any) => {
    setEditSeller(s);
    const { countryCode, phone } = s.phone && s.phone !== '--' ? splitPhone(s.phone) : { countryCode: '+91', phone: '' };
    setEditForm({
      name:       s.name,
      phone,
      countryCode,
      bio:        s.bio || '',
      city:       s.city === '--' ? '' : s.city,
      country:    s.country === '--' ? 'India' : s.country,
      hourlyRate: s.hourlyRate ? String(s.hourlyRate) : '',
      tags:       [...(s.skills || [])],
    });
  };

  const toggleEditTag = (t: string) => setEditForm(f => ({
    ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
  }));

  const handleEdit = async () => {
    if (!editSeller) return;
    const e: Record<string, string> = {};
    if (!editForm.name.trim())                                   e.name  = 'Name is required';
    if (editForm.phone && !/^\d{7,10}$/.test(editForm.phone)) e.phone = 'Enter valid digits (7-10)';
    if (editForm.hourlyRate && isNaN(Number(editForm.hourlyRate))) e.hourlyRate = 'Must be a number';
    if (Object.keys(e).length) { setEditErrs(e); return; }
    setEditErrs({});
    setEditLoading(true);
    try {
      await sellerApi.edit(editSeller.id, {
        name:        editForm.name      || undefined,
        phone:       editForm.phone ? editForm.countryCode + editForm.phone : undefined,
        bio:         editForm.bio       || undefined,
        city:        editForm.city      || undefined,
        country:     editForm.country   || undefined,
        hourly_rate: editForm.hourlyRate ? Number(editForm.hourlyRate) : undefined,
        skills:      editForm.tags.length ? editForm.tags : undefined,
      });
      toast.success('Seller updated successfully');
      setEditErrs({});
      setEditSeller(null);
      fetchSellers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update seller');
    } finally {
      setEditLoading(false);
    }
  };

  const pagesArr = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <DashboardLayout role="ADMIN" title="Sellers">
      <Card padding="none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input placeholder="Search sellers..." leftIcon={<i className="fa fa-search text-gray-400 text-sm" />}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['All', 'Approved', 'Pending', 'Rejected'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm">
              <i className="fa fa-user-plus text-sm" /> Add Seller
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={7} cols={6} />
          ) : sellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <i className="fa fa-users text-3xl mb-2" />
              <p className="text-sm">No sellers found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Seller', 'Skills', 'Hourly Rate', 'Rating', 'Status', 'User Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sellers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">{s.skills.slice(0, 2).join(', ') || '--'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {s.hourlyRate ? `$${s.hourlyRate}` : '--'}<span className="text-xs font-normal text-gray-400">{s.hourlyRate ? '/hr' : ''}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-600 font-medium">
                        <i className="fa fa-star text-yellow-400 text-xs" />{s.rating || '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getProfileStatusColor(s.status)}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.userStatus === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {s.userStatus === 'banned' ? 'BLOCKED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.joined)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button onClick={() => setViewSeller(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition" title="View">
                          <i className="fa fa-eye text-sm" />
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit">
                          <i className="fa fa-pencil text-sm" />
                        </button>
                        {/* Approve */}
                        {s.status !== 'APPROVED' && (
                          <button onClick={() => handleAction(s.id, 'approve', 'approved')}
                            disabled={actionLoading === s.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition" title="Approve">
                            {actionLoading === s.id ? <Spinner size="xs" color="gray" /> : <i className="fa fa-check-circle text-sm" />}
                          </button>
                        )}
                        {/* Reject */}
                        {s.status !== 'REJECTED' && (
                          <button onClick={() => handleAction(s.id, 'reject', 'rejected')}
                            disabled={actionLoading === s.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition" title="Reject">
                            <i className="fa fa-times-circle text-sm" />
                          </button>
                        )}
                        {/* Block / Unblock */}
                        {s.userStatus === 'banned' ? (
                          <button onClick={() => handleAction(s.id, 'unblock', 'unblocked')}
                            disabled={actionLoading === s.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition" title="Unblock">
                            <i className="fa fa-unlock text-sm" />
                          </button>
                        ) : (
                          <button onClick={() => handleAction(s.id, 'block', 'blocked')}
                            disabled={actionLoading === s.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Block">
                            <i className="fa fa-ban text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-400">Showing {sellers.length} of {total} sellers</p>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {pagesArr.map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* -- Add Seller Modal ----------------------------------- */}
      <Modal isOpen={showAdd} onClose={closeAdd} title="Add New Seller" size="lg">
        {/* Step bar */}
        <div className="mb-5">
          <div className="flex items-center mb-3">
            {MODAL_STEPS.map((s, i) => {
              const n = i + 1; const done = addStep > n; const active = addStep === n;
              return (
                <div key={s.label} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-0.5 transition-colors ${done || active ? 'bg-[#e84545]' : 'bg-[#e8e8e8]'}`} />}
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm flex-shrink-0 ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-[#e84545] border-[#e84545] text-white' : 'bg-white border-[#d8d8d8] text-gray-400'}`}>
                      {done ? <i className="fa fa-check text-xs" /> : <span>{n}</span>}
                    </div>
                    {i < MODAL_STEPS.length - 1 && <div className={`flex-1 h-0.5 transition-colors ${addStep > n + 1 ? 'bg-[#e84545]' : 'bg-[#e8e8e8]'}`} />}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 ${active ? 'text-[#e84545]' : done ? 'text-green-500' : 'text-gray-400'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-[54vh] overflow-y-auto pr-1 -mr-1">

          {/* Step 1 -- Account */}
          {addStep === 1 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-user text-[#e84545] text-[9px]" /></div>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Account Details</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full Name *" placeholder="John Doe" value={form.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setAddErrs(p => ({ ...p, name: '' })); }}
                    error={addErrs.name} />
                  <Input label="Email Address *" type="email" placeholder="seller@email.com" value={form.email}
                    onChange={e => { setForm({ ...form, email: e.target.value }); setAddErrs(p => ({ ...p, email: '' })); }}
                    error={addErrs.email} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="flex gap-2">
                  <div className="w-[110px] flex-shrink-0">
                    <CustomSelect value={form.countryCode} onChange={v => setForm({ ...form, countryCode: v })} options={['+91', '+1', '+44', '+61', '+971']} />
                  </div>
                  <div className="flex-1">
                    <Input type="tel" placeholder="9876543210" maxLength={10} value={form.phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: v }); setAddErrs(p => ({ ...p, phone: '' })); }} />
                  </div>
                </div>
                {addErrs.phone && <p className="text-xs text-red-500">{addErrs.phone}</p>}
              </div>
              <Input label="Password *" type="password" placeholder="Set a temporary password" value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setAddErrs(p => ({ ...p, password: '' })); }}
                error={addErrs.password} />
            </div>
          )}

          {/* Step 2 -- Profile */}
          {addStep === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-briefcase text-[#e84545] text-[9px]" /></div>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Professional Info</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect label="Price Range" leftIcon="fa-tag" value={form.range} onChange={v => setForm({ ...form, range: v })} options={RANGES} />
                  <div>
                    <label className={labelCls}>Hourly Rate ($)</label>
                    <div className="relative">
                      <i className="fa fa-clock-o absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input type="number" min="0" placeholder="e.g. 500" className={selectCls + ' pl-8'} value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <div className="relative">
                      <i className="fa fa-birthday-cake absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input type="date" className={selectCls + ' pl-8'} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                    </div>
                  </div>
                  <CustomSelect label="Gender" leftIcon="fa-user-circle" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
                  <div className="col-span-2">
                    <CustomSelect label="Response Time" leftIcon="fa-clock-o" value={form.responseTime} onChange={v => setForm({ ...form, responseTime: v })} options={RESP_TIMES} />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-map-marker text-[#e84545] text-[9px]" /></div>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Location</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect label="Country" leftIcon="fa-globe" value={form.country} onChange={v => setForm({ ...form, country: v })} options={COUNTRIES} />
                  <CustomSelect label="State" leftIcon="fa-map-o" value={form.state} onChange={v => setForm({ ...form, state: v })} options={STATES} />
                  <div>
                    <label className={labelCls}>City</label>
                    <div className="relative">
                      <i className="fa fa-building-o absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input className={selectCls + ' pl-8'} placeholder="Enter city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Zip Code</label>
                    <div className="relative">
                      <i className="fa fa-hashtag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input className={selectCls + ' pl-8'} placeholder="ZIP / PIN code" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-star text-[#e84545] text-[9px]" /></div>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Skills & Bio</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="mb-3">
                  <label className={labelCls}>Tags / Skills</label>
                  <div className="p-3 bg-[#fafafa] rounded-xl border border-[#e8e8e8]">
                    {categoryTags.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No categories yet -- add them from the Categories page.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {categoryTags.map(t => (
                          <button key={t} type="button" onClick={() => toggleTag(t)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.tags.includes(t) ? 'bg-[#e84545] border-[#e84545] text-white shadow-sm' : 'bg-white border-[#d8d8d8] text-gray-500 hover:border-[#e84545] hover:text-[#e84545]'}`}>
                            {form.tags.includes(t) && <i className="fa fa-check text-[8px]" />}{t}
                          </button>
                        ))}
                      </div>
                    )}
                    {form.tags.length > 0 && <p className="text-[10px] text-[#e84545] mt-2 font-semibold"><i className="fa fa-check-circle mr-1" />{form.tags.length} skill{form.tags.length !== 1 ? 's' : ''} selected</p>}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea className="w-full bg-white border border-[#d8d8d8] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e84545] resize-none h-20 transition placeholder:text-gray-400"
                    placeholder="Brief description about the seller's expertise..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 -- Portfolio */}
          {addStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <i className="fa fa-picture-o text-blue-400 text-sm flex-shrink-0" />
                <p className="text-xs text-blue-600">Add portfolio links to showcase the seller's best work</p>
              </div>
              <div>
                <label className={labelCls}>Portfolio Links</label>
                <div className="relative">
                  <i className="fa fa-link absolute left-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
                  <textarea className="w-full bg-[#fafafa] border border-[#d8d8d8] rounded-xl pl-8 pr-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e84545] resize-none h-28 transition placeholder:text-gray-400"
                    placeholder={`https://behance.net/username\nhttps://dribbble.com/username`}
                    value={form.portfolioLinks} onChange={e => setForm({ ...form, portfolioLinks: e.target.value })} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1"><i className="fa fa-lightbulb-o text-yellow-400" /> Enter one URL per line</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div>{addStep > 1 && <Button variant="outline" onClick={() => setAddStep(s => s - 1)}><i className="fa fa-arrow-left mr-1.5" /> Back</Button>}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeAdd}>Cancel</Button>
            {addStep < 3
              ? <Button onClick={() => setAddStep(s => s + 1)}>Next <i className="fa fa-arrow-right ml-1.5" /></Button>
              : <Button onClick={handleAdd} loading={addLoading}><i className="fa fa-check mr-1.5" /> Add Seller</Button>
            }
          </div>
        </div>
      </Modal>

      {/* View Seller Modal */}
      {viewSeller && (
        <Modal isOpen={!!viewSeller} onClose={() => setViewSeller(null)} title="Seller Details" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={viewSeller.name} size="lg" />
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewSeller.name}</p>
                <p className="text-sm text-gray-400">{viewSeller.email}</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getProfileStatusColor(viewSeller.status)}`}>{viewSeller.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="font-medium">{viewSeller.phone}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Hourly Rate</p><p className="font-medium">{viewSeller.hourlyRate ? `$${viewSeller.hourlyRate}/hr` : '--'}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Rating</p><p className="font-medium flex items-center gap-1"><i className="fa fa-star text-yellow-400 text-xs" />{viewSeller.rating || '--'}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Joined</p><p className="font-medium">{formatDate(viewSeller.joined)}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Country</p><p className="font-medium">{viewSeller.country}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">City</p><p className="font-medium">{viewSeller.city}</p></div>
            </div>
            {viewSeller.skills?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewSeller.skills.map((sk: string) => (
                    <span key={sk} className="px-2.5 py-0.5 bg-red-50 text-[#e84545] text-xs rounded-full font-medium">{sk}</span>
                  ))}
                </div>
              </div>
            )}
            {viewSeller.bio && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Bio</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewSeller.bio}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* -- Edit Seller Modal ----------------------------------- */}
      {editSeller && (
        <Modal isOpen={!!editSeller} onClose={() => { setEditSeller(null); setEditErrs({}); }} title={`Edit -- ${editSeller.name}`} size="lg">
          <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-5">

            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-user text-[#e84545] text-[9px]" /></div>
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Basic Info</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" value={editForm.name}
                  onChange={e => { setEditForm({ ...editForm, name: e.target.value }); setEditErrs(p => ({ ...p, name: '' })); }}
                  error={editErrs.name} />
                <Input label="Email" value={editSeller?.email || ''} disabled
                  hint="Email cannot be changed" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="flex gap-2">
                  <div className="w-[110px] flex-shrink-0">
                    <CustomSelect value={editForm.countryCode} onChange={v => setEditForm({ ...editForm, countryCode: v })} options={['+91', '+1', '+44', '+61', '+971']} />
                  </div>
                  <div className="flex-1">
                    <Input type="tel" placeholder="9876543210" maxLength={10} value={editForm.phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setEditForm({ ...editForm, phone: v }); setEditErrs(p => ({ ...p, phone: '' })); }} />
                  </div>
                </div>
                {editErrs.phone && <p className="text-xs text-red-500">{editErrs.phone}</p>}
              </div>
            </div>

            {/* Professional */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"><i className="fa fa-briefcase text-[#e84545] text-[9px]" /></div>
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Professional Info</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hourly Rate ($)</label>
                  <div className="relative">
                    <i className="fa fa-clock-o absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <input type="number" min="0" className={selectCls + ' pl-8'} value={editForm.hourlyRate}
                      onChange={e => { setEditForm({ ...editForm, hourlyRate: e.target.value }); setEditErrs(p => ({ ...p, hourlyRate: '' })); }} />
                  </div>
                  {editErrs.hourlyRate && <p className="text-xs text-red-500 mt-1">{editErrs.hourlyRate}</p>}
                </div>
                <CustomSelect label="Country" leftIcon="fa-globe" value={editForm.country} onChange={v => setEditForm({ ...editForm, country: v })} options={COUNTRIES} />
                <div className="col-span-2">
                  <Input label="City" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className={labelCls}>Skills</label>
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#e8e8e8]">
                {categoryTags.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No categories yet -- add them from the Categories page.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {categoryTags.map(t => (
                      <button key={t} type="button" onClick={() => toggleEditTag(t)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${editForm.tags.includes(t) ? 'bg-[#e84545] border-[#e84545] text-white' : 'bg-white border-[#d8d8d8] text-gray-500 hover:border-[#e84545] hover:text-[#e84545]'}`}>
                        {editForm.tags.includes(t) && <i className="fa fa-check text-[8px]" />}{t}
                      </button>
                    ))}
                  </div>
                )}
                {editForm.tags.length > 0 && <p className="text-[10px] text-[#e84545] mt-2 font-semibold"><i className="fa fa-check-circle mr-1" />{editForm.tags.length} skill{editForm.tags.length !== 1 ? 's' : ''} selected</p>}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className={labelCls}>Bio</label>
              <textarea className="w-full bg-white border border-[#d8d8d8] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e84545] resize-none h-20 transition placeholder:text-gray-400"
                placeholder="Brief description..." value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => { setEditSeller(null); setEditErrs({}); }}>Cancel</Button>
            <Button onClick={handleEdit} loading={editLoading}><i className="fa fa-save mr-1.5" /> Save Changes</Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal           from '@/components/ui/Modal';
import Button          from '@/components/ui/Button';
import { cn }          from '@/lib/utils';
import { buyerJobApi, publicCategoryApi } from '@/lib/adminApi';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';
import RichTextEditor from '@/components/ui/RichTextEditor';

type Tab = 'posted' | 'post';
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'posted', label: 'My Posted Jobs', icon: 'fa-briefcase' },
  { key: 'post',   label: 'Post New Job',   icon: 'fa-plus'      },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:        { label: 'Open',        bg: '#d1fae5', color: '#059669' },
  IN_PROGRESS: { label: 'In Progress', bg: '#dbeafe', color: '#2563eb' },
  CLOSED:      { label: 'Closed',      bg: '#f3f4f6', color: '#6b7280' },
  CANCELLED:   { label: 'Cancelled',   bg: '#fef2f2', color: '#e84545' },
};

const EXP_OPTIONS = [
  { value: 'any',          label: 'Any Level'    },
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert',       label: 'Expert'       },
];

interface Job {
  id: number; title: string; description: string; category: string;
  job_type: string; budget_min: number | null; budget_max: number | null;
  deadline: string | null; skills: string[]; experience_level: string;
  status: string; bids_count: number; created_at: string;
}

interface FormState {
  title: string; description: string; category: string[];
  job_type: string; budget_min: string; budget_max: string;
  deadline: string; skills: string; experience_level: string;
}
const EMPTY: FormState = {
  title: '', description: '', category: [],
  job_type: 'fixed', budget_min: '', budget_max: '',
  deadline: '', skills: '', experience_level: 'any',
};

function BudgetDisplay({ min, max }: { min: number | null; max: number | null }) {
  if (!min && !max) return <span className="text-gray-400 text-xs">Not specified</span>;
  if (min && max)   return <span>${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}</span>;
  if (min)          return <span>From ${Number(min).toLocaleString()}</span>;
  return <span>Up to ${Number(max).toLocaleString()}</span>;
}

export default function BuyerJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('posted');
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);   // only true on first load
  const [refreshing, setRefreshing] = useState(false); // silent background refresh
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;
  const firstLoad = useRef(true);
  const [categories, setCategories] = useState<string[]>(['Design', 'Development', 'Marketing', 'Writing', 'Video', 'Photography', 'Music', 'Animation']);

  // Form
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [formErrors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [postMsg, setPostMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Edit modal
  const [editJob, setEditJob]   = useState<Job | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Close confirm
  const [closeTarget, setCloseTarget]   = useState<Job | null>(null);
  const [closing, setClosing]           = useState(false);

  const loadJobs = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search.trim())  params.search = search.trim();
      if (statusFilter)   params.status = statusFilter;
      const res = await buyerJobApi.list(params);
      setJobs(res.data || []);
      setTotalPages(res.meta?.totalPages || res.pagination?.pages || 1);
    } catch { setJobs([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, search, statusFilter]);

  useEffect(() => {
    publicCategoryApi.list()
      .then(r => { if (r.data?.length) setCategories(r.data.map((c: { name: string }) => c.name)); })
      .catch(() => {});
  }, []);

  // Reset to first page whenever the search/filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // Load jobs (skeleton on first load, silent refresh after)
  useEffect(() => {
    const t = setTimeout(() => {
      loadJobs(!firstLoad.current);
      firstLoad.current = false;
    }, firstLoad.current ? 0 : 300);
    return () => clearTimeout(t);
  }, [loadJobs]);

  // Stats
  const total      = jobs.length;
  const open       = jobs.filter(j => j.status === 'OPEN').length;
  const inProgress = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const totalBids  = jobs.reduce((s, j) => s + (j.bids_count || 0), 0);

  const stats = [
    { label: 'Total Posted', val: String(total),      icon: 'fa-briefcase',   color: '#e84545', bg: '#fef2f2' },
    { label: 'Open',         val: String(open),        icon: 'fa-circle',      color: '#10b981', bg: '#ecfdf5' },
    { label: 'In Progress',  val: String(inProgress),  icon: 'fa-spinner',     color: '#4f9ef8', bg: '#eff6ff' },
    { label: 'Total Bids',   val: String(totalBids),   icon: 'fa-gavel',       color: '#f59e0b', bg: '#fffbeb' },
  ];

  // Post job
  const validateForm = (f: FormState) => {
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs.title = 'Job title is required';
    if (f.budget_min && f.budget_max && Number(f.budget_min) > Number(f.budget_max))
      errs.budget_max = 'Max must be greater than min';
    return errs;
  };

  const handlePost = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true); setPostMsg(null);
    try {
      await buyerJobApi.create({
        title:            form.title.trim(),
        description:      form.description || undefined,
        category:         form.category.join(', ') || 'General',
        job_type:         form.job_type,
        budget_min:       form.budget_min ? Number(form.budget_min) : undefined,
        budget_max:       form.budget_max ? Number(form.budget_max) : undefined,
        deadline:         form.deadline   || undefined,
        skills:           form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_level: form.experience_level,
      });
      setPostMsg({ ok: true, text: 'Job posted successfully!' });
      setForm(EMPTY);
      await loadJobs(true);
      setTimeout(() => { setPostMsg(null); setActiveTab('posted'); }, 1500);
    } catch (e: unknown) {
      setPostMsg({ ok: false, text: (e as Error).message || 'Failed to post job' });
    } finally { setSaving(false); }
  };

  // Edit job
  const openEdit = (job: Job) => {
    setEditJob(job);
    setEditForm({
      title:            job.title,
      description:      job.description || '',
      category:         job.category ? job.category.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      job_type:         job.job_type,
      budget_min:       job.budget_min != null ? String(job.budget_min) : '',
      budget_max:       job.budget_max != null ? String(job.budget_max) : '',
      deadline:         job.deadline   || '',
      skills:           Array.isArray(job.skills) ? job.skills.join(', ') : '',
      experience_level: job.experience_level,
    });
    setEditMsg(null);
  };

  const handleEdit = async () => {
    if (!editJob) return;
    const errs = validateForm(editForm);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setEditSaving(true); setEditMsg(null);
    try {
      await buyerJobApi.update(editJob.id, {
        title:            editForm.title.trim(),
        description:      editForm.description || undefined,
        category:         editForm.category.join(', ') || 'General',
        job_type:         editForm.job_type,
        budget_min:       editForm.budget_min ? Number(editForm.budget_min) : undefined,
        budget_max:       editForm.budget_max ? Number(editForm.budget_max) : undefined,
        deadline:         editForm.deadline   || undefined,
        skills:           editForm.skills ? editForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_level: editForm.experience_level,
      });
      setEditMsg({ ok: true, text: 'Job updated!' });
      await loadJobs(true);
      setTimeout(() => setEditJob(null), 1000);
    } catch (e: unknown) {
      setEditMsg({ ok: false, text: (e as Error).message || 'Failed to update' });
    } finally { setEditSaving(false); }
  };

  // Close job
  const handleClose = async () => {
    if (!closeTarget) return;
    setClosing(true);
    try {
      await buyerJobApi.close(closeTarget.id);
      setCloseTarget(null);
      await loadJobs(true);
    } catch { /* ignore */ }
    finally { setClosing(false); }
  };

  // Delete job
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await buyerJobApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadJobs(true);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  // Shared form renderer
  const renderForm = (f: FormState, setF: (fn: (p: FormState) => FormState) => void, errs: Record<string, string>) => (
    <div className="space-y-4">
      <div>
        <label className={labelCls}><i className="fa fa-pencil mr-1 text-[#e84545]" /> Job Title <span className="text-red-500">*</span></label>
        <input className={inputCls + (errs.title ? ' border-red-400' : '')} value={f.title}
          onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Logo Design for My Startup" />
        {errs.title && <p className="mt-1 text-xs text-red-500"><i className="fa fa-times-circle mr-1" />{errs.title}</p>}
      </div>

      <div>
        <label className={labelCls}><i className="fa fa-align-left mr-1 text-[#e84545]" /> Description</label>
        <RichTextEditor
          variant="full"
          placeholder="Describe what you need, including requirements, references..."
          value={f.description}
          onChange={html => setF(p => ({ ...p, description: html }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}><i className="fa fa-tag mr-1 text-[#e84545]" /> Category <span className="text-gray-400 normal-case font-normal">(select multiple)</span></label>
          <div className="flex flex-wrap gap-2 p-3 border border-[#e8e8e8] rounded-xl bg-white min-h-[46px]">
            {categories.map(cat => {
              const selected = f.category.includes(cat);
              return (
                <button key={cat} type="button"
                  onClick={() => setF(p => ({ ...p, category: selected ? p.category.filter(c => c !== cat) : [...p.category, cat] }))}
                  className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
                    selected ? 'bg-[#e84545] text-white border-[#e84545]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#e84545] hover:text-[#e84545]'
                  )}>
                  {selected && <i className="fa fa-check mr-1 text-[10px]" />}{cat}
                </button>
              );
            })}
          </div>
          {f.category.length === 0 && <p className="mt-1 text-xs text-gray-400">Select at least one category</p>}
        </div>
        <div>
          <label className={labelCls}><i className="fa fa-clock-o mr-1 text-[#e84545]" /> Job Type</label>
          <CustomSelect
            value={f.job_type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
            onChange={val => setF(p => ({ ...p, job_type: val === 'Fixed Price' ? 'fixed' : 'hourly' }))}
            options={['Fixed Price', 'Hourly Rate']}
            leftIcon="fa-clock-o"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            <i className="fa fa-dollar mr-1 text-[#10b981]" />
            {f.job_type === 'hourly' ? 'Min Rate ($/hr)' : 'Budget Min ($)'}
          </label>
          <input className={inputCls} type="number" min="0" value={f.budget_min}
            onChange={e => setF(p => ({ ...p, budget_min: e.target.value }))}
            placeholder={f.job_type === 'hourly' ? '25' : '500'} />
        </div>
        <div>
          <label className={labelCls}>
            <i className="fa fa-dollar mr-1 text-[#10b981]" />
            {f.job_type === 'hourly' ? 'Max Rate ($/hr)' : 'Budget Max ($)'}
          </label>
          <input className={inputCls + (errs.budget_max ? ' border-red-400' : '')} type="number" min="0" value={f.budget_max}
            onChange={e => setF(p => ({ ...p, budget_max: e.target.value }))}
            placeholder={f.job_type === 'hourly' ? '150' : '5000'} />
          {errs.budget_max && <p className="mt-1 text-xs text-red-500"><i className="fa fa-times-circle mr-1" />{errs.budget_max}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}><i className="fa fa-calendar mr-1 text-[#4f9ef8]" /> Deadline</label>
          <input className={inputCls} type="date" value={f.deadline} onChange={e => setF(p => ({ ...p, deadline: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}><i className="fa fa-graduation-cap mr-1 text-[#f59e0b]" /> Experience Level</label>
          <CustomSelect
            value={EXP_OPTIONS.find(o => o.value === f.experience_level)?.label || 'Any Level'}
            onChange={val => setF(p => ({ ...p, experience_level: EXP_OPTIONS.find(o => o.label === val)?.value || 'any' }))}
            options={EXP_OPTIONS.map(o => o.label)}
            leftIcon="fa-graduation-cap"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}><i className="fa fa-code mr-1 text-[#8b5cf6]" /> Required Skills</label>
        <input className={inputCls} value={f.skills}
          onChange={e => setF(p => ({ ...p, skills: e.target.value }))}
          placeholder="e.g. Photoshop, Illustrator, Branding (comma separated)" />
      </div>
    </div>
  );

  return (
    <DashboardLayout role="BUYER" title="My Jobs">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`fa ${s.icon} text-base`} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e8e8] shadow-sm p-1 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              )}>
              <i className={`fa ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>


        {/* Posted Jobs */}
        {activeTab === 'posted' && (
          <>
          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                className="w-full border border-[#e8e8e8] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition"
                placeholder="Search jobs by title or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}

              />
            </div>
            <div className="w-40">
              <CustomSelect
                value={statusFilter === '' ? 'All Status' : statusFilter === 'OPEN' ? 'Open' : statusFilter === 'IN_PROGRESS' ? 'In Progress' : statusFilter === 'CLOSED' ? 'Closed' : 'Cancelled'}
                onChange={val => {
                  const map: Record<string, string> = { 'All Status': '', 'Open': 'OPEN', 'In Progress': 'IN_PROGRESS', 'Closed': 'CLOSED', 'Cancelled': 'CANCELLED' };
                  setStatusFilter(map[val] ?? '');
                }}
                options={['All Status', 'Open', 'In Progress', 'Closed', 'Cancelled']}
                leftIcon="fa-filter"
              />
            </div>

            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
              >
                <i className="fa fa-times" /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e8e8] p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 && !refreshing ? (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-16 text-center">
              <i className="fa fa-briefcase text-4xl text-gray-200 mb-3 block" />
              <p className="text-gray-500 font-medium">No jobs posted yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Post your first job to attract talented creators</p>
              <button onClick={() => setActiveTab('post')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition">
                <i className="fa fa-plus" /> Post a Job
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {jobs.map(job => {
                const st = STATUS_MAP[job.status] || STATUS_MAP.OPEN;
                return (
                  <div key={job.id} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {job.category && job.category.split(',').map((c: string) => c.trim()).filter(c => c.length > 1).map((cat: string) => (
                            <span key={cat} className="text-[10px] bg-red-50 text-[#e84545] px-2 py-0.5 rounded-full font-medium">
                              <i className="fa fa-tag mr-1" />{cat}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 capitalize"><i className="fa fa-clock-o mr-1" />{job.job_type}</span>
                          {job.deadline && <span className="text-xs text-gray-400"><i className="fa fa-calendar mr-1" />{job.deadline}</span>}
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    {job.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{job.description}</p>}

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.skills.slice(0, 4).map((sk: string) => (
                          <span key={sk} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{sk}</span>
                        ))}
                        {job.skills.length > 4 && <span className="text-[10px] text-gray-400">+{job.skills.length - 4} more</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400">Budget</p>
                          <p className="text-sm font-bold text-gray-800">
                            <BudgetDisplay min={job.budget_min} max={job.budget_max} />
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Bids</p>
                          <p className="text-sm font-bold text-gray-800">
                            {job.bids_count}
                            {job.bids_count > 0 && <span className="ml-1 text-xs text-[#e84545] font-semibold">bids</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.bids_count > 0 && (
                          <button onClick={() => router.push(`/buyer/jobs/${job.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition font-medium">
                            <i className="fa fa-gavel mr-1" />View Bids ({job.bids_count})
                          </button>
                        )}
                        {job.status === 'OPEN' && (
                          <>
                            <button onClick={() => openEdit(job)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[#e84545] text-white hover:bg-[#c73333] transition">
                              <i className="fa fa-pencil mr-1" />Edit
                            </button>
                            <button onClick={() => setCloseTarget(job)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                              <i className="fa fa-times mr-1" />Close
                            </button>
                          </>
                        )}
                        <button onClick={() => setDeleteTarget(job)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition">
                          <i className="fa fa-trash text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <i className="fa fa-chevron-left text-xs" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    p === page ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100')}>
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <i className="fa fa-chevron-right text-xs" />
              </button>
            </div>
          )}
          </>
        )}

        {/* Post New Job */}
        {activeTab === 'post' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <i className="fa fa-plus-circle text-[#e84545]" /> Post a New Job
              </h3>
              <p className="text-xs text-gray-400 mb-6">Fill in the details to attract the right creators</p>

              {renderForm(form, setForm, formErrors)}

              {postMsg && (
                <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${postMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <i className={`fa ${postMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {postMsg.text}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100">
                <button onClick={handlePost} disabled={saving}
                  className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-[#e84545] text-white text-sm font-bold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                  {saving ? <><i className="fa fa-spinner fa-spin" /> Posting...</> : <><i className="fa fa-paper-plane" /> Post Job</>}
                </button>
                <button onClick={() => { setForm(EMPTY); setErrors({}); }} className="text-sm text-gray-400 hover:text-gray-600 transition">
                  Clear
                </button>
              </div>
            </div>

            {/* Tips Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><i className="fa fa-lightbulb-o text-[#f59e0b]" /> Tips for a Great Post</h4>
                <div className="space-y-3">
                  {['Write a clear, specific title', 'Describe your requirements in detail', 'Set a realistic budget range', 'Add relevant skills to attract experts', 'Include examples or references if possible'].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <i className="fa fa-check-circle text-sm mt-0.5 flex-shrink-0 text-[#10b981]" />
                      <p className="text-xs text-gray-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-bar-chart text-[#4f9ef8]" /> Platform Stats</h4>
                {[
                  { label: 'Avg. Bids per Job', val: '8-12',     color: '#e84545' },
                  { label: 'Avg. Hire Time',    val: '24 hours', color: '#4f9ef8' },
                  { label: 'Active Creators',   val: '12,000+',  color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#e84545] to-[#c02a2a] rounded-2xl p-5 text-white">
                <i className="fa fa-shield text-2xl mb-2 block" />
                <h4 className="text-sm font-bold mb-1">Buyer Protection</h4>
                <p className="text-xs text-red-100">Your payment is held in escrow and released only when you approve the work.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit Job Modal */}
      <Modal isOpen={!!editJob} onClose={() => setEditJob(null)} title="Edit Job" size="md">
        {editJob && (
          <div>
            {renderForm(editForm, setEditForm, {})}
            {editMsg && (
              <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${editMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <i className={`fa ${editMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {editMsg.text}
              </div>
            )}
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <Button variant="outline" fullWidth onClick={() => setEditJob(null)} disabled={editSaving}>Cancel</Button>
              <Button fullWidth onClick={handleEdit} loading={editSaving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Close Job Confirm */}
      <Modal isOpen={!!closeTarget} onClose={() => setCloseTarget(null)} title="Close Job" size="sm">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="fa fa-times-circle text-2xl text-gray-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">Close this job?</p>
            <p className="text-sm text-gray-500">
              <strong>&quot;{closeTarget?.title}&quot;</strong> will be marked as Closed and no new bids will be accepted.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={() => setCloseTarget(null)} disabled={closing}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleClose} loading={closing}>Yes, Close</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Job" size="sm">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fa fa-trash text-2xl text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">Delete this job?</p>
            <p className="text-sm text-gray-500">
              <strong>&quot;{deleteTarget?.title}&quot;</strong> will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>Yes, Delete</Button>
        </div>
      </Modal>

    </DashboardLayout>
  );
}

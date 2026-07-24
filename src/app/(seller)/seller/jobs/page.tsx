'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal           from '@/components/ui/Modal';
import Button          from '@/components/ui/Button';
import { cn }          from '@/lib/utils';
import { sellerJobApi, publicCategoryApi } from '@/lib/adminApi';
import { OverlayLoader } from '@/components/ui/Loader';
import RichTextEditor from '@/components/ui/RichTextEditor';

// rich-text descriptions are HTML — clean plain-text preview for cards
const plainText = (html: string): string =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

interface Buyer { id: number; name: string; email: string; }
interface MyBid {
  id: number; amount: number; delivery_days: number; proposal: string | null; status: string;
  counter_amount?: number | null; counter_delivery_days?: number | null;
  counter_by?: 'buyer' | 'seller' | null; counter_note?: string | null;
}
interface Job {
  id: number; title: string; description: string; category: string;
  job_type: string; budget_min: number | null; budget_max: number | null;
  deadline: string | null; skills: string[]; experience_level: string;
  status: string; bids_count: number; created_at: string;
  buyer: Buyer; has_bid: boolean; my_bid: MyBid | null;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30)  return days + 'd ago';
  return Math.floor(days / 30) + 'mo ago';
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmt(n: number | null) { return n ? '$' + Number(n).toLocaleString() : ''; }

function BudgetDisplay({ min, max }: { min: number | null; max: number | null }) {
  if (!min && !max) return <span className="text-gray-400 text-xs">Not specified</span>;
  if (min && max)   return <span>{fmt(min)} - {fmt(max)}</span>;
  if (min)          return <span>From {fmt(min)}</span>;
  return <span>Up to {fmt(max)}</span>;
}

export default function SellerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;
  const firstLoad = useRef(true);

  // Place bid state
  const [bidJob, setBidJob]       = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDays, setBidDays]     = useState('');
  const [proposal, setProposal]   = useState('');
  const [bidSaving, setBidSaving] = useState(false);
  const [bidMsg, setBidMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // Edit bid state
  const [editJob, setEditJob]         = useState<Job | null>(null);
  const [editAmount, setEditAmount]   = useState('');
  const [editDays, setEditDays]       = useState('');
  const [editProposal, setEditProposal] = useState('');
  const [editSaving, setEditSaving]   = useState(false);
  const [editMsg, setEditMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  // Withdraw bid state
  const [withdrawJob, setWithdrawJob]   = useState<Job | null>(null);
  const [withdrawing, setWithdrawing]   = useState(false);

  const loadJobs = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search.trim())                          params.search   = search.trim();
      if (activeCategory && activeCategory !== 'All') params.category = activeCategory;
      const res = await sellerJobApi.list(params);
      setJobs(res.data || []);
      setTotalPages(res.meta?.totalPages || res.pagination?.pages || 1);
    } catch { setJobs([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, search, activeCategory]);

  useEffect(() => {
    publicCategoryApi.list()
      .then(r => { if (r.data?.length) setCategories(r.data.map((c: { name: string }) => c.name)); })
      .catch(() => {});
  }, []);

  // Reset to first page whenever the search/category changes
  useEffect(() => { setPage(1); }, [search, activeCategory]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadJobs(!firstLoad.current);
      firstLoad.current = false;
    }, firstLoad.current ? 0 : 300);
    return () => clearTimeout(t);
  }, [loadJobs]);

  // -- Place bid -----------------------------------------------------------
  const openBid = (job: Job) => {
    setBidJob(job); setBidAmount(''); setBidDays(''); setProposal(''); setBidMsg(null);
  };

  const handleBid = async () => {
    if (!bidJob) return;
    if (!bidAmount || !bidDays) { setBidMsg({ ok: false, text: 'Amount and delivery days are required' }); return; }
    setBidSaving(true); setBidMsg(null);
    try {
      await sellerJobApi.bid(bidJob.id, {
        amount:        Number(bidAmount),
        delivery_days: Number(bidDays),
        proposal:      proposal || undefined,
      });
      setBidMsg({ ok: true, text: 'Bid placed successfully!' });
      await loadJobs(true);
      setTimeout(() => setBidJob(null), 1200);
    } catch (e: unknown) {
      setBidMsg({ ok: false, text: (e as Error).message || 'Failed to place bid' });
    } finally { setBidSaving(false); }
  };

  // -- Edit bid ------------------------------------------------------------
  const openEditBid = (job: Job) => {
    if (!job.my_bid) return;
    setEditJob(job);
    setEditAmount(String(job.my_bid.amount));
    setEditDays(String(job.my_bid.delivery_days));
    setEditProposal(job.my_bid.proposal || '');
    setEditMsg(null);
  };

  const handleEditBid = async () => {
    if (!editJob) return;
    if (!editAmount || !editDays) { setEditMsg({ ok: false, text: 'Amount and delivery days are required' }); return; }
    setEditSaving(true); setEditMsg(null);
    try {
      await sellerJobApi.updateBid(editJob.id, {
        amount:        Number(editAmount),
        delivery_days: Number(editDays),
        proposal:      editProposal || undefined,
      });
      setEditMsg({ ok: true, text: 'Bid updated successfully!' });
      await loadJobs(true);
      setTimeout(() => setEditJob(null), 1200);
    } catch (e: unknown) {
      setEditMsg({ ok: false, text: (e as Error).message || 'Failed to update bid' });
    } finally { setEditSaving(false); }
  };

  // -- Withdraw bid --------------------------------------------------------
  const handleWithdraw = async () => {
    if (!withdrawJob) return;
    setWithdrawing(true);
    try {
      await sellerJobApi.withdrawBid(withdrawJob.id);
      setWithdrawJob(null);
      await loadJobs(true);
    } catch { /* ignore */ }
    finally { setWithdrawing(false); }
  };

  // -- Counter-offer (seller responds to buyer's counter) ------------------
  const [counterJob, setCounterJob]     = useState<Job | null>(null);
  const [cAmount, setCAmount]           = useState('');
  const [cDays, setCDays]               = useState('');
  const [cNote, setCNote]               = useState('');
  const [cSaving, setCSaving]           = useState(false);
  const [cMsg, setCMsg]                 = useState('');
  const [acceptingJob, setAcceptingJob] = useState<number | null>(null);

  const openCounter = (job: Job) => {
    if (!job.my_bid) return;
    setCounterJob(job);
    setCAmount(String(job.my_bid.counter_amount ?? job.my_bid.amount));
    setCDays(String(job.my_bid.counter_delivery_days ?? job.my_bid.delivery_days));
    setCNote(''); setCMsg('');
  };

  const handleCounter = async () => {
    if (!counterJob) return;
    if (!cAmount || Number(cAmount) <= 0) { setCMsg('Enter a valid amount'); return; }
    setCSaving(true); setCMsg('');
    try {
      await sellerJobApi.counterBid(counterJob.id, {
        amount: Number(cAmount), delivery_days: cDays ? Number(cDays) : undefined, note: cNote || undefined,
      });
      setCounterJob(null);
      await loadJobs(true);
    } catch (e) {
      setCMsg((e as Error).message || 'Failed to send counter');
    } finally { setCSaving(false); }
  };

  const handleAcceptCounter = async (job: Job) => {
    setAcceptingJob(job.id);
    try {
      await sellerJobApi.acceptCounter(job.id);
      await loadJobs(true);
    } catch { /* ignore */ }
    finally { setAcceptingJob(null); }
  };

  const allCategories = ['All', ...categories];
  const myBidsCount   = jobs.filter(j => j.has_bid).length;
  const withMax       = jobs.filter(j => j.budget_max);
  const avgBudget     = withMax.length
    ? '$' + Math.round(withMax.reduce((s, j) => s + Number(j.budget_max), 0) / withMax.length).toLocaleString()
    : '-';

  return (
    <DashboardLayout role="SELLER" title="Browse Jobs">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Open Jobs',   val: String(jobs.length), icon: 'fa-briefcase', color: '#e84545', bg: '#fef2f2' },
            { label: 'My Bids',     val: String(myBidsCount), icon: 'fa-gavel',     color: '#10b981', bg: '#ecfdf5' },
            { label: 'Connects',    val: '48',                icon: 'fa-bolt',      color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Avg. Budget', val: avgBudget,           icon: 'fa-dollar',    color: '#4f9ef8', bg: '#eff6ff' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={'fa ' + s.icon + ' text-base'} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <i className="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              className="w-full border border-[#e8e8e8] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition"
              placeholder="Search jobs by title or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
              <i className="fa fa-times" /> Clear
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                activeCategory === c
                  ? 'bg-[#e84545] text-white border-[#e84545] shadow-sm'
                  : 'bg-white text-gray-600 border-[#e8e8e8] hover:border-[#e84545] hover:text-[#e84545]'
              )}>
              {c}
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e8e8] p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 && !refreshing ? (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-16 text-center">
            <i className="fa fa-briefcase text-4xl text-gray-200 mb-3 block" />
            <p className="text-gray-500 font-medium">No open jobs found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="relative">
            {refreshing && <OverlayLoader text="Loading jobs..." />}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {jobs.map(job => (
                <div key={job.id} className={cn(
                  'rounded-2xl shadow-sm p-5 hover:shadow-md transition flex flex-col',
                  job.has_bid
                    ? 'bg-[#fff6f2] border-2 border-[#e84545]/40 ring-1 ring-[#e84545]/10'
                    : 'bg-white border border-[#e8e8e8]'
                )}>
                  {job.has_bid && (
                    <span className="inline-flex items-center gap-1 self-start mb-2 text-[10px] font-bold text-[#e84545] bg-[#e84545]/10 px-2 py-0.5 rounded-full">
                      <i className="fa fa-check-circle" /> You&apos;ve bid on this
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 onClick={() => router.push(`/seller/jobs/${job.id}`)}
                      className="text-sm font-bold text-gray-900 leading-snug flex-1 cursor-pointer hover:text-[#e84545] transition">{job.title}</h3>
                    <span className="flex-shrink-0 text-sm font-bold text-[#e84545]">
                      <BudgetDisplay min={job.budget_min} max={job.budget_max} />
                    </span>
                  </div>
                  {job.description && plainText(job.description) && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{plainText(job.description)}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.category && job.category.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 1).map((cat: string) => (
                      <span key={cat} className="text-[10px] bg-red-50 text-[#e84545] px-2 py-0.5 rounded-full font-medium">
                        <i className="fa fa-tag mr-1" />{cat}
                      </span>
                    ))}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                      <i className="fa fa-clock-o mr-1" />{job.job_type}
                    </span>
                    {job.experience_level && job.experience_level !== 'any' && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                        <i className="fa fa-graduation-cap mr-1" />{job.experience_level}
                      </span>
                    )}
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skills.slice(0, 4).map((sk: string) => (
                        <span key={sk} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{sk}</span>
                      ))}
                      {job.skills.length > 4 && <span className="text-[10px] text-gray-400">+{job.skills.length - 4} more</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#e84545] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {initials(job.buyer ? job.buyer.name : 'U')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 leading-tight">{job.buyer ? job.buyer.name : 'Buyer'}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(job.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => router.push(`/seller/jobs/${job.id}`)}
                        className="text-xs text-gray-500 hover:text-[#e84545] font-medium transition">
                        <i className="fa fa-eye mr-1" />Details
                      </button>
                      <span className="text-xs text-gray-400" title="Bids already applied">
                        <i className="fa fa-gavel mr-1" />{job.bids_count} {job.bids_count === 1 ? 'bid' : 'bids'} applied
                      </span>
                      {job.has_bid ? (
                        (job.my_bid?.status === 'countered' && job.my_bid?.counter_by === 'buyer') ? (
                          // Buyer countered → seller can accept or counter back
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleAcceptCounter(job)} disabled={acceptingJob === job.id}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition disabled:opacity-60">
                              <i className="fa fa-check mr-1" />{acceptingJob === job.id ? 'Accepting…' : `Accept $${job.my_bid?.counter_amount}`}
                            </button>
                            <button onClick={() => openCounter(job)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-200 hover:bg-blue-100 transition">
                              <i className="fa fa-exchange mr-1" />Counter
                            </button>
                          </div>
                        ) : (job.my_bid?.status === 'countered' && job.my_bid?.counter_by === 'seller') ? (
                          <span className="text-xs text-blue-600 font-medium px-2 py-1.5">
                            <i className="fa fa-clock-o mr-1" />Counter sent — awaiting buyer
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEditBid(job)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-200 hover:bg-blue-100 transition">
                              <i className="fa fa-pencil mr-1" />Edit
                            </button>
                            <button onClick={() => setWithdrawJob(job)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-[#e84545] font-semibold border border-red-200 hover:bg-red-100 transition">
                              <i className="fa fa-times mr-1" />Withdraw
                            </button>
                          </div>
                        )
                      ) : (
                        <button onClick={() => openBid(job)}
                          className="text-xs px-4 py-1.5 rounded-lg bg-[#e84545] text-white font-semibold hover:bg-[#c73333] transition shadow-sm">
                          <i className="fa fa-gavel mr-1" />Place Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

      </div>

      {/* Place Bid Modal */}
      <Modal isOpen={!!bidJob} onClose={() => setBidJob(null)} title="Place a Bid" size="md">
        {bidJob && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-semibold">Job</p>
              <p className="text-sm font-bold text-gray-900">{bidJob.title}</p>
              <p className="text-xs text-[#e84545] font-semibold mt-0.5">
                <BudgetDisplay min={bidJob.budget_min} max={bidJob.budget_max} /> budget
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}><i className="fa fa-dollar mr-1 text-[#10b981]" /> Bid Amount ($)</label>
                <input className={inputCls} type="number" min="1" placeholder="e.g. 250"
                  value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}><i className="fa fa-calendar mr-1 text-[#4f9ef8]" /> Delivery Days</label>
                <input className={inputCls} type="number" min="1" placeholder="e.g. 5"
                  value={bidDays} onChange={e => setBidDays(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}><i className="fa fa-pencil mr-1 text-[#e84545]" /> Proposal</label>
              <RichTextEditor
                variant="compact"
                placeholder="Describe why you are the best fit for this job..."
                value={proposal}
                onChange={setProposal}
              />
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <i className="fa fa-bolt text-sm text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">This will use <strong>2 connects</strong> from your balance.</p>
            </div>
            {bidMsg && (
              <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border',
                bidMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600')}>
                <i className={'fa ' + (bidMsg.ok ? 'fa-check-circle' : 'fa-times-circle')} /> {bidMsg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" fullWidth onClick={() => setBidJob(null)} disabled={bidSaving}>Cancel</Button>
              <Button fullWidth onClick={handleBid} loading={bidSaving}>Submit Bid</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Bid Modal */}
      <Modal isOpen={!!editJob} onClose={() => setEditJob(null)} title="Edit Your Bid" size="md">
        {editJob && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-[10px] text-blue-400 mb-0.5 uppercase tracking-wide font-semibold">Editing bid for</p>
              <p className="text-sm font-bold text-gray-900">{editJob.title}</p>
              {editJob.my_bid && (
                <p className="text-xs text-blue-500 mt-0.5">
                  Current: ${Number(editJob.my_bid.amount).toLocaleString()} &bull; {editJob.my_bid.delivery_days} days
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}><i className="fa fa-dollar mr-1 text-[#10b981]" /> Bid Amount ($)</label>
                <input className={inputCls} type="number" min="1" placeholder="e.g. 250"
                  value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}><i className="fa fa-calendar mr-1 text-[#4f9ef8]" /> Delivery Days</label>
                <input className={inputCls} type="number" min="1" placeholder="e.g. 5"
                  value={editDays} onChange={e => setEditDays(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}><i className="fa fa-pencil mr-1 text-[#e84545]" /> Proposal</label>
              <RichTextEditor
                variant="compact"
                placeholder="Update your proposal..."
                value={editProposal}
                onChange={setEditProposal}
              />
            </div>
            {editMsg && (
              <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border',
                editMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600')}>
                <i className={'fa ' + (editMsg.ok ? 'fa-check-circle' : 'fa-times-circle')} /> {editMsg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" fullWidth onClick={() => setEditJob(null)} disabled={editSaving}>Cancel</Button>
              <Button fullWidth onClick={handleEditBid} loading={editSaving}>Update Bid</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw Confirm Modal */}
      <Modal isOpen={!!withdrawJob} onClose={() => setWithdrawJob(null)} title="Withdraw Bid" size="sm">
        {withdrawJob && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <i className="fa fa-exclamation-triangle text-[#e84545]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Withdraw your bid?</p>
                <p className="text-xs text-gray-500">
                  Your bid on <strong>{withdrawJob.title}</strong> will be removed. You can place a new bid after withdrawal.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" fullWidth onClick={() => setWithdrawJob(null)} disabled={withdrawing}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={handleWithdraw} loading={withdrawing}>Yes, Withdraw</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Counter-back modal */}
      <Modal isOpen={!!counterJob} onClose={() => setCounterJob(null)} title="Counter the Buyer" size="sm">
        {counterJob && counterJob.my_bid && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Buyer&apos;s Counter</p>
              <p className="text-sm text-gray-700">
                <b>${counterJob.my_bid.counter_amount}</b> &middot; {counterJob.my_bid.counter_delivery_days ?? counterJob.my_bid.delivery_days} days
              </p>
              {counterJob.my_bid.counter_note && <p className="text-xs text-gray-500 mt-1">{counterJob.my_bid.counter_note}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Your Amount ($)</label>
                <input type="number" value={cAmount} onChange={(e) => setCAmount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Delivery (days)</label>
                <input type="number" value={cDays} onChange={(e) => setCDays(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Note (optional)</label>
              <textarea rows={2} value={cNote} onChange={(e) => setCNote(e.target.value)}
                placeholder="Add a note for the buyer..."
                className={inputCls + ' resize-none'} />
            </div>
            {cMsg && <p className="text-sm text-center text-red-600 font-medium">{cMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCounterJob(null)}>Cancel</Button>
              <Button variant="primary" fullWidth disabled={cSaving} onClick={handleCounter}>
                {cSaving ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </DashboardLayout>
  );
}

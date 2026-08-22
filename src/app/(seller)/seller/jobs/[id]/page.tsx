'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import RichTextEditor, { RichTextView } from '@/components/ui/RichTextEditor';
import { formatCurrency } from '@/lib/utils';
import { sellerJobApi, profileApi, BookingAttachment } from '@/lib/adminApi';
import { compressImages } from '@/lib/imageCompress';
import toast from 'react-hot-toast';

const MAX_DELIVERY_DAYS = 365;
const MAX_BID_FILES = 5;
// Real-time clamp — `max` on <input type="number"> doesn't stop typing extra digits, only submit-time validation does
const clampDays = (raw: string) => {
  if (raw === '') return '';
  const digits = raw.replace(/[^\d]/g, '').slice(0, 3); // 365 is at most 3 digits
  return String(Math.min(Number(digits) || 0, MAX_DELIVERY_DAYS));
};

interface MyBid {
  id: number; amount: number; delivery_days: number; proposal: string | null; status: string;
  counter_amount?: number | null; counter_delivery_days?: number | null;
  counter_by?: 'buyer' | 'seller' | null; counter_note?: string | null;
  attachments?: BookingAttachment[];
  question_answers?: { question: string; answer: string }[];
}
interface JobDetail {
  id: number; title: string; description: string | null; category: string;
  job_type: string; budget_min: number | null; budget_max: number | null;
  deadline: string | null; skills: string[]; experience_level: string;
  status: string; bids_count: number; created_at: string;
  attachments?: { url: string; name: string }[];
  questions?: string[];
  buyer?: { id: number; name: string; email: string } | null;
  has_bid: boolean; my_bid: MyBid | null;
}

export default function SellerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob]         = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // bid form
  const [amount, setAmount]     = useState('');
  const [days, setDays]         = useState('');
  const [proposal, setProposal] = useState('');
  const [bidFiles, setBidFiles] = useState<BookingAttachment[]>([]);
  const [answers, setAnswers]   = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [myHourlyRate, setMyHourlyRate] = useState<number | null>(null);

  // counter form
  const [showCounter, setShowCounter] = useState(false);
  const [cAmount, setCAmount] = useState('');
  const [cDays, setCDays]     = useState('');
  const [cNote, setCNote]     = useState('');
  const [busy, setBusy]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await sellerJobApi.get(Number(id));
      const j: JobDetail = res.data;
      setJob(j);
      if (j.my_bid) {
        setAmount(String(j.my_bid.amount));
        setDays(String(j.my_bid.delivery_days));
        setProposal(j.my_bid.proposal || '');
        setBidFiles(Array.isArray(j.my_bid.attachments) ? j.my_bid.attachments : []);
        const prevAnswers = Array.isArray(j.my_bid.question_answers) ? j.my_bid.question_answers : [];
        setAnswers((j.questions || []).map((_, i) => prevAnswers[i]?.answer || ''));
      } else {
        setAnswers((j.questions || []).map(() => ''));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load job');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  useEffect(() => {
    profileApi.get('seller')
      .then(r => { const rate = r.data?.seller_profile?.hourly_rate; if (rate != null) setMyHourlyRate(Number(rate)); })
      .catch(() => {});
  }, []);

  // Prefill the rate for a fresh hourly bid once both the job and the seller's own rate are known
  useEffect(() => {
    if (job && !job.my_bid && job.job_type === 'hourly' && myHourlyRate != null && !amount) {
      setAmount(String(myHourlyRate));
    }
  }, [job, myHourlyRate, amount]);

  const handlePickFiles = async (picked: File[]) => {
    const room = MAX_BID_FILES - bidFiles.length;
    const files = picked.slice(0, room);
    if (picked.length > files.length) {
      toast.error(`Only ${MAX_BID_FILES} files allowed — ${picked.length - files.length} skipped.`);
    }
    if (!files.length) return;
    setUploading(true);
    try {
      const compressed = await compressImages(files);
      const uploaded: BookingAttachment[] = [];
      for (const f of compressed) {
        const res = await sellerJobApi.uploadBidFile(f);
        if (res?.data) uploaded.push(res.data);
      }
      setBidFiles(prev => [...prev, ...uploaded]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const submitBid = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    if (!days || Number(days) <= 0)     return toast.error('Enter delivery days');
    if (Number(days) > MAX_DELIVERY_DAYS) return toast.error(`Delivery days can't exceed ${MAX_DELIVERY_DAYS}`);
    if (job?.questions?.length && answers.some(a => !a.trim())) return toast.error("Please answer all of the buyer's questions");
    setSaving(true);
    try {
      if (job?.has_bid) {
        await sellerJobApi.updateBid(Number(id), { amount: Number(amount), delivery_days: Number(days), proposal, attachments: bidFiles, answers });
        toast.success('Bid updated');
      } else {
        await sellerJobApi.bid(Number(id), { amount: Number(amount), delivery_days: Number(days), proposal, attachments: bidFiles, answers });
        toast.success('Bid placed');
      }
      setEditing(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit bid');
    } finally { setSaving(false); }
  };

  const withdraw = async () => {
    setBusy(true);
    try { await sellerJobApi.withdrawBid(Number(id)); toast.success('Bid withdrawn'); await load(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  const acceptCounter = async () => {
    setBusy(true);
    try { await sellerJobApi.acceptCounter(Number(id)); toast.success('Counter accepted — booking created'); await load(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  const openCounter = () => {
    if (!job?.my_bid) return;
    setCAmount(String(job.my_bid.counter_amount ?? job.my_bid.amount));
    setCDays(String(job.my_bid.counter_delivery_days ?? job.my_bid.delivery_days));
    setCNote(''); setShowCounter(true);
  };

  const sendCounter = async () => {
    if (!cAmount || Number(cAmount) <= 0) return toast.error('Enter a valid amount');
    if (cDays && Number(cDays) > MAX_DELIVERY_DAYS) return toast.error(`Delivery days can't exceed ${MAX_DELIVERY_DAYS}`);
    setBusy(true);
    try {
      await sellerJobApi.counterBid(Number(id), { amount: Number(cAmount), delivery_days: cDays ? Number(cDays) : undefined, note: cNote || undefined });
      toast.success('Counter sent to buyer');
      setShowCounter(false);
      await load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  const b = job?.my_bid;
  const buyerCountered  = b?.status === 'countered' && b?.counter_by === 'buyer';
  const sellerCountered = b?.status === 'countered' && b?.counter_by === 'seller';
  const showBidForm = job && (!job.has_bid || editing) && job.status === 'OPEN';

  return (
    <DashboardLayout role="SELLER" title="Job Details">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e84545] mb-5 transition">
        <i className="fa fa-arrow-left text-xs" /> Back to Jobs
      </button>

      {loading ? (
        <div className="flex justify-center py-20"><i className="fa fa-spinner fa-spin text-2xl text-[#e84545]" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600"><i className="fa fa-exclamation-circle mr-2" />{error}</div>
      ) : job ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <Card padding="md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {job.category && job.category.split(',').map(c => c.trim()).filter(c => c.length > 1).map(c => (
                      <span key={c} className="text-[11px] bg-red-50 text-[#e84545] px-2 py-0.5 rounded-full font-medium"><i className="fa fa-tag mr-1" />{c}</span>
                    ))}
                    <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize"><i className="fa fa-clock-o mr-1" />{job.job_type}</span>
                    {job.experience_level !== 'any' && (
                      <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize"><i className="fa fa-graduation-cap mr-1" />{job.experience_level}</span>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.status}</span>
              </div>

              {/* Bids applied — prominent */}
              <div className="flex items-center gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <i className="fa fa-gavel text-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{job.bids_count}</span>
                <span className="text-sm text-amber-700">{job.bids_count === 1 ? 'freelancer has' : 'freelancers have'} already applied</span>
              </div>

              {job.description && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                  <RichTextView html={job.description} />
                </div>
              )}

              {job.skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>)}
                  </div>
                </div>
              )}

              {job.attachments && job.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {job.attachments.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 transition">
                        <i className="fa fa-file-o text-[#e84545]" /><span className="max-w-[180px] truncate">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {job.questions && job.questions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Screening Questions</p>
                  <ul className="space-y-1">
                    {job.questions.map((q, i) => (
                      <li key={i} className="text-sm text-gray-600"><span className="text-gray-400">{i + 1}.</span> {q}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400 mt-1.5">You&apos;ll need to answer these when you place your bid.</p>
                </div>
              )}

              <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100 text-sm">
                <div><p className="text-xs text-gray-400">Budget</p><p className="font-bold text-[#e84545]">{job.budget_min || job.budget_max ? `${formatCurrency(job.budget_min || 0)} - ${formatCurrency(job.budget_max || 0)}` : 'Not set'}</p></div>
                {job.deadline && <div><p className="text-xs text-gray-400">Deadline</p><p className="font-semibold text-gray-700">{job.deadline}</p></div>}
              </div>

              {job.buyer && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Avatar name={job.buyer.name} size="sm" />
                  <div><p className="text-sm font-semibold text-gray-800">{job.buyer.name}</p><p className="text-xs text-gray-400">Job poster</p></div>
                </div>
              )}
            </Card>
          </div>

          {/* Right — bid panel */}
          <div className="space-y-4">
            <Card padding="md">
              {/* Existing bid summary */}
              {job.has_bid && b && !editing && (
                <>
                  <p className="text-sm font-bold text-gray-900 mb-3">Your Bid</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center"><p className="text-xs text-gray-400">Amount</p><p className="font-bold text-[#e84545]">{formatCurrency(Number(b.amount))}</p></div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center"><p className="text-xs text-gray-400">Delivery</p><p className="font-bold text-gray-800">{b.delivery_days}d</p></div>
                  </div>

                  {b.question_answers && b.question_answers.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500"><i className="fa fa-question-circle mr-1 text-[#8b5cf6]" />Your Answers</p>
                      {b.question_answers.map((qa, i) => (
                        <div key={i}>
                          <p className="text-xs text-gray-500">{i + 1}. {qa.question}</p>
                          <p className="text-xs text-gray-700 font-medium">{qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {b.counter_amount != null && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">{buyerCountered ? 'Buyer countered' : 'Your counter (awaiting buyer)'}</p>
                      <p className="text-sm text-gray-700"><b>{formatCurrency(Number(b.counter_amount))}</b> &middot; {b.counter_delivery_days ?? b.delivery_days} days</p>
                      {b.counter_note && <p className="text-xs text-gray-500 mt-1">{b.counter_note}</p>}
                    </div>
                  )}

                  {job.status === 'OPEN' && (
                    <div className="space-y-2">
                      {buyerCountered && (
                        <Button variant="primary" fullWidth disabled={busy} onClick={acceptCounter}>
                          <i className="fa fa-check mr-1" /> Accept {formatCurrency(Number(b.counter_amount))}
                        </Button>
                      )}
                      {buyerCountered && (
                        <Button variant="outline" fullWidth onClick={openCounter}><i className="fa fa-exchange mr-1" /> Recounter</Button>
                      )}
                      {sellerCountered && <p className="text-xs text-center text-blue-600"><i className="fa fa-clock-o mr-1" />Counter sent — awaiting buyer</p>}
                      {!buyerCountered && !sellerCountered && (
                        <Button variant="outline" fullWidth onClick={() => setEditing(true)}><i className="fa fa-pencil mr-1" /> Edit Bid</Button>
                      )}
                      <button onClick={withdraw} disabled={busy} className="w-full text-xs text-red-500 hover:underline py-1">Withdraw bid</button>
                    </div>
                  )}
                </>
              )}

              {/* Bid form (new or edit) */}
              {showBidForm && (
                <>
                  <p className="text-sm font-bold text-gray-900 mb-3">{job.has_bid ? 'Edit Your Bid' : 'Place a Bid'}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1">{job.job_type === 'hourly' ? 'Hourly Rate ($/hr)' : 'Amount ($)'}</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1">Delivery (days)</label>
                      <input type="number" min={1} max={MAX_DELIVERY_DAYS} value={days} onChange={e => setDays(clampDays(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" /></div>
                  </div>
                  <div className="mb-3">
                    <RichTextEditor label="Proposal" variant="compact" value={proposal} onChange={setProposal} placeholder="Why are you the best fit?" />
                  </div>
                  {job.questions && job.questions.length > 0 && (
                    <div className="mb-3 space-y-3">
                      <label className="block text-xs font-semibold text-gray-500">
                        <i className="fa fa-question-circle mr-1 text-[#8b5cf6]" />Buyer&apos;s Questions <span className="font-normal text-gray-400">(required)</span>
                      </label>
                      {job.questions.map((q, i) => (
                        <div key={i}>
                          <p className="text-xs text-gray-600 mb-1">{i + 1}. {q}</p>
                          <textarea rows={2} value={answers[i] || ''}
                            onChange={e => setAnswers(prev => prev.map((a, idx) => idx === i ? e.target.value : a))}
                            placeholder="Your answer..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#e84545]" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Portfolio / Work Samples <span className="font-normal text-gray-400">(optional — up to {MAX_BID_FILES})</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 cursor-pointer hover:border-[#e84545] hover:bg-red-50 transition ${(uploading || bidFiles.length >= MAX_BID_FILES) ? 'opacity-60 pointer-events-none' : ''}`}>
                      <i className={`fa ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload'} text-[#e84545]`} />
                      <span className="text-sm text-gray-500">
                        {uploading ? 'Uploading…' : bidFiles.length >= MAX_BID_FILES ? `Limit of ${MAX_BID_FILES} files reached` : 'Attach portfolio samples'}
                      </span>
                      <input type="file" multiple hidden
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,image/*"
                        onChange={async (e) => {
                          const picked = Array.from(e.target.files || []);
                          e.target.value = '';
                          if (picked.length) await handlePickFiles(picked);
                        }}
                      />
                    </label>
                    {bidFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {bidFiles.map((doc, i) => (
                          <span key={`${doc.url}-${i}`} className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                            <i className="fa fa-file-o text-[#e84545]" />
                            <a href={doc.url} target="_blank" rel="noreferrer" className="max-w-[140px] truncate hover:underline">{doc.name}</a>
                            <button type="button" onClick={() => setBidFiles(bidFiles.filter((_, idx) => idx !== i))}
                              className="text-gray-400 hover:text-red-500"><i className="fa fa-times" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editing && <Button variant="outline" fullWidth onClick={() => setEditing(false)}>Cancel</Button>}
                    <Button variant="primary" fullWidth disabled={saving} onClick={submitBid}>
                      {saving ? 'Saving…' : job.has_bid ? 'Update Bid' : 'Submit Bid'}
                    </Button>
                  </div>
                </>
              )}

              {job.status !== 'OPEN' && !job.has_bid && (
                <p className="text-sm text-gray-400 text-center py-4">This job is no longer open for bids.</p>
              )}
            </Card>

            {/* Counter panel */}
            {showCounter && b && (
              <Card padding="md">
                <p className="text-sm font-bold text-gray-900 mb-3">Counter the Buyer</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Amount ($)</label>
                    <input type="number" value={cAmount} onChange={e => setCAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Delivery (days)</label>
                    <input type="number" min={1} max={MAX_DELIVERY_DAYS} value={cDays} onChange={e => setCDays(clampDays(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" /></div>
                </div>
                <textarea rows={2} value={cNote} onChange={e => setCNote(e.target.value)} placeholder="Note (optional)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:border-[#e84545]" />
                <div className="flex gap-2">
                  <Button variant="outline" fullWidth onClick={() => setShowCounter(false)}>Cancel</Button>
                  <Button variant="primary" fullWidth disabled={busy} onClick={sendCounter}>{busy ? 'Sending…' : 'Send Counter'}</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

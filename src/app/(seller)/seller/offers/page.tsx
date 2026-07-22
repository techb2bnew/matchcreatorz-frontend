'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import RichTextEditor, { RichTextView } from '@/components/ui/RichTextEditor';
import { formatDate, formatCurrency } from '@/lib/utils';
import { sellerOfferApi, sellerBuyerApi } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

interface BuyerOption { id: number; name: string; email: string; avatar?: string | null }

interface Offer {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  delivery_days: number | null;
  status: string;
  created_at: string;
  buyer: { id: number; name: string } | null;
}

const statusClass = (s: string) => {
  const v = (s || '').toLowerCase();
  if (v === 'accepted') return 'bg-green-100 text-green-700';
  if (v === 'declined') return 'bg-red-100 text-red-700';
  if (v === 'withdrawn') return 'bg-gray-100 text-gray-500';
  return 'bg-yellow-100 text-yellow-700';
};

interface SendForm {
  buyer_id: string;
  title: string;
  amount: string;
  delivery_days: string;
  description: string;
}
const EMPTY_FORM: SendForm = { buyer_id: '', title: '', amount: '', delivery_days: '', description: '' };

export default function SellerOffersPage() {
  const [offers, setOffers]     = useState<Offer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const [showSend, setShowSend] = useState(false);
  const [form, setForm]         = useState<SendForm>(EMPTY_FORM);
  const [sending, setSending]   = useState(false);
  const [err, setErr]           = useState('');

  // Buyer picker state
  const [buyerQuery, setBuyerQuery]       = useState('');
  const [buyerResults, setBuyerResults]   = useState<BuyerOption[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerOption | null>(null);
  const [buyerOpen, setBuyerOpen]         = useState(false);
  const [buyerLoading, setBuyerLoading]   = useState(false);

  // Debounced buyer search (only while dropdown open and no buyer chosen)
  useEffect(() => {
    if (!showSend || selectedBuyer) return;
    const t = setTimeout(async () => {
      setBuyerLoading(true);
      try {
        const res = await sellerBuyerApi.search({ search: buyerQuery, limit: 8 });
        setBuyerResults(res.data || []);
      } catch {
        setBuyerResults([]);
      } finally {
        setBuyerLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buyerQuery, showSend, selectedBuyer]);

  const openSend = () => {
    setForm(EMPTY_FORM);
    setErr('');
    setBuyerQuery('');
    setBuyerResults([]);
    setSelectedBuyer(null);
    setBuyerOpen(false);
    setShowSend(true);
  };

  const pickBuyer = (b: BuyerOption) => {
    setSelectedBuyer(b);
    setForm((f) => ({ ...f, buyer_id: String(b.id) }));
    setBuyerOpen(false);
  };

  const clearBuyer = () => {
    setSelectedBuyer(null);
    setForm((f) => ({ ...f, buyer_id: '' }));
    setBuyerQuery('');
    setBuyerOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sellerOfferApi.list({ limit: 100 });
      setOffers(res.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!form.buyer_id.trim())              return setErr('Please select a buyer');
    if (!form.title.trim())                 return setErr('Title is required');
    if (!form.amount || Number(form.amount) <= 0) return setErr('Amount must be greater than 0');
    setErr('');
    setSending(true);
    try {
      await sellerOfferApi.send({
        buyer_id:      Number(form.buyer_id),
        title:         form.title.trim(),
        amount:        Number(form.amount),
        delivery_days: form.delivery_days ? Number(form.delivery_days) : undefined,
        description:   form.description || undefined,
      });
      toast.success('Offer sent');
      setForm(EMPTY_FORM);
      setShowSend(false);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleWithdraw = async (id: number) => {
    setActionId(id);
    try {
      await sellerOfferApi.withdraw(id);
      toast.success('Offer withdrawn');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to withdraw offer');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout role="SELLER" title="Offers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sent Offers</h2>
          <p className="text-sm text-gray-400">Offers you have sent to buyers</p>
        </div>
        <Button leftIcon={<i className="fa fa-paper-plane text-sm" />} onClick={openSend}>
          Send Offer
        </Button>
      </div>

      {loading ? (
        <PageLoader text="Loading offers..." />
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="fa fa-paper-plane text-3xl mb-3" />
          <p className="text-sm">No offers sent yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((o) => (
            <Card key={o.id} padding="md">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Avatar name={o.buyer?.name || 'Buyer'} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{o.buyer?.name || 'Buyer'}</p>
                    <p className="text-xs text-gray-400">Re: {o.title}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {o.description && <RichTextView html={o.description} />}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(o.status)}`}>
                      {o.status}
                    </span>
                    {o.delivery_days ? <span className="text-xs text-gray-400">{o.delivery_days} day delivery</span> : null}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#e84545]">{formatCurrency(o.amount)}</p>
                  <p className="text-xs text-gray-400">Sent {formatDate(o.created_at)}</p>
                </div>
              </div>

              {(o.status || '').toLowerCase() === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    loading={actionId === o.id}
                    onClick={() => handleWithdraw(o.id)}
                  >
                    Withdraw
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Send Offer Modal */}
      <Modal isOpen={showSend} onClose={() => setShowSend(false)} title="Send an Offer" size="md">
        <div className="max-h-[62vh] overflow-y-auto pr-1 -mr-1 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Buyer</label>

            {selectedBuyer ? (
              // Chosen buyer chip
              <div className="flex items-center gap-3 border-2 border-[#e84545] rounded-2xl px-3.5 py-2.5 bg-white">
                <Avatar name={selectedBuyer.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedBuyer.name}</p>
                  <p className="text-xs text-gray-400 truncate">{selectedBuyer.email}</p>
                </div>
                <button type="button" onClick={clearBuyer} className="text-gray-400 hover:text-red-500 flex-shrink-0" title="Change buyer">
                  <i className="fa fa-times" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <i className="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search buyer by name or email..."
                    value={buyerQuery}
                    onChange={(e) => { setBuyerQuery(e.target.value); setBuyerOpen(true); }}
                    onFocus={() => setBuyerOpen(true)}
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#e84545] transition-all"
                  />
                </div>

                {buyerOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto py-1">
                      {buyerLoading ? (
                        <p className="text-xs text-gray-400 text-center py-5"><i className="fa fa-spinner fa-spin mr-1.5" /> Searching…</p>
                      ) : buyerResults.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-5">
                          {buyerQuery ? 'No buyers found' : 'Type to search buyers'}
                        </p>
                      ) : (
                        buyerResults.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => pickBuyer(b)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                          >
                            <Avatar name={b.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                              <p className="text-xs text-gray-400 truncate">{b.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <Input
            label="Offer Title"
            placeholder="e.g. Logo Design Package"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($)"
              type="number"
              placeholder="e.g. 250"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <Input
              label="Delivery (days)"
              type="number"
              placeholder="e.g. 5"
              value={form.delivery_days}
              onChange={(e) => setForm((f) => ({ ...f, delivery_days: e.target.value }))}
            />
          </div>
          <RichTextEditor
            label="Description"
            placeholder="Describe your offer..."
            value={form.description}
            onChange={(html) => setForm((f) => ({ ...f, description: html }))}
            variant="full"
          />
        </div>

        {err && <p className="text-xs text-red-500 mt-3">{err}</p>}

        <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
          <Button variant="outline" fullWidth onClick={() => setShowSend(false)} disabled={sending}>Cancel</Button>
          <Button fullWidth onClick={handleSend} loading={sending}>Send Offer</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { RichTextView } from '@/components/ui/RichTextEditor';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { buyerOfferApi } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

interface Offer {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  delivery_days: number | null;
  status: string;
  created_at?: string;
  createdAt?: string;
  seller: { id: number; name: string } | null;
}

const sentOn = (o: Offer) => o.created_at || o.createdAt || '';

type Tab = 'pending' | 'accepted' | 'declined';

export default function BuyerOffersPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('pending');
  const [offers, setOffers]         = useState<Offer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<number | null>(null);
  const [viewOffer, setViewOffer]   = useState<Offer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await buyerOfferApi.list({ limit: 100 });
      setOffers(res.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = (s: Tab) => offers.filter((o) => (o.status || '').toLowerCase() === s);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending',  label: 'Pending',  count: byStatus('pending').length  },
    { key: 'accepted', label: 'Accepted', count: byStatus('accepted').length },
    { key: 'declined', label: 'Declined', count: byStatus('declined').length },
  ];

  const currentOffers = byStatus(activeTab);

  const handleAccept = async (id: number) => {
    setActionId(id);
    try {
      await buyerOfferApi.accept(id);
      toast.success('Offer accepted');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (id: number) => {
    setActionId(id);
    try {
      await buyerOfferApi.decline(id);
      toast.success('Offer declined');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline offer');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout role="BUYER" title="Offers">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
              activeTab === t.key
                ? 'border-b-2 border-[#e84545] text-[#e84545]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
            <span className={`h-5 min-w-[20px] px-1 rounded-full text-xs flex items-center justify-center ${activeTab === t.key ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text="Loading offers..." />
      ) : currentOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="fa fa-inbox text-3xl mb-3" />
          <p className="text-sm">No {activeTab} offers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentOffers.map((o) => (
            <Card key={o.id} padding="md">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Avatar name={o.seller?.name || 'Seller'} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{o.seller?.name || 'Seller'}</p>
                    <p className="text-xs text-gray-400">Re: {o.title}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {o.description
                    ? <RichTextView html={o.description} />
                    : <p className="text-sm text-gray-400 italic">No message</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {o.delivery_days ? `${o.delivery_days} day delivery` : ''}
                    {sentOn(o) ? `${o.delivery_days ? ' · ' : ''}${formatDate(sentOn(o))}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#e84545]">{formatCurrency(o.amount)}</p>
                  <p className="text-xs text-gray-400">Offered price</p>
                  <button
                    onClick={() => setViewOffer(o)}
                    className="mt-1.5 text-xs font-medium text-[#e84545] hover:underline"
                  >
                    <i className="fa fa-eye mr-1" />View
                  </button>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                    loading={actionId === o.id}
                    onClick={() => handleAccept(o.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    disabled={actionId === o.id}
                    onClick={() => handleDecline(o.id)}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {activeTab === 'accepted' && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600">
                    <i className="fa fa-check-circle text-sm" />
                    <span className="text-sm font-medium">Accepted</span>
                  </div>
                </div>
              )}

              {activeTab === 'declined' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-red-500">
                  <i className="fa fa-times-circle text-sm" />
                  <span className="text-sm font-medium">Declined</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Offer detail modal */}
      <Modal isOpen={!!viewOffer} onClose={() => setViewOffer(null)} title="Offer Details" size="md">
        {viewOffer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewOffer.seller?.name || 'Seller'} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{viewOffer.seller?.name || 'Seller'}</p>
                <p className="text-xs text-gray-400">sent you an offer</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Title</p>
              <p className="text-sm font-medium text-gray-900">{viewOffer.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="text-lg font-bold text-[#e84545]">{formatCurrency(viewOffer.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Delivery</p>
                <p className="text-lg font-bold text-gray-800">{viewOffer.delivery_days ? `${viewOffer.delivery_days} days` : '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
              {viewOffer.description
                ? <RichTextView html={viewOffer.description} />
                : <p className="text-sm text-gray-400 italic">No message</p>}
            </div>

            {sentOn(viewOffer) && <p className="text-xs text-gray-400">Sent {formatDate(sentOn(viewOffer))}</p>}

            {(viewOffer.status || '').toLowerCase() === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  fullWidth
                  className="bg-green-600 hover:bg-green-700 text-white border-0"
                  loading={actionId === viewOffer.id}
                  onClick={async () => { await handleAccept(viewOffer.id); setViewOffer(null); }}
                >
                  Accept Offer
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  disabled={actionId === viewOffer.id}
                  onClick={async () => { await handleDecline(viewOffer.id); setViewOffer(null); }}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

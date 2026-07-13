'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';
import { sellerBidApi, sellerJobApi } from '@/lib/adminApi';

interface BidJob {
  id: number;
  title: string;
  budget_min: number;
  budget_max: number;
  bids_count: number;
  status: string;
  created_at: string;
  buyer: { id: number; name: string } | null;
}

interface Bid {
  id: number;
  job_id: number;
  amount: string;
  delivery_days: number;
  proposal: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  job: BidJob | null;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  success_rate: number;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700', icon: 'fa-clock-o'      },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700',   icon: 'fa-check-circle' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',       icon: 'fa-times-circle' },
};

const TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

function SkeletonRow() {
  return (
    <div className="p-5 border-b border-gray-50 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="flex gap-4 mt-3">
            {[1,2,3,4].map(i => <div key={i} className="h-6 w-16 bg-gray-200 rounded" />)}
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}

export default function SellerBidsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [bids,      setBids]      = useState<Bid[]>([]);
  const [stats,     setStats]     = useState<Stats>({ total: 0, pending: 0, accepted: 0, success_rate: 0 });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState<Bid | null>(null);

  // Withdraw state
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const fetchBids = useCallback(async (tab: string) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (tab !== 'All') params.status = tab.toLowerCase();
      const res = await sellerBidApi.list(params);
      setBids(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBids(activeTab); }, [activeTab, fetchBids]);

  const handleWithdraw = async () => {
    if (!selected) return;
    setWithdrawing(true);
    setWithdrawMsg('');
    try {
      await sellerJobApi.withdrawBid(selected.job_id);
      setWithdrawMsg('Bid withdrawn successfully');
      setTimeout(() => {
        setSelected(null);
        setWithdrawMsg('');
        fetchBids(activeTab);
      }, 1000);
    } catch (err: unknown) {
      setWithdrawMsg(err instanceof Error ? err.message : 'Failed to withdraw bid');
    } finally {
      setWithdrawing(false);
    }
  };

  const statCards = [
    { label: 'Total Bids',   value: stats.total,        icon: 'fa-gavel',        color: 'text-blue-600 bg-blue-50'   },
    { label: 'Pending',      value: stats.pending,       icon: 'fa-clock-o',      color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Accepted',     value: stats.accepted,      icon: 'fa-check-circle', color: 'text-green-600 bg-green-50' },
    { label: 'Success Rate', value: `${stats.success_rate}%`, icon: 'fa-line-chart', color: 'text-[#e84545] bg-red-50' },
  ];

  return (
    <DashboardLayout role="SELLER" title="My Bids">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <i className={`fa ${s.icon} text-base`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bids list */}
      <Card padding="none">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <i className="fa fa-exclamation-circle" />
            <span>{error}</span>
            <button onClick={() => fetchBids(activeTab)} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-50">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : bids.length === 0 && !error
              ? (
                <div className="py-16 text-center">
                  <i className="fa fa-gavel text-4xl text-gray-200 mb-3 block" />
                  <p className="text-gray-400 text-sm">No bids found</p>
                </div>
              )
              : bids.map((bid) => {
                  const cfg = STATUS_CFG[bid.status] || STATUS_CFG.pending;
                  const buyerName = bid.job?.buyer?.name || 'Buyer';
                  return (
                    <div key={bid.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <i className={`fa ${cfg.icon} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{bid.job?.title || 'Job'}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Avatar name={buyerName} size="xs" />
                                <span className="text-xs text-gray-400">{buyerName}</span>
                                <span className="text-gray-300">.</span>
                                <span className="text-xs text-gray-400">{formatTimeAgo(bid.createdAt)}</span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                              <i className={`fa ${cfg.icon} text-xs`} />
                              {cfg.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                            <div>
                              <p className="text-xs text-gray-400">Your Bid</p>
                              <p className="font-bold text-[#e84545] text-sm">{formatCurrency(Number(bid.amount))}</p>
                            </div>
                            {bid.job && (
                              <div>
                                <p className="text-xs text-gray-400">Budget</p>
                                <p className="text-sm text-gray-600">{formatCurrency(bid.job.budget_min)} - {formatCurrency(bid.job.budget_max)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-400">Delivery</p>
                              <p className="text-sm text-gray-600">{bid.delivery_days} days</p>
                            </div>
                            {bid.job && (
                              <div>
                                <p className="text-xs text-gray-400">Total Bids</p>
                                <p className="text-sm text-gray-600">{bid.job.bids_count} bids</p>
                              </div>
                            )}
                          </div>

                          {bid.proposal && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-1">{bid.proposal}</p>
                          )}
                        </div>

                        <button
                          onClick={() => setSelected(bid)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                        >
                          <i className="fa fa-eye text-sm" />
                        </button>
                      </div>
                    </div>
                  );
                })
          }
        </div>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => { setSelected(null); setWithdrawMsg(''); }} title="Bid Details" size="md">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">{selected.job?.title || 'Job'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={selected.job?.buyer?.name || 'Buyer'} size="xs" />
                <span className="text-sm text-gray-500">{selected.job?.buyer?.name || 'Buyer'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Your Bid',  value: formatCurrency(Number(selected.amount)), highlight: true },
                { label: 'Delivery',  value: `${selected.delivery_days} days`                        },
                { label: 'Status',    value: STATUS_CFG[selected.status]?.label || selected.status   },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${item.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {selected.job && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Budget</p>
                <p className="text-sm text-gray-700">{formatCurrency(selected.job.budget_min)} - {formatCurrency(selected.job.budget_max)}</p>
              </div>
            )}

            {selected.proposal && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Proposal</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{selected.proposal}</p>
              </div>
            )}

            {selected.job && (
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Total bids on job: {selected.job.bids_count}</span>
              </div>
            )}

            {withdrawMsg && (
              <p className={`text-sm text-center font-medium ${withdrawMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {withdrawMsg}
              </p>
            )}

            {selected.status === 'pending' && selected.job?.status === 'OPEN' && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw Bid'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

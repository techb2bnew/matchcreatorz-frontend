'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';

const BIDS = [
  {
    id: 1,
    jobTitle: 'Need a Logo Design for Tech Startup',
    buyerName: 'Alice Johnson',
    bidAmount: 250,
    deliveryDays: 5,
    proposal: 'I have 5+ years of experience in logo design and branding. I will deliver 3 unique concepts with unlimited revisions.',
    connectsUsed: 2,
    status: 'PENDING',
    postedAt: '2024-06-25T10:00:00Z',
    jobBudget: { min: 200, max: 400 },
    totalBids: 8,
  },
  {
    id: 2,
    jobTitle: 'Social Media Content Creator for 3 Months',
    buyerName: 'Carlos Ruiz',
    bidAmount: 800,
    deliveryDays: 90,
    proposal: 'I specialize in social media content strategy and creation. I will handle all platforms with engaging content.',
    connectsUsed: 3,
    status: 'ACCEPTED',
    postedAt: '2024-06-20T14:30:00Z',
    jobBudget: { min: 600, max: 1000 },
    totalBids: 12,
  },
  {
    id: 3,
    jobTitle: 'WordPress Website Development',
    buyerName: 'Eva Green',
    bidAmount: 500,
    deliveryDays: 14,
    proposal: 'I can build a fully responsive WordPress website with custom design, SEO optimization, and fast loading speed.',
    connectsUsed: 2,
    status: 'REJECTED',
    postedAt: '2024-06-15T09:00:00Z',
    jobBudget: { min: 300, max: 700 },
    totalBids: 20,
  },
  {
    id: 4,
    jobTitle: 'Video Editing for YouTube Channel',
    buyerName: 'John Doe',
    bidAmount: 150,
    deliveryDays: 3,
    proposal: 'Professional video editor with expertise in YouTube content. I will deliver engaging, well-paced videos.',
    connectsUsed: 2,
    status: 'PENDING',
    postedAt: '2024-06-28T11:00:00Z',
    jobBudget: { min: 100, max: 250 },
    totalBids: 5,
  },
  {
    id: 5,
    jobTitle: 'Email Marketing Campaign Setup',
    buyerName: 'Maria Chen',
    bidAmount: 350,
    deliveryDays: 7,
    proposal: 'I have managed email campaigns for 50+ businesses. I will set up automated flows, templates, and analytics.',
    connectsUsed: 2,
    status: 'WITHDRAWN',
    postedAt: '2024-06-10T16:00:00Z',
    jobBudget: { min: 200, max: 500 },
    totalBids: 15,
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: 'fa-clock-o' },
  ACCEPTED:  { label: 'Accepted',  color: 'bg-green-100 text-green-700',   icon: 'fa-check-circle' },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',       icon: 'fa-times-circle' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500',     icon: 'fa-times-circle' },
};

const TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

export default function SellerBidsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected] = useState<typeof BIDS[0] | null>(null);

  const filtered = BIDS.filter((b) =>
    activeTab === 'All' ? true : b.status === activeTab.toUpperCase()
  );

  const stats = [
    { label: 'Total Bids',    value: BIDS.length,                                           icon: 'fa-gavel',        color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending',       value: BIDS.filter((b) => b.status === 'PENDING').length,     icon: 'fa-clock-o',      color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Accepted',      value: BIDS.filter((b) => b.status === 'ACCEPTED').length,    icon: 'fa-check-circle', color: 'text-green-600 bg-green-50' },
    { label: 'Success Rate',  value: '20%',                                                  icon: 'fa-line-chart',   color: 'text-[#e84545] bg-red-50' },
  ];

  return (
    <DashboardLayout role="SELLER" title="My Bids">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          return (
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
          );
        })}
      </div>

      {/* Bids list */}
      <Card padding="none">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-gray-100">
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t}
              {t !== 'All' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {BIDS.filter((b) => b.status === t.toUpperCase()).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <i className="fa fa-gavel text-lg text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No bids found</p>
            </div>
          ) : (
            filtered.map((bid) => {
              const cfg = statusConfig[bid.status];
              return (
                <div key={bid.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <i className={`fa ${cfg.icon} text-sm`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{bid.jobTitle}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar name={bid.buyerName} size="xs" />
                            <span className="text-xs text-gray-400">{bid.buyerName}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{formatTimeAgo(bid.postedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                            <i className={`fa ${cfg.icon} text-xs`} />
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div>
                          <p className="text-xs text-gray-400">Your Bid</p>
                          <p className="font-bold text-[#e84545] text-sm">{formatCurrency(bid.bidAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Budget</p>
                          <p className="text-sm text-gray-600">{formatCurrency(bid.jobBudget.min)} – {formatCurrency(bid.jobBudget.max)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Delivery</p>
                          <p className="text-sm text-gray-600">{bid.deliveryDays} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total Bids</p>
                          <p className="text-sm text-gray-600">{bid.totalBids} bids</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Connects Used</p>
                          <p className="text-sm text-gray-600">{bid.connectsUsed}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">{bid.proposal}</p>
                    </div>

                    <button onClick={() => setSelected(bid)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0">
                      <i className="fa fa-eye text-sm" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Bid Details" size="md">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">{selected.jobTitle}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={selected.buyerName} size="xs" />
                <span className="text-sm text-gray-500">{selected.buyerName}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Your Bid',   value: formatCurrency(selected.bidAmount),  highlight: true },
                { label: 'Delivery',   value: `${selected.deliveryDays} days` },
                { label: 'Status',     value: statusConfig[selected.status].label },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${item.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Budget</p>
              <p className="text-sm text-gray-700">{formatCurrency(selected.jobBudget.min)} – {formatCurrency(selected.jobBudget.max)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Proposal</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{selected.proposal}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Connects used: {selected.connectsUsed}</span>
              <span>Total bids on job: {selected.totalBids}</span>
            </div>

            {selected.status === 'PENDING' && (
              <div className="flex gap-2 pt-1">
                <Button variant="outline" fullWidth className="text-red-600 border-red-200 hover:bg-red-50">
                  Withdraw Bid
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

const receivedOffers = [
  { id: 1, buyer: 'Alice Johnson', ref: 'Logo Design for Tech Startup', price: 280, message: 'Hi, I love your portfolio. Can you do this for my startup? Budget is flexible.' },
  { id: 2, buyer: 'Carlos Ruiz',   ref: 'Website Redesign Project',      price: 1200, message: 'We need a full redesign of our company website. Looking for someone reliable.' },
  { id: 3, buyer: 'Eva Green',     ref: 'Instagram Post Designs x10',    price: 150, message: 'Need 10 custom Instagram post designs for my fashion brand this week.' },
];

const sentOffers = [
  { id: 1, buyer: 'Frank Miller', ref: 'Brand Identity Package',  price: 900,  status: 'PENDING',  sentAt: '2024-11-09' },
  { id: 2, buyer: 'Grace Hopper', ref: 'Email Newsletter Design', price: 200,  status: 'ACCEPTED', sentAt: '2024-11-07' },
  { id: 3, buyer: 'Henry Ford',   ref: 'Product Demo Video',      price: 750,  status: 'DECLINED', sentAt: '2024-11-05' },
];

const sentStatusClass = (s: string) => {
  if (s === 'ACCEPTED') return 'bg-green-100 text-green-700';
  if (s === 'DECLINED') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default function SellerOffersPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  return (
    <DashboardLayout role="SELLER" title="Offers">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['received', 'sent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-3 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'border-b-2 border-[#e84545] text-[#e84545]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'received' ? 'Received Offers' : 'Sent Offers'}
          </button>
        ))}
      </div>

      {/* Received Offers */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedOffers.map((o) => (
            <Card key={o.id} padding="md">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Avatar name={o.buyer} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{o.buyer}</p>
                    <p className="text-xs text-gray-400">Re: {o.ref}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 italic">"{o.message}"</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#e84545]">{formatCurrency(o.price)}</p>
                  <p className="text-xs text-gray-400">Offered price</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0">Accept</Button>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">Decline</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sent Offers */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentOffers.map((o) => (
            <Card key={o.id} padding="md">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Avatar name={o.buyer} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{o.buyer}</p>
                    <p className="text-xs text-gray-400">Re: {o.ref}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${sentStatusClass(o.status)}`}>
                    {o.status}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-[#e84545]">{formatCurrency(o.price)}</p>
                  <p className="text-xs text-gray-400">Sent {formatDate(o.sentAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

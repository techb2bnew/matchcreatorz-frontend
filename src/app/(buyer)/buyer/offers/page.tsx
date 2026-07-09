'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

const pendingOffers = [
  { id: 1, seller: 'Bob Smith',    category: 'Designer',  ref: 'Logo Design for My Bakery', price: 220,  message: 'I can create a beautiful logo with 3 concepts and unlimited revisions. Delivery in 3 days.', date: '2024-11-10' },
  { id: 2, seller: 'Frank Miller', category: 'Developer', ref: 'WordPress Blog Setup',       price: 380,  message: 'Full setup with premium Divi theme, SEO plugin, and 6 months free support included.', date: '2024-11-09' },
];

const acceptedOffers = [
  { id: 3, seller: 'Diana Prince', category: 'Developer', ref: 'React Dashboard Project', price: 1200, message: 'React + TypeScript dashboard with auth, charts, and API integration. 2 week delivery.', date: '2024-11-07' },
];

const declinedOffers = [
  { id: 4, seller: 'Grace Hopper', category: 'Writer', ref: 'Blog Content Package', price: 450, message: '10 SEO articles, each 1500+ words, with keyword research and meta descriptions.', date: '2024-11-05' },
];

type Tab = 'pending' | 'accepted' | 'declined';

export default function BuyerOffersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending',  label: 'Pending',  count: pendingOffers.length  },
    { key: 'accepted', label: 'Accepted', count: acceptedOffers.length },
    { key: 'declined', label: 'Declined', count: declinedOffers.length },
  ];

  const currentOffers =
    activeTab === 'pending'  ? pendingOffers  :
    activeTab === 'accepted' ? acceptedOffers :
    declinedOffers;

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

      {/* Offer cards */}
      <div className="space-y-4">
        {currentOffers.map((o) => (
          <Card key={o.id} padding="md">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Avatar name={o.seller} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">{o.seller}</p>
                  <p className="text-xs text-gray-400">{o.category}</p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#e84545] font-medium mb-1">Re: {o.ref}</p>
                <p className="text-sm text-gray-600 italic">"{o.message}"</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(o.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-[#e84545]">{formatCurrency(o.price)}</p>
                <p className="text-xs text-gray-400">Offered price</p>
              </div>
            </div>

            {/* Actions */}
            {activeTab === 'pending' && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0">Accept</Button>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">Decline</Button>
                <Button variant="outline" size="sm">Counter</Button>
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-green-600">
                  <i className="fa fa-check-circle text-sm" />
                  <span className="text-sm font-medium">Accepted</span>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">View Booking</Button>
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
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { getBookingStatusColor, formatCurrency, formatDate } from '@/lib/utils';

const bookings = [
  { id: 1, buyer: 'Alice Johnson', service: 'Logo Design',    amount: 250,  platformFee: 25,  status: 'Ongoing',                   date: '2024-11-10' },
  { id: 2, buyer: 'Carlos Ruiz',   service: 'Icon Set',       amount: 120,  platformFee: 12,  status: 'Amidst-Completion-Process',  date: '2024-11-08' },
  { id: 3, buyer: 'Eva Green',     service: 'Brand Identity', amount: 800,  platformFee: 80,  status: 'Completed',                  date: '2024-11-05' },
  { id: 4, buyer: 'Grace Hopper',  service: 'UI Design',      amount: 600,  platformFee: 60,  status: 'In-dispute',                 date: '2024-11-02' },
  { id: 5, buyer: 'Iris West',     service: 'Illustration',   amount: 300,  platformFee: 30,  status: 'Cancelled',                  date: '2024-10-28' },
];

const tabs = ['Active', 'Completed', 'Cancelled'];

export default function SellerBookingsPage() {
  const [tab, setTab] = useState('Active');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<typeof bookings[0] | null>(null);

  const filtered = bookings.filter((b) => {
    const matchTab = tab === 'Active'
      ? ['Ongoing', 'Amidst-Completion-Process', 'Amidst-Cancellation', 'In-dispute', 'Pending'].includes(b.status)
      : tab === 'Completed' ? b.status === 'Completed' : b.status === 'Cancelled';
    const matchSearch = b.buyer.toLowerCase().includes(search.toLowerCase()) || b.service.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <DashboardLayout role="SELLER" title="My Bookings">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit mb-5">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <Input placeholder="Search by buyer or service..." leftIcon={<i className="fa fa-search text-sm" />} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="space-y-0 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No bookings found</div>
          ) : filtered.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <Avatar name={b.buyer} size="md" />
              <div className="flex-1 min-w-[160px]">
                <p className="font-semibold text-gray-900">{b.service}</p>
                <p className="text-sm text-gray-400">Client: {b.buyer}</p>
                <p className="text-xs text-gray-300 mt-0.5">{formatDate(b.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                <p className="text-xs text-gray-400">+ {formatCurrency(b.platformFee)} fee</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>{b.status}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" leftIcon={<i className="fa fa-eye text-sm" />} onClick={() => setDetail(b)}>Details</Button>
                {b.status === 'Ongoing' && (
                  <Button size="sm" leftIcon={<i className="fa fa-upload text-sm" />}>Mark Complete</Button>
                )}
                {b.status === 'Amidst-Completion-Process' && (
                  <>
                    <Button size="sm" variant="success" leftIcon={<i className="fa fa-check-circle text-sm" />}>Accept</Button>
                    <Button size="sm" variant="danger" leftIcon={<i className="fa fa-times-circle text-sm" />}>Reject</Button>
                  </>
                )}
                {b.status === 'Ongoing' && (
                  <Button size="sm" variant="outline" leftIcon={<i className="fa fa-exclamation-triangle text-sm" />} className="text-orange-500 border-orange-300">Dispute</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Booking #${detail?.id}`}>
        {detail && (
          <div className="space-y-3">
            {[
              { label: 'Service', value: detail.service },
              { label: 'Client', value: detail.buyer },
              { label: 'Amount', value: formatCurrency(detail.amount) },
              { label: 'Platform Fee', value: formatCurrency(detail.platformFee) },
              { label: 'You Receive', value: formatCurrency(detail.amount - detail.platformFee) },
              { label: 'Status', value: detail.status },
              { label: 'Date', value: formatDate(detail.date) },
            ].map((i) => (
              <div key={i.label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{i.label}</span>
                <span className="text-sm font-semibold text-gray-900">{i.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

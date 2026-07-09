'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { getBookingStatusColor, formatCurrency, formatDate } from '@/lib/utils';

const bookings = [
  { id: 1, seller: 'Bob Smith',    service: 'Logo Design',    amount: 250,  platformFee: 25,  status: 'Ongoing',                  date: '2024-11-10' },
  { id: 2, seller: 'Diana Prince', service: 'Web Dev',        amount: 1200, platformFee: 120, status: 'Amidst-Completion-Process', date: '2024-11-08' },
  { id: 3, seller: 'Frank Miller', service: 'SEO Setup',      amount: 400,  platformFee: 40,  status: 'Completed',                 date: '2024-11-05' },
  { id: 4, seller: 'Grace Hopper', service: 'Video Editing',  amount: 800,  platformFee: 80,  status: 'In-dispute',                date: '2024-11-02' },
  { id: 5, seller: 'Henry Ford',   service: 'Copywriting',    amount: 150,  platformFee: 15,  status: 'Cancelled',                 date: '2024-10-28' },
];

const tabs = ['Active', 'Completed', 'Cancelled'];

export default function BuyerBookingsPage() {
  const [tab, setTab] = useState('Active');
  const [detail, setDetail] = useState<typeof bookings[0] | null>(null);

  const filtered = bookings.filter((b) =>
    tab === 'Active'
      ? ['Ongoing', 'Amidst-Completion-Process', 'Amidst-Cancellation', 'In-dispute', 'Pending'].includes(b.status)
      : tab === 'Completed' ? b.status === 'Completed' : b.status === 'Cancelled'
  );

  return (
    <DashboardLayout role="BUYER" title="My Bookings">
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit mb-5">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="space-y-0 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No bookings found</div>
          ) : filtered.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <Avatar name={b.seller} size="md" />
              <div className="flex-1 min-w-[160px]">
                <p className="font-semibold text-gray-900">{b.service}</p>
                <p className="text-sm text-gray-400">Seller: {b.seller}</p>
                <p className="text-xs text-gray-300 mt-0.5">{formatDate(b.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(b.amount + b.platformFee)}</p>
                <p className="text-xs text-gray-400">incl. {formatCurrency(b.platformFee)} fee</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>{b.status}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" leftIcon={<i className="fa fa-eye text-sm" />} onClick={() => setDetail(b)}>Details</Button>
                {b.status === 'Amidst-Completion-Process' && (
                  <>
                    <Button size="sm" variant="success" leftIcon={<i className="fa fa-check-circle text-sm" />}>Accept</Button>
                    <Button size="sm" variant="danger" leftIcon={<i className="fa fa-times-circle text-sm" />}>Reject</Button>
                  </>
                )}
                {b.status === 'Ongoing' && (
                  <Button size="sm" variant="outline" leftIcon={<i className="fa fa-exclamation-triangle text-sm" />} className="text-orange-500 border-orange-300">Cancel</Button>
                )}
                {b.status === 'Completed' && (
                  <Button size="sm" variant="outline" leftIcon={<i className="fa fa-star text-sm" />}>Rate</Button>
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
              { label: 'Service',        value: detail.service },
              { label: 'Seller',         value: detail.seller },
              { label: 'Service Amount', value: formatCurrency(detail.amount) },
              { label: 'Platform Fee',   value: formatCurrency(detail.platformFee) },
              { label: 'Total Paid',     value: formatCurrency(detail.amount + detail.platformFee) },
              { label: 'Status',         value: detail.status },
              { label: 'Date',           value: formatDate(detail.date) },
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

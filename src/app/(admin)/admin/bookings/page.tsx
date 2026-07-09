'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { getBookingStatusColor, formatCurrency, formatDate } from '@/lib/utils';

const bookings = [
  { id: 1, buyer: 'Alice Johnson', seller: 'Bob Smith',   service: 'Logo Design',   amount: 250,  platformFee: 25,  total: 275,  status: 'Ongoing',     date: '2024-11-10' },
  { id: 2, buyer: 'Carlos Ruiz',   seller: 'Diana Prince', service: 'Web Dev',       amount: 1200, platformFee: 120, total: 1320, status: 'Completed',   date: '2024-11-09' },
  { id: 3, buyer: 'Eva Green',     seller: 'Frank Miller', service: 'SEO Setup',     amount: 400,  platformFee: 40,  total: 440,  status: 'Pending',     date: '2024-11-08' },
  { id: 4, buyer: 'Grace Hopper',  seller: 'Henry Ford',   service: 'Video Editing', amount: 800,  platformFee: 80,  total: 880,  status: 'In-dispute',  date: '2024-11-07' },
  { id: 5, buyer: 'Iris West',     seller: 'Jake Long',    service: 'Copywriting',   amount: 150,  platformFee: 15,  total: 165,  status: 'Cancelled',   date: '2024-11-06' },
];

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof bookings[0] | null>(null);

  const filtered = bookings.filter((b) =>
    b.buyer.toLowerCase().includes(search.toLowerCase()) ||
    b.seller.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="ADMIN" title="Bookings">
      <Card padding="none">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input placeholder="Search bookings..." leftIcon={<i className="fa fa-search text-sm" />} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            {['All', 'Ongoing', 'Completed', 'Pending', 'In-dispute', 'Cancelled'].map((f) => (
              <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['ID', 'Buyer', 'Seller', 'Service', 'Amount', 'Fee', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={b.buyer} size="xs" />
                      <span className="text-gray-700">{b.buyer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={b.seller} size="xs" />
                      <span className="text-gray-700">{b.seller}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.service}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatCurrency(b.platformFee)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(b.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><i className="fa fa-eye text-sm" /></button>
                      {b.status === 'In-dispute' && (
                        <>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"><i className="fa fa-check-circle text-sm" /></button>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><i className="fa fa-times-circle text-sm" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Booking #${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Service', value: selected.service },
                { label: 'Status', value: selected.status },
                { label: 'Buyer', value: selected.buyer },
                { label: 'Seller', value: selected.seller },
                { label: 'Service Amount', value: formatCurrency(selected.amount) },
                { label: 'Platform Fee', value: formatCurrency(selected.platformFee) },
                { label: 'Total Amount', value: formatCurrency(selected.total) },
                { label: 'Date', value: formatDate(selected.date) },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
            {selected.status === 'In-dispute' && (
              <div className="flex gap-3 pt-2">
                <Button variant="success" fullWidth leftIcon={<i className="fa fa-check-circle text-sm" />}>Approve Completion</Button>
                <Button variant="danger" fullWidth leftIcon={<i className="fa fa-times-circle text-sm" />}>Settle Dispute</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

const transactions = [
  { id: 1, type: 'Credit', description: 'Booking #12 - Logo Design',   amount: 225,  date: '2024-11-10', status: 'Paid' },
  { id: 2, type: 'Credit', description: 'Booking #11 - Icon Set',       amount: 108,  date: '2024-11-07', status: 'Paid' },
  { id: 3, type: 'Debit',  description: 'Withdrawal Request',            amount: 500,  date: '2024-11-05', status: 'Paid' },
  { id: 4, type: 'Credit', description: 'Booking #10 - Brand Identity', amount: 720,  date: '2024-11-02', status: 'Paid' },
  { id: 5, type: 'Debit',  description: 'Withdrawal Request',            amount: 1000, date: '2024-10-28', status: 'Paid' },
];

export default function SellerWalletPage() {
  const [withdrawModal, setWithdrawModal] = useState(false);

  return (
    <DashboardLayout role="SELLER" title="Wallet">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Available Balance" value="$2,840"  icon="fa-dollar"    color="red"   change="Ready to withdraw" />
        <StatCard title="Total Earnings"    value="$18,200" icon="fa-arrow-down" color="green" change="All time" />
        <StatCard title="Total Withdrawn"   value="$15,360" icon="fa-arrow-up"  color="blue"  change="All time" />
      </div>

      {/* Withdraw card */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-gray-900">Request Withdrawal</h3>
            <p className="text-sm text-gray-400 mt-0.5">Minimum withdrawal: $50 · Processed within 3-5 business days</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#e84545]">$2,840</p>
            <p className="text-xs text-gray-400">Available</p>
          </div>
          <Button leftIcon={<i className="fa fa-credit-card text-sm" />} onClick={() => setWithdrawModal(true)}>
            Withdraw Funds
          </Button>
        </div>
      </Card>

      {/* Transactions */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardTitle>Transaction History</CardTitle>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`p-2.5 rounded-xl ${t.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                {t.type === 'Credit'
                  ? <i className="fa fa-arrow-down text-base text-green-600" />
                  : <i className="fa fa-arrow-up text-base text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
              </div>
              <p className={`font-bold text-base ${t.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'Credit' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModal} onClose={() => setWithdrawModal(false)} title="Request Withdrawal" size="md">
        <div className="space-y-4">
          <div className="bg-[#fff0f0] rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Available Balance</p>
            <p className="text-2xl font-black text-[#e84545]">$2,840</p>
          </div>
          <Input label="Amount" type="number" placeholder="Enter amount" leftIcon={<i className="fa fa-dollar text-sm" />} required />
          <Input label="Account Holder Name" placeholder="First Last" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" placeholder="First" required />
            <Input label="Last Name" placeholder="Last" required />
          </div>
          <Input label="Account Number" placeholder="Account number" required />
          <Input label="IBAN" placeholder="IBAN number" />
          <Input label="SWIFT / BIC" placeholder="SWIFT code" />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setWithdrawModal(false)}>Cancel</Button>
            <Button fullWidth>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

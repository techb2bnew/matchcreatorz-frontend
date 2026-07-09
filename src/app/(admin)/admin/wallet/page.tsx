'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';

const withdrawals = [
  { id: 1, name: 'Bob Smith',    amount: 840,  iban: 'GB29NWBK60161331926819', date: '2024-11-10', status: 'Pending' },
  { id: 2, name: 'Diana Prince', amount: 1200, iban: 'DE89370400440532013000', date: '2024-11-09', status: 'Pending' },
  { id: 3, name: 'Frank Miller', amount: 360,  iban: 'FR7630006000011234567890189', date: '2024-11-08', status: 'Pending' },
  { id: 4, name: 'Jake Long',    amount: 2100, iban: 'ES9121000418450200051332', date: '2024-11-07', status: 'Approved' },
  { id: 5, name: 'Iris West',    amount: 500,  iban: 'IT60X0542811101000000123456', date: '2024-11-06', status: 'Rejected' },
];

export default function AdminWalletPage() {
  const [selected, setSelected] = useState<typeof withdrawals[0] | null>(null);

  const statusColor: Record<string, string> = {
    Pending:  'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <DashboardLayout role="ADMIN" title="Wallet & Withdrawals">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Payouts"   value="$84,200" icon="fa-dollar" color="red"    change="8% this month" />
        <StatCard title="This Month"      value="$12,400" icon="fa-line-chart"  color="green"  change="12% vs last" />
        <StatCard title="Pending Requests" value="3"      icon="fa-clock-o"       color="orange" />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <CardTitle>Withdrawal Requests</CardTitle>
          <div className="flex gap-2">
            {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
              <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Seller', 'Amount', 'IBAN', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={w.name} size="sm" />
                      <span className="font-medium text-gray-900">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(w.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[180px]">{w.iban}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(w.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[w.status]}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(w)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><i className="fa fa-eye text-sm" /></button>
                      {w.status === 'Pending' && (
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

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Withdrawal Details">
        {selected && (
          <div className="space-y-3">
            {[
              { label: 'Seller', value: selected.name },
              { label: 'Amount', value: formatCurrency(selected.amount) },
              { label: 'IBAN', value: selected.iban },
              { label: 'Request Date', value: formatDate(selected.date) },
              { label: 'Status', value: selected.status },
            ].map((i) => (
              <div key={i.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{i.label}</span>
                <span className="text-sm font-medium text-gray-900">{i.value}</span>
              </div>
            ))}
            {selected.status === 'Pending' && (
              <div className="flex gap-3 pt-2">
                <Button variant="success" fullWidth>Approve & Transfer</Button>
                <Button variant="danger" fullWidth>Reject</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

const pastNotifications = [
  { id: 1, title: 'New Feature Launch',        target: 'All Users',    sentTo: 1240, date: '2024-11-10' },
  { id: 2, title: 'Payout Update',             target: 'Sellers Only', sentTo: 380,  date: '2024-11-08' },
  { id: 3, title: 'Holiday Discount',          target: 'Buyers Only',  sentTo: 860,  date: '2024-11-05' },
  { id: 4, title: 'System Maintenance Notice', target: 'All Users',    sentTo: 1240, date: '2024-11-01' },
  { id: 5, title: 'Verification Reminder',     target: 'Sellers Only', sentTo: 45,   date: '2024-10-28' },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');

  return (
    <DashboardLayout role="ADMIN" title="Notifications">
      {/* Send Broadcast */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa fa-bell text-base text-[#e84545]" />
          <CardTitle>Send Broadcast</CardTitle>
        </div>
        <div className="space-y-4">
          <Input
            label="Notification Title"
            placeholder="e.g. New Feature Launch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              rows={4}
              placeholder="Write your broadcast message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-4">
              {[
                { value: 'all',     label: 'All Users'    },
                { value: 'sellers', label: 'Sellers Only' },
                { value: 'buyers',  label: 'Buyers Only'  },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    value={opt.value}
                    checked={target === opt.value}
                    onChange={() => setTarget(opt.value)}
                    className="accent-[#e84545]"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button fullWidth leftIcon={<i className="fa fa-paper-plane text-sm" />}>Send Broadcast</Button>
        </div>
      </Card>

      {/* Past Notifications */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardTitle>Past Notifications</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Title', 'Target', 'Sent To', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pastNotifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{n.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{n.target}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{n.sentTo.toLocaleString()} users</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(n.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

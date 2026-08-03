'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { adminBroadcastApi, AdminBroadcast } from '@/lib/adminApi';
import { formatTimeAgo, truncate } from '@/lib/utils';

type Audience = 'ALL' | 'SELLER' | 'BUYER';

const AUDIENCES: { value: Audience; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Everyone', icon: 'fa-globe' },
  { value: 'SELLER', label: 'Sellers only', icon: 'fa-briefcase' },
  { value: 'BUYER', label: 'Buyers only', icon: 'fa-users' },
];

const AUDIENCE_BADGE: Record<Audience, string> = {
  ALL: 'bg-gray-100 text-gray-600',
  SELLER: 'bg-blue-100 text-blue-600',
  BUYER: 'bg-green-100 text-green-600',
};

const HISTORY_LIMIT = 20;

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('ALL');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<AdminBroadcast[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadHistory = useCallback(async (pg: number) => {
    setHistoryLoading(true);
    try {
      const res = await adminBroadcastApi.list({ page: pg, limit: HISTORY_LIMIT });
      const nextTotal = res.meta?.total ?? res.pagination?.total ?? 0;
      setHistory((prev) => (pg === 1 ? res.data : [...prev, ...res.data]));
      setTotal(nextTotal);
      setPage(pg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load broadcast history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; loadHistory awaits the API call before touching state, so nothing sets synchronously during this effect's render
    loadHistory(1);
  }, [loadHistory]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label ?? audience;
    if (!window.confirm(`Send this announcement to ${audienceLabel}? This cannot be undone.`)) {
      return;
    }

    setSending(true);
    try {
      const res = await adminBroadcastApi.send({
        title: title.trim(),
        body: body.trim(),
        audience,
      });
      toast.success(res.message || 'Broadcast sent');
      setTitle('');
      setBody('');
      loadHistory(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;
  const canLoadMore = history.length < total;

  return (
    <DashboardLayout role="ADMIN" title="Broadcast">
      <div className="flex flex-col gap-6">
        <Card className="!bg-white" padding="md">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Compose announcement</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                This sends an in-app notification and push alert to every targeted, active user. There is no
                preview or undo.
              </p>
            </div>

            <Input
              label="Title"
              placeholder="e.g. Scheduled maintenance tonight"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement..."
                className="w-full bg-white border border-gray-200 text-sm text-gray-900 rounded-xl px-4 py-3 transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e84545]/30 focus:border-[#e84545] resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Audience</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => {
                  const active = audience === a.value;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                        active ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <i className={`fa ${a.icon}`} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" loading={sending} disabled={!canSend} onClick={handleSend}>
                Send Broadcast
              </Button>
            </div>
          </div>
        </Card>

        <Card className="!bg-white" padding="none">
          <div className="px-5 py-4 border-b border-[#e8e8e8]">
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e8e8] text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Audience</th>
                  <th className="px-5 py-3">Recipients</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3">Sent by</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading && history.length === 0 && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="border-b border-[#e8e8e8] animate-pulse">
                        <td className="px-5 py-4">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-48 bg-gray-200 rounded" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-5 w-16 bg-gray-200 rounded-full" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-10 bg-gray-200 rounded" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-20 bg-gray-200 rounded" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {!historyLoading && history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <i className="fa fa-bullhorn text-lg" />
                        </div>
                        <p className="text-sm text-gray-500">No broadcasts sent yet</p>
                      </div>
                    </td>
                  </tr>
                )}

                {history.map((item) => {
                  const sentAt = item.created_at ?? item.createdAt;
                  return (
                    <tr key={item.id} className="border-b border-[#e8e8e8] last:border-b-0">
                      <td className="px-5 py-4 font-medium text-gray-900 max-w-[220px] truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-5 py-4 text-gray-600 max-w-[280px]" title={item.body}>
                        {truncate(item.body, 60)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${AUDIENCE_BADGE[item.audience]}`}
                        >
                          {item.audience}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{item.recipient_count}</td>
                      <td className="px-5 py-4 text-gray-500">{sentAt ? formatTimeAgo(sentAt) : '-'}</td>
                      <td className="px-5 py-4 text-gray-500">{item.admin?.name ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canLoadMore && (
            <div className="flex justify-center px-5 py-4 border-t border-[#e8e8e8]">
              <Button variant="outline" size="sm" loading={historyLoading} onClick={() => loadHistory(page + 1)}>
                Load more
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

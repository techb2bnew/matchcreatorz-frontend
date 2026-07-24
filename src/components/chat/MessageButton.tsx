'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Role = 'buyer' | 'seller' | 'admin';

/**
 * Opens (or creates) a conversation with `recipientId` and navigates to the
 * role's chat page with the conversation pre-selected (?c=<id>).
 * Backend enforces the Option-B rule (bid/offer/booking must exist).
 */
export default function MessageButton({
  recipientId,
  role,
  label = 'Message',
  className,
  size = 'sm',
}: {
  recipientId: number;
  role: Role;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const chatHref = role === 'admin' ? '/admin/support' : `/${role}/chat`;

  const open = async () => {
    if (!recipientId) return;
    setLoading(true);
    try {
      const res = await chatApi.open(recipientId);
      const conv = res?.data;
      if (conv?.id) router.push(`${chatHref}?c=${conv.id}`);
      else router.push(chatHref);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cannot open chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={open}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-semibold border transition disabled:opacity-60',
        size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2',
        'bg-white text-[#e84545] border-red-200 hover:bg-red-50',
        className
      )}
    >
      <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-comment'} text-xs`} />
      {label}
    </button>
  );
}

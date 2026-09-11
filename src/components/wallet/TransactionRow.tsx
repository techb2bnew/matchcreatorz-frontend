'use client';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadReceipt } from '@/lib/receipt';

export interface Txn {
  id: number;
  amount: string | number;
  type: string;
  status?: string | null;
  note?: string | null;
  created_at?: string;
  createdAt?: string;
  gross_amount?: string | number | null;
  platform_fee?: string | number | null;
  stripe_fee?: string | number | null;
  booking_id?: number | null;
  milestone_id?: number | null;
  work_entry_id?: number | null;
}

// A hold is placed first and only resolved later (released on accept, or
// cancelled when it expires) — without this the row would keep reading as
// pending forever, even after the buyer released it.
const HOLD_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'On hold',   cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Released',  cls: 'bg-green-100 text-green-700' },
  failed:    { label: 'Cancelled', cls: 'bg-gray-200 text-gray-600' },
};

/**
 * One transaction row, expandable in place to reveal its fee breakdown.
 *
 * Buyer and seller see the exact same breakdown for the same settlement, so
 * the two panels line up one-to-one and the numbers reconcile:
 *   gross = platform fee + other tax (Stripe) + net to seller
 */
export default function TransactionRow({
  t, label, onCancelHold, cancelling,
}: {
  t: Txn;
  label: string;
  /** Buyer-only: shown as a "Cancel Hold" button while the hold is still pending. */
  onCancelHold?: () => void;
  cancelling?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const amt = Number(t.amount);

  const gross       = t.gross_amount != null ? Number(t.gross_amount) : null;
  const platformFee = t.platform_fee != null ? Number(t.platform_fee) : null;
  const stripeFee   = t.stripe_fee   != null ? Number(t.stripe_fee)   : null;
  const net = gross != null ? gross - (platformFee ?? 0) - (stripeFee ?? 0) : null;

  const isHold = t.type === 'escrow_hold';
  // A card payment never moves the wallet balance, so it's stored with amount
  // 0 — show the gross actually paid instead, so the buyer's row lines up
  // one-to-one with the seller's earning row for the same booking.
  const isCardPayment = t.type === 'escrow_payment';
  const displayAmt = amt !== 0 ? Math.abs(amt) : (gross ?? 0);
  const outgoing = amt < 0 || isCardPayment;

  const badge = isHold ? HOLD_BADGE[t.status || 'pending'] : null;
  const hasBreakdown = gross != null;

  const icon = isHold ? 'fa-clock-o text-amber-500'
    : outgoing ? 'fa-arrow-up text-red-500'
    : 'fa-arrow-down text-green-600';
  const iconBg = isHold ? 'bg-amber-50' : outgoing ? 'bg-red-50' : 'bg-green-50';
  const amtCls = isHold ? 'text-amber-600' : outgoing ? 'text-red-500' : 'text-green-600';

  return (
    <div>
      <div
        className={`flex items-center gap-4 px-5 py-4 ${hasBreakdown ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasBreakdown && setOpen((o) => !o)}
      >
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <i className={`fa ${icon} text-base`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{t.note || label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">{formatDate(t.created_at || t.createdAt || '')}</p>
            {badge && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
            )}
          </div>
        </div>
        {displayAmt > 0 && (
          <p className={`font-bold text-base ${amtCls}`}>
            {isHold ? '' : outgoing ? '-' : '+'}{formatCurrency(displayAmt)}
          </p>
        )}
        {hasBreakdown && <i className={`fa fa-chevron-${open ? 'up' : 'down'} text-xs text-gray-300`} />}
      </div>
      {open && hasBreakdown && (
        <div className="px-5 pb-4 -mt-1">
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span>Gross payment</span>
              <span className="font-medium text-gray-800">{formatCurrency(gross as number)}</span>
            </div>
            {platformFee != null && (
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span className="font-medium text-gray-800">-{formatCurrency(platformFee)}</span>
              </div>
            )}
            {stripeFee != null ? (
              <div className="flex justify-between">
                <span>Other tax (Fee processing)</span>
                <span className="font-medium text-gray-800">-{formatCurrency(stripeFee)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-gray-400">
                <span>Other tax (Fee processing)</span>
                <span>{isHold ? 'charged on release' : '—'}</span>
              </div>
            )}
            {net != null && (
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="font-semibold text-gray-700">Net to seller</span>
                <span className="font-bold text-gray-900">{formatCurrency(net)}</span>
              </div>
            )}
            {isHold && t.status === 'pending' && onCancelHold && (
              <button
                type="button"
                disabled={cancelling}
                onClick={(e) => { e.stopPropagation(); onCancelHold(); }}
                className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-gray-200 text-red-600 font-medium hover:underline disabled:opacity-50"
              >
                <i className="fa fa-ban" /> {cancelling ? 'Cancelling…' : 'Cancel Hold'}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); downloadReceipt(t, { label }); }}
              className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-gray-200 text-[#e84545] font-medium hover:underline"
            >
              <i className="fa fa-download" /> Download Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

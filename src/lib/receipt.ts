import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Txn } from '@/components/wallet/TransactionRow';

/**
 * Generates and downloads a one-page PDF receipt for a single wallet
 * transaction. Runs entirely client-side — each user only ever has their own
 * WalletTransaction rows in hand (the API already scopes /wallet/transactions
 * to the caller), so there's no cross-user data exposure here.
 *
 * Buyer and seller get the same itemization for the same settlement, so the
 * two receipts reconcile against each other.
 */
export function downloadReceipt(t: Txn, { label }: { label: string }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 64;

  const amt = Number(t.amount);
  const credit = amt >= 0;
  const gross = t.gross_amount != null ? Number(t.gross_amount) : null;
  const platformFee = t.platform_fee != null ? Number(t.platform_fee) : null;
  const stripeFee = t.stripe_fee != null ? Number(t.stripe_fee) : null;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MatchCreatorz', margin, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Receipt', margin, y + 18);

  doc.setDrawColor(230);
  y += 34;
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  const row = (k: string, v: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(bold ? 20 : 90);
    doc.text(k, margin, y);
    doc.text(v, pageWidth - margin, y, { align: 'right' });
    y += 20;
  };

  row('Receipt #', String(t.id));
  row('Date', formatDate(t.created_at || t.createdAt || ''));
  row('Description', t.note || label);
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  if (gross != null) row('Gross payment', formatCurrency(gross));
  if (platformFee != null) row('Platform fee', `-${formatCurrency(platformFee)}`);
  if (stripeFee != null) row('Other tax (Fee processing)', `-${formatCurrency(stripeFee)}`);

  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;
  if (gross != null) {
    row('Net to seller', formatCurrency(gross - (platformFee ?? 0) - (stripeFee ?? 0)), true);
  } else {
    row(credit ? 'Amount credited' : 'Amount debited', `${credit ? '+' : '-'}${formatCurrency(Math.abs(amt))}`, true);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is an automatically generated receipt from MatchCreatorz.', margin, y + 40);

  doc.save(`matchcreatorz-receipt-${t.id}.pdf`);
}

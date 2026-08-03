import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Booking.amount holds the agreed $/hr rate for hourly jobs until the seller
 * submits hours, at which point it's overwritten with the computed total —
 * this renders whichever is currently true, with a breakdown once hours are known.
 */
export function formatBookingAmount(b: { amount: number | string; job_type?: string; hours_worked?: number | string | null }): { primary: string; subtitle: string | null } {
  const amount = Number(b.amount);
  if (b.job_type === 'hourly') {
    if (b.hours_worked == null) {
      return { primary: `${formatCurrency(amount)}/hr`, subtitle: 'Rate — total pending submission' };
    }
    const hours = Number(b.hours_worked);
    const rate  = hours > 0 ? amount / hours : 0;
    return { primary: formatCurrency(amount), subtitle: `${hours} hrs × ${formatCurrency(rate)}/hr` };
  }
  return { primary: formatCurrency(amount), subtitle: null };
}

export function formatDate(date: string | Date | null | undefined, format = 'short') {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function truncate(str: string, length = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/** Strip HTML tags/entities from rich-text (Quill) content for plain-text previews. */
export function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Some content (e.g. static Pages) was authored as plain text via a bare
 * <textarea> before a rich-text editor was wired up for it. The first time
 * that content is opened in the editor / rendered as rich HTML, this converts
 * it: blank lines become paragraph breaks, single newlines become <br>.
 * Content that already contains a tag is assumed to already be real HTML
 * (e.g. saved by the rich editor) and is returned unchanged.
 */
export function plainTextToHtml(text: string | null | undefined): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escape(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function getBookingStatusColor(status: string) {
  const map: Record<string, string> = {
    pending:            'bg-yellow-100 text-yellow-800',
    ongoing:            'bg-blue-100 text-blue-800',
    completed:          'bg-green-100 text-green-800',
    cancelled:          'bg-red-100 text-red-800',
    in_dispute:         'bg-orange-100 text-orange-800',
    amidst_completion:  'bg-purple-100 text-purple-800',
    Pending:                     'bg-yellow-100 text-yellow-800',
    Ongoing:                     'bg-blue-100 text-blue-800',
    Completed:                   'bg-green-100 text-green-800',
    Cancelled:                   'bg-red-100 text-red-800',
    'In-dispute':                'bg-orange-100 text-orange-800',
    'Amidst-Cancellation':       'bg-orange-100 text-orange-800',
    'Amidst-Completion-Process': 'bg-purple-100 text-purple-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function getBookingStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending:           'Pending',
    ongoing:           'Ongoing',
    completed:         'Completed',
    cancelled:         'Cancelled',
    in_dispute:        'In Dispute',
    amidst_completion: 'In Review',
  };
  return map[status] ?? status;
}

export function getProfileStatusColor(status: string) {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING:  'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function getRoleColor(role: string) {
  const map: Record<string, string> = {
    ADMIN:  'bg-purple-100 text-purple-800',
    SELLER: 'bg-blue-100 text-blue-800',
    BUYER:  'bg-green-100 text-green-800',
  };
  return map[role] ?? 'bg-gray-100 text-gray-800';
}

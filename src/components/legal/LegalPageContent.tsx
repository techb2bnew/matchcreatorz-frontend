'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { RichTextView } from '@/components/ui/RichTextEditor';
import { formatDate, plainTextToHtml } from '@/lib/utils';
import { publicPageApi, PublicPage } from '@/lib/adminApi';

interface LegalPageContentProps {
  slug: string;
}

const PAGE_ICON: Record<string, string> = {
  about:   'fa-info-circle',
  privacy: 'fa-shield',
  terms:   'fa-gavel',
  faq:     'fa-question-circle',
  contact: 'fa-envelope',
};

/**
 * Renders a public, no-login static page (Terms, Privacy, etc.) by slug.
 * Older content was authored as plain text via a bare <textarea> before the
 * rich editor was wired up for Pages, so it's run through plainTextToHtml
 * before rendering — content already saved as HTML passes through unchanged.
 */
export default function LegalPageContent({ slug }: LegalPageContentProps) {
  const [page,    setPage]    = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await publicPageApi.get(slug);
        if (!cancelled) setPage(res.data);
      } catch {
        if (!cancelled) setError('Failed to load this page. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#efefef' }}>
      {/* Header */}
      <header className="relative flex items-center justify-center py-7 overflow-hidden" style={{ background: '#1e2235' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '32px 32px' }} />
        <Link href="/login" className="relative">
          <Logo className="h-11 w-auto" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-3xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e84545] transition-colors mb-5">
            <i className="fa fa-arrow-left" />Back to login
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border border-[#e0e0e0] overflow-hidden">
            {loading ? (
              <div className="p-6 sm:p-10 animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ) : error || !page ? (
              <div className="text-center py-16">
                <i className="fa fa-exclamation-circle text-3xl text-red-300 mb-3 block" />
                <p className="text-sm text-red-600">{error || 'Page not found'}</p>
              </div>
            ) : (
              <>
                {/* Title band */}
                <div className="flex items-center gap-4 px-6 sm:px-10 py-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="h-12 w-12 rounded-2xl bg-[#fff0f0] text-[#e84545] flex items-center justify-center flex-shrink-0">
                    <i className={`fa ${PAGE_ICON[slug] || 'fa-file-text-o'} text-xl`} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{page.title}</h1>
                    {page.updatedAt && (
                      <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                        <i className="fa fa-clock-o" />Last updated {formatDate(page.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 sm:px-10 py-8">
                  <RichTextView html={plainTextToHtml(page.content)} className="prose-headings:font-bold prose-p:leading-relaxed" />
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Questions? Reach us at <a href="mailto:support@matchcreatorz.com" className="text-[#e84545] hover:underline">support@matchcreatorz.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}

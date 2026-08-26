'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { formatDate, plainTextToHtml } from '@/lib/utils';
import { adminPageApi, AdminPage } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const PAGE_ICON: Record<string, string> = {
  about:   'fa-info-circle',
  privacy: 'fa-shield',
  terms:   'fa-gavel',
  faq:     'fa-question-circle',
  contact: 'fa-envelope',
};
const iconFor = (slug: string) => PAGE_ICON[slug] || 'fa-file-text-o';
// 'faq' now has its own dedicated management page (/admin/faqs) since it's a
// list of Q&A pairs, not a single title+content blob like these others.
const HIDDEN_SLUGS = ['about', 'contact', 'faq'];

export default function PagesPage() {
  const [pages, setPages]     = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModal, setEditModal]       = useState(false);
  const [selectedPage, setSelectedPage] = useState<AdminPage | null>(null);
  const [editTitle, setEditTitle]       = useState('');
  const [editContent, setEditContent]   = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminPageApi.list();
      setPages(res.data || []);
    } catch (e: unknown) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Failed to load pages');
      else console.error('Failed to silently refresh pages', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useAutoRefresh(() => load(true), 20000, !editModal);

  const openEdit = (page: AdminPage) => {
    setSelectedPage(page);
    setEditTitle(page.title);
    // Older pages were authored as plain text via a bare textarea — convert
    // to real HTML the first time they're opened in the rich editor so line
    // breaks/paragraphs don't collapse.
    setEditContent(plainTextToHtml(page.content));
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    if (!editTitle.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const res = await adminPageApi.update(selectedPage.id, { title: editTitle.trim(), content: editContent });
      setPages((prev) => prev.map((p) => p.id === selectedPage.id ? res.data : p));
      toast.success('Page updated');
      setEditModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Pages">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Static Pages</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Content shown on the public, no-login legal &amp; info pages (Terms, Privacy, FAQ, etc.)
        </p>
      </div>

      {loading ? (
        <PageLoader text="Loading pages..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.filter((p) => !HIDDEN_SLUGS.includes(p.slug)).map((p) => (
            <Card key={p.id} padding="md" hover className="flex flex-col gap-3" >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#fff0f0] text-[#e84545] flex items-center justify-center flex-shrink-0">
                  <i className={`fa ${iconFor(p.slug)} text-lg`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">/{p.slug}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-400">
                  {p.updatedAt ? `Updated ${formatDate(p.updatedAt)}` : 'Never updated'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<i className="fa fa-pencil text-xs" />}
                  onClick={() => openEdit(p)}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => !saving && setEditModal(false)}
        title={selectedPage ? `Edit: ${selectedPage.title}` : 'Edit Page'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="h-10 w-10 rounded-lg bg-[#fff0f0] text-[#e84545] flex items-center justify-center flex-shrink-0">
              <i className={`fa ${selectedPage ? iconFor(selectedPage.slug) : 'fa-file-text-o'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Public URL</p>
              <p className="text-xs text-gray-500 font-mono truncate">
                matchcreatorz.com/{selectedPage?.slug === 'terms' ? 'terms-conditions' : selectedPage?.slug === 'privacy' ? 'privacy-policy' : selectedPage?.slug}
              </p>
            </div>
          </div>

          <Input
            label="Page Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <RichTextEditor
            label="Content"
            variant="full"
            value={editContent}
            onChange={setEditContent}
            placeholder="Write the page content…"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditModal(false)} disabled={saving}>Cancel</Button>
            <Button fullWidth onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { adminPageApi, AdminPage } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

export default function PagesPage() {
  const [pages, setPages]     = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModal, setEditModal]       = useState(false);
  const [selectedPage, setSelectedPage] = useState<AdminPage | null>(null);
  const [editTitle, setEditTitle]       = useState('');
  const [editContent, setEditContent]   = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPageApi.list();
      setPages(res.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (page: AdminPage) => {
    setSelectedPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
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
      {loading ? (
        <PageLoader text="Loading pages..." />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Page Name', 'Slug', 'Last Updated', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">/{p.slug}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.updatedAt ? formatDate(p.updatedAt) : '-'}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<i className="fa fa-pencil text-xs" />}
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => !saving && setEditModal(false)} title={`Edit: ${selectedPage?.title || ''}`} size="lg">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={selectedPage ? `/${selectedPage.slug}` : ''}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 font-mono cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditModal(false)} disabled={saving}>Cancel</Button>
            <Button fullWidth onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

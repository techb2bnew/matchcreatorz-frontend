'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { adminBannerApi, AdminBanner } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

const POSITIONS = ['Home Top', 'Sidebar', 'Services Page', 'Footer'];

const emptyForm = { title: '', link_url: '', position: 'Home Top', is_active: true };

export default function BannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<AdminBanner | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminBannerApi.list();
      setBanners(res.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setPreview(null);
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (b: AdminBanner) => {
    setEditing(b);
    setForm({ title: b.title, link_url: b.link_url || '', position: b.position, is_active: b.is_active });
    setImageFile(null);
    setPreview(b.image_url);
    setErr('');
    setModalOpen(true);
  };

  const onPickFile = (f: File | null) => {
    setImageFile(f);
    setPreview(f ? URL.createObjectURL(f) : editing?.image_url || null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return setErr('Title is required');
    if (!editing && !imageFile) return setErr('Banner image is required');
    setErr('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('link_url', form.link_url.trim());
      fd.append('position', form.position);
      fd.append('is_active', String(form.is_active));
      if (imageFile) fd.append('image', imageFile);

      if (editing) await adminBannerApi.update(editing.id, fd);
      else         await adminBannerApi.create(fd);

      toast.success(editing ? 'Banner updated' : 'Banner created');
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: AdminBanner) => {
    setBusyId(b.id);
    try {
      const fd = new FormData();
      fd.append('is_active', String(!b.is_active));
      await adminBannerApi.update(b.id, fd);
      setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update banner');
    } finally {
      setBusyId(null);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!window.confirm('Delete this banner? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await adminBannerApi.delete(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner deleted');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete banner');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Banners">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">All Banners</h2>
        <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={openAdd}>
          Add Banner
        </Button>
      </div>

      {loading ? (
        <PageLoader text="Loading banners..." />
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="fa fa-picture-o text-3xl mb-3" />
          <p className="text-sm">No banners yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {banners.map((b) => (
            <Card key={b.id} padding="none" className="overflow-hidden">
              {/* Banner preview */}
              <div className="w-full bg-gray-100" style={{ aspectRatio: '16/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{b.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{b.position}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <i className="fa fa-pencil text-sm" />
                    </button>
                    <button onClick={() => deleteBanner(b.id)} disabled={busyId === b.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <i className="fa fa-trash text-sm" />
                    </button>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{b.is_active ? 'Active' : 'Inactive'}</span>
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={busyId === b.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${b.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${b.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Banner Modal */}
      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Banner Image</label>
            {preview && (
              <div className="w-full rounded-xl overflow-hidden bg-gray-100 mb-2" style={{ aspectRatio: '16/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200"
            />
          </div>
          <Input label="Banner Title" placeholder="e.g. Summer Sale" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Link URL (optional)" placeholder="https://..." value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Position</label>
            <select
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 h-11 text-sm focus:outline-none focus:border-[#e84545] bg-white"
            >
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activeCheck" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-[#e84545]" />
            <label htmlFor="activeCheck" className="text-sm text-gray-700">Set as Active</label>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button fullWidth onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Add Banner'}</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

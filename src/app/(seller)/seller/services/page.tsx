'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card            from '@/components/ui/Card';
import Button          from '@/components/ui/Button';
import Input           from '@/components/ui/Input';
import Modal           from '@/components/ui/Modal';
import { Spinner, CardSkeleton } from '@/components/ui/Loader';
import { formatCurrency }        from '@/lib/utils';
import { sellerServiceApi, publicCategoryApi } from '@/lib/adminApi';

// ── Types ─────────────────────────────────────────────────────────────
type ServiceStatus = 'active' | 'paused' | 'rejected';

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  images: string[];
  tags: string[];
  status: ServiceStatus;
  is_featured: boolean;
  views_count: number;
  orders_count: number;
  rating: number;
  reviews_count: number;
  category?: { id: number; name: string; icon: string };
  category_ids?: number[];
  category_id: number;
}

interface Category { id: number; name: string; icon: string }

interface FormState {
  title: string;
  description: string;
  price: string;
  delivery_days: string;
  revisions: string;
  category_ids: number[];
  tags: string;
}

const EMPTY_FORM: FormState = {
  title: '', description: '', price: '', delivery_days: '3', revisions: '1', category_ids: [], tags: '',
};

const statusBadge = (s: ServiceStatus) => {
  if (s === 'active')   return 'bg-green-100 text-green-700';
  if (s === 'paused')   return 'bg-yellow-100 text-yellow-700';
  if (s === 'rejected') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
};

// ── Custom Multi-Select Dropdown ──────────────────────────────────────
function MultiSelectCategory({
  categories,
  selected = [],
  onChange,
}: {
  categories: Category[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref                 = useRef<HTMLDivElement>(null);

  const safeSelected = Array.isArray(selected) ? selected : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: number) => {
    onChange(safeSelected.includes(id)
      ? safeSelected.filter((s) => s !== id)
      : [...safeSelected, id]
    );
  };

  const filtered      = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedItems = categories.filter((c) => safeSelected.includes(c.id));

  // label shown in trigger
  const triggerLabel = selectedItems.length === 0
    ? 'Select categories...'
    : selectedItems.length === 1
      ? selectedItems[0].name
      : `${selectedItems[0].name} +${selectedItems.length - 1} more`;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Category <span className="text-gray-400 font-normal">(multiple)</span>
      </label>

      {/* Trigger — screenshot style */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 border-2 rounded-xl px-3.5 py-2.5 text-sm text-left transition-all ${
          open
            ? 'border-[#e84545] bg-white'
            : safeSelected.length > 0
              ? 'border-[#e84545] bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <i className="fa fa-tag text-[#e84545] flex-shrink-0 text-sm" />
        <span className={`flex-1 truncate ${safeSelected.length === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {triggerLabel}
        </span>
        <i className={`fa fa-chevron-${open ? 'up' : 'down'} text-gray-400 text-xs flex-shrink-0`} />
      </button>

      {/* Selected pills (below trigger) */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedItems.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-[#e84545] text-white text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {c.icon && <i className={`${c.icon} text-[11px]`} />}
              {c.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(c.id); }}
                className="ml-0.5 hover:opacity-75 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2.5 border-b border-gray-100">
            <div className="relative">
              <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                autoFocus
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e84545]/20 transition"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-5">No categories found</p>
            ) : (
              filtered.map((c) => {
                const isSelected = safeSelected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-[#e84545] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] border-2 transition-all ${
                      isSelected ? 'bg-white border-white text-[#e84545]' : 'border-gray-300'
                    }`}>
                      {isSelected && <i className="fa fa-check font-bold" />}
                    </span>
                    {c.icon && <i className={`${c.icon} text-base flex-shrink-0 ${isSelected ? 'text-white' : ''}`} />}
                    <span className={`flex-1 ${isSelected ? 'font-semibold' : ''}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {safeSelected.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">{safeSelected.length} selected</span>
              <button
                type="button"
                onClick={() => { onChange([]); setSearch(''); }}
                className="text-xs text-[#e84545] hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Image Upload Row ──────────────────────────────────────────────────
function ImageUploader({
  existingUrls,
  onChange,
}: {
  existingUrls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef                    = useRef<HTMLInputElement>(null);
  const [previews, setPreviews]     = useState<{ url: string; file?: File }[]>(
    existingUrls.map((u) => ({ url: u }))
  );
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, 5 - previews.length);
    if (selected.length === 0) return;

    const localPreviews = selected.map((f) => ({ url: URL.createObjectURL(f), file: f }));
    const merged = [...previews, ...localPreviews];
    setPreviews(merged);

    setUploading(true);
    setError('');
    try {
      const res  = await sellerServiceApi.uploadImages(selected);
      const urls = res.data.urls;
      const updated = merged.map((p) => {
        if (!p.file) return p;
        const idx = selected.indexOf(p.file);
        return idx >= 0 ? { url: urls[idx] } : p;
      });
      setPreviews(updated);
      onChange(updated.map((p) => p.url));
    } catch (e: unknown) {
      setError((e as Error).message || 'Upload failed');
      setPreviews(previews);
      onChange(previews.map((p) => p.url));
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    onChange(next.map((p) => p.url));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Service Images <span className="text-gray-400 font-normal">(max 5 — JPG, PNG, WEBP)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {previews.map((p, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          </div>
        ))}
        {previews.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#e84545] hover:text-[#e84545] transition disabled:opacity-50"
          >
            {uploading ? <Spinner size="sm" color="red" /> : (
              <>
                <i className="fa fa-plus text-lg mb-0.5" />
                <span className="text-[10px]">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ── Service Form Modal ────────────────────────────────────────────────
function ServiceModal({
  isOpen, onClose, onSaved, categories, editService,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  editService?: Service | null;
}) {
  const [form, setForm]     = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editService) {
        setForm({
          title:         editService.title,
          description:   editService.description,
          price:         String(editService.price),
          delivery_days: String(editService.delivery_days),
          revisions:     String(editService.revisions),
          category_ids:  editService.category_ids?.length
            ? editService.category_ids
            : editService.category_id ? [editService.category_id] : [],
          tags: (editService.tags || []).join(', '),
        });
        setImages(editService.images || []);
      } else {
        setForm(EMPTY_FORM);
        setImages([]);
      }
      setError('');
    }
  }, [isOpen, editService]);

  const set = (k: keyof Omit<FormState, 'category_ids'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim())           return setError('Title is required');
    if (form.category_ids.length === 0) return setError('Please select at least one category');
    if (!form.price || Number(form.price) <= 0) return setError('Price must be greater than 0');

    setSaving(true);
    setError('');
    try {
      const payload = {
        title:         form.title.trim(),
        description:   form.description.trim(),
        price:         Number(form.price),
        delivery_days: Number(form.delivery_days) || 3,
        revisions:     Number(form.revisions) || 1,
        category_ids:  form.category_ids,
        tags:          form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        images,
      };
      if (editService) await sellerServiceApi.update(editService.id, payload);
      else             await sellerServiceApi.create(payload);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editService ? 'Edit Service' : 'Add New Service'} size="md">
      <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-4">
        <Input
          label="Service Title"
          placeholder="e.g. Professional Logo Design"
          value={form.title}
          onChange={set('title')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            rows={3}
            placeholder="Describe what you offer..."
            value={form.description}
            onChange={set('description')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
          />
        </div>

        <ImageUploader existingUrls={images} onChange={setImages} />

        <MultiSelectCategory
          categories={categories}
          selected={form.category_ids}
          onChange={(ids) => setForm((p) => ({ ...p, category_ids: ids }))}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input label="Price (Rs.)" type="number" placeholder="999" value={form.price} onChange={set('price')} />
          <Input label="Delivery (days)" type="number" placeholder="3" value={form.delivery_days} onChange={set('delivery_days')} />
          <Input label="Revisions" type="number" placeholder="1" value={form.revisions} onChange={set('revisions')} />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="logo, branding, design"
          value={form.tags}
          onChange={set('tags')}
        />
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
        <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
        <Button fullWidth onClick={handleSave} loading={saving}>
          {editService ? 'Save Changes' : 'Add Service'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────
function DeleteModal({
  isOpen, onClose, onConfirm, title, loading,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; loading: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Service" size="sm">
      <p className="text-sm text-gray-600 mb-5">
        Are you sure you want to delete <strong>&quot;{title}&quot;</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function SellerServicesPage() {
  const [services, setServices]     = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [page]                      = useState(1);
  const [actionLoading, setAction]  = useState<Record<number, string>>({});

  const [addModal, setAddModal]   = useState(false);
  const [editService, setEdit]    = useState<Service | null>(null);
  const [deleteTarget, setDelete] = useState<Service | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await sellerServiceApi.list(params);
      setServices(res.data || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    publicCategoryApi.list().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchServices, 350);
    return () => clearTimeout(t);
  }, [fetchServices]);

  const setActionFor = (id: number, act: string) => setAction((p) => ({ ...p, [id]: act }));
  const clearAction  = (id: number) => setAction((p) => { const n = { ...p }; delete n[id]; return n; });

  const toggleStatus = async (service: Service) => {
    const act = service.status === 'active' ? 'pause' : 'publish';
    setActionFor(service.id, act);
    try {
      if (act === 'pause') await sellerServiceApi.pause(service.id);
      else                 await sellerServiceApi.publish(service.id);
      await fetchServices();
    } catch { /* ignore */ }
    finally { clearAction(service.id); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await sellerServiceApi.delete(deleteTarget.id);
      setDelete(null);
      await fetchServices();
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  // Get category names for a service
  const getCategoryNames = (s: Service) => {
    const ids = s.category_ids?.length ? s.category_ids : s.category_id ? [s.category_id] : [];
    const names = categories.filter((c) => ids.includes(c.id)).map((c) => c.name);
    return names.length ? names : s.category ? [s.category.name] : [];
  };

  return (
    <DashboardLayout role="SELLER" title="My Services">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-semibold text-gray-900">My Services</h2>
        <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => setAddModal(true)}>
          Add Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e84545]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : services.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa fa-briefcase text-4xl mb-3 block" />
          <p className="text-sm">No services found. Add your first service!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.map((s) => (
            <Card key={s.id} padding="md" hover>
              {/* Thumbnail */}
              {s.images && s.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.images[0]} alt={s.title} className="w-full h-36 object-cover rounded-xl mb-3" />
              ) : (
                <div className="w-full h-36 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-300">
                  <i className="fa fa-image text-3xl" />
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
                {s.is_featured && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                    <i className="fa fa-star text-[9px]" /> Featured
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{s.title}</h3>

              {/* Category pills */}
              <div className="flex flex-wrap gap-1 mb-2">
                {getCategoryNames(s).slice(0, 3).map((name) => (
                  <span key={name} className="text-[10px] bg-[#e84545]/10 text-[#e84545] px-2 py-0.5 rounded-full font-medium">
                    {name}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="font-bold text-[#e84545] text-sm">{formatCurrency(s.price)}</span>
                <span className="flex items-center gap-1">
                  <i className="fa fa-clock-o text-gray-400" /> {s.delivery_days}d
                </span>
                {s.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <i className="fa fa-star text-yellow-400" /> {Number(s.rating).toFixed(1)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth leftIcon={<i className="fa fa-pencil text-xs" />} onClick={() => setEdit(s)}>
                  Edit
                </Button>
                {s.status !== 'rejected' && (
                  <Button
                    variant={s.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    fullWidth
                    loading={!!actionLoading[s.id]}
                    onClick={() => toggleStatus(s)}
                  >
                    {s.status === 'active' ? 'Pause' : 'Publish'}
                  </Button>
                )}
                <button
                  onClick={() => setDelete(s)}
                  className="w-8 h-8 flex-shrink-0 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition"
                  title="Delete"
                >
                  <i className="fa fa-trash text-xs" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceModal
        isOpen={addModal || !!editService}
        onClose={() => { setAddModal(false); setEdit(null); }}
        onSaved={fetchServices}
        categories={categories}
        editService={editService}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDelete(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.title || ''}
        loading={deleting}
      />
    </DashboardLayout>
  );
}

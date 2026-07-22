'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card            from '@/components/ui/Card';
import Button          from '@/components/ui/Button';
import Input           from '@/components/ui/Input';
import Modal           from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Loader';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { formatCurrency } from '@/lib/utils';
import { sellerServiceApi, publicCategoryApi } from '@/lib/adminApi';

// -- Types -------------------------------------------------------------
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

// -- Custom Multi-Select Dropdown --------------------------------------
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
  const safeSelected        = Array.isArray(selected) ? selected : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: number) =>
    onChange(safeSelected.includes(id) ? safeSelected.filter((s) => s !== id) : [...safeSelected, id]);

  const filtered      = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedItems = categories.filter((c) => safeSelected.includes(c.id));

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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 border-2 rounded-xl px-3.5 py-2.5 text-sm text-left transition-all ${
          open || safeSelected.length > 0 ? 'border-[#e84545] bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <i className="fa fa-tag text-[#e84545] flex-shrink-0 text-sm" />
        <span className={`flex-1 truncate ${safeSelected.length === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {triggerLabel}
        </span>
        <i className={`fa fa-chevron-${open ? 'up' : 'down'} text-gray-400 text-xs flex-shrink-0`} />
      </button>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedItems.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 bg-[#e84545] text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {c.icon && <i className={`${c.icon} text-[11px]`} />}
              {c.name}
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(c.id); }} className="ml-0.5 hover:opacity-75 leading-none">x</button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
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
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-5">No categories found</p>
            ) : (
              filtered.map((c) => {
                const isSel = safeSelected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${isSel ? 'bg-[#e84545] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] border-2 transition-all ${isSel ? 'bg-white border-white text-[#e84545]' : 'border-gray-300'}`}>
                      {isSel && <i className="fa fa-check font-bold" />}
                    </span>
                    {c.icon && <i className={`${c.icon} text-base flex-shrink-0 ${isSel ? 'text-white' : ''}`} />}
                    <span className={`flex-1 ${isSel ? 'font-semibold' : ''}`}>{c.name}</span>
                  </button>
                );
              })
            )}
          </div>
          {safeSelected.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">{safeSelected.length} selected</span>
              <button type="button" onClick={() => { onChange([]); setSearch(''); }} className="text-xs text-[#e84545] hover:text-red-700 font-medium">Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -- Image Uploader (staged -- uploads on form submit) ------------------
type ImgItem =
  | { kind: 'url';  url: string }
  | { kind: 'file'; file: File; preview: string };

function ImageUploader({
  items,
  onChange,
}: {
  items: ImgItem[];
  onChange: (items: ImgItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots   = 5 - items.length;
    if (slots <= 0) return;
    const added: ImgItem[] = Array.from(files).slice(0, slots).map((f) => ({
      kind: 'file',
      file: f,
      preview: URL.createObjectURL(f),
    }));
    onChange([...items, ...added]);
  };

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    // revoke blob URL to free memory
    const removed = items[idx];
    if (removed.kind === 'file') URL.revokeObjectURL(removed.preview);
    onChange(next);
  };

  const getPreview = (item: ImgItem) => item.kind === 'url' ? item.url : item.preview;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Service Images <span className="text-gray-400 font-normal">(max 5 -- JPG, PNG, WEBP)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getPreview(item)} alt="" className="w-full h-full object-cover" />
            {item.kind === 'file' && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[8px] text-center py-0.5">new</div>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
            >x</button>
          </div>
        ))}
        {items.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#e84545] hover:text-[#e84545] transition"
          >
            <i className="fa fa-plus text-lg mb-0.5" />
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

// -- Service Form Modal ------------------------------------------------
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
  const [imgItems, setImgs] = useState<ImgItem[]>([]);
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
          category_ids:  (() => {
            const validIds = categories.map((c) => c.id);
            const stored = editService.category_ids?.length
              ? editService.category_ids
              : editService.category_id ? [editService.category_id] : [];
            return stored.filter((id) => validIds.includes(id));
          })(),
          tags: (editService.tags || []).join(', '),
        });
        setImgs((editService.images || []).map((u) => ({ kind: 'url', url: u })));
      } else {
        setForm(EMPTY_FORM);
        setImgs([]);
      }
      setError('');
    }
  }, [isOpen, editService]);

  const set = (k: keyof Omit<FormState, 'category_ids'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim())             return setError('Title is required');
    if (form.category_ids.length === 0) return setError('Please select at least one category');
    if (!form.price || Number(form.price) <= 0) return setError('Price must be greater than 0');

    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title',         form.title.trim());
      fd.append('description',   form.description.trim());
      fd.append('price',         String(Number(form.price)));
      fd.append('delivery_days', String(Number(form.delivery_days) || 3));
      fd.append('revisions',     String(Number(form.revisions) || 1));
      fd.append('category_ids',  JSON.stringify(form.category_ids));
      fd.append('tags',          JSON.stringify(
        form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      ));

      // Existing S3 URLs to preserve (update only)
      const existingUrls = imgItems.filter((i) => i.kind === 'url').map((i) => (i as { kind: 'url'; url: string }).url);
      if (editService) fd.append('existing_images', JSON.stringify(existingUrls));

      // New files to upload
      imgItems
        .filter((i) => i.kind === 'file')
        .forEach((i) => fd.append('images', (i as { kind: 'file'; file: File; preview: string }).file));

      if (editService) await sellerServiceApi.update(editService.id, fd);
      else             await sellerServiceApi.create(fd);

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
        <RichTextEditor
          label="Description"
          placeholder="Describe what you offer..."
          value={form.description}
          onChange={(html) => setForm((f) => ({ ...f, description: html }))}
          variant="full"
        />

        <ImageUploader items={imgItems} onChange={setImgs} />

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

// -- Delete Confirm Modal ----------------------------------------------
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

// -- Main Page ---------------------------------------------------------
export default function SellerServicesPage() {
  const [services, setServices]     = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;
  const [actionLoading, setAction]  = useState<Record<number, string>>({});

  const [addModal, setAddModal]   = useState(false);
  const [editService, setEdit]    = useState<Service | null>(null);
  const [deleteTarget, setDelete] = useState<Service | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await sellerServiceApi.list(params);
      setServices(res.data || []);
      setTotalPages(res.meta?.totalPages || res.pagination?.pages || 1);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    publicCategoryApi.list().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  // Reset to first page when search / status filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter]);

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

  const getCategoryNames = (s: Service) => {
    const ids = s.category_ids?.length ? s.category_ids : s.category_id ? [s.category_id] : [];
    const names = categories.filter((c) => ids.includes(c.id)).map((c) => c.name);
    return names.length ? names : s.category ? [s.category.name] : [];
  };

  return (
    <DashboardLayout role="SELLER" title="My Services">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-semibold text-gray-900">My Services</h2>
        <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => setAddModal(true)}>
          Add Service
        </Button>
      </div>

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
        <div className="flex gap-1.5">
          {[{ label: 'All', value: '' }, { label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }, { label: 'Rejected', value: 'rejected' }].map((f) => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

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
              {s.images && s.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.images[0]} alt={s.title} className="w-full h-36 object-cover rounded-xl mb-3" />
              ) : (
                <div className="w-full h-36 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-300">
                  <i className="fa fa-image text-3xl" />
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(s.status)}`}>{s.status}</span>
                {s.is_featured && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                    <i className="fa fa-star text-[9px]" /> Featured
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{s.title}</h3>

              <div className="flex flex-wrap gap-1 mb-2">
                {getCategoryNames(s).slice(0, 3).map((name) => (
                  <span key={name} className="text-[10px] bg-[#e84545]/10 text-[#e84545] px-2 py-0.5 rounded-full font-medium">{name}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="font-bold text-[#e84545] text-sm">{formatCurrency(s.price)}</span>
                <span className="flex items-center gap-1"><i className="fa fa-clock-o text-gray-400" /> {s.delivery_days}d</span>
                {s.rating > 0 && (
                  <span className="flex items-center gap-0.5"><i className="fa fa-star text-yellow-400" /> {Number(s.rating).toFixed(1)}</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth leftIcon={<i className="fa fa-pencil text-xs" />} onClick={() => setEdit(s)}>Edit</Button>
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <i className="fa fa-chevron-left text-xs" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <i className="fa fa-chevron-right text-xs" />
          </button>
        </div>
      )}


      <ServiceModal
        isOpen={addModal || !!editService}
        onClose={() => { setAddModal(false); setEdit(null); }}
        onSaved={() => { setAddModal(false); setEdit(null); fetchServices(); }}
        categories={categories}
        editService={editService}
      />

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDelete(null)} title="Delete Service" size="sm">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fa fa-trash text-2xl text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">Are you sure?</p>
            <p className="text-sm text-gray-500">
              Delete <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={() => setDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>
            Yes, Delete
          </Button>
        </div>
      </Modal>

    </DashboardLayout>
  );
}

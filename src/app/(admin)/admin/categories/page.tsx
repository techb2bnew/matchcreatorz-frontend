'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { categoryApi } from '@/lib/adminApi';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

type Category = {
  id: number;
  name: string;
  icon: string;
  description: string;
  services_count: number;
  sellers_count: number;
};

const emptyForm = { name: '', icon: '', description: '' };

// Renders either a devicon class or an emoji
function CatIcon({ icon, className = 'text-3xl' }: { icon?: string; className?: string }) {
  if (!icon) return <span className={className}>🏷️</span>;
  if (icon.startsWith('devicon-')) {
    // Icons without "colored" are black -- add dark color so they're visible on light bg
    const style = !icon.includes('colored') ? { color: '#1a1a1a' } : undefined;
    return <i className={`${icon} ${className}`} style={style} />;
  }
  return <span className={className}>{icon}</span>;
}

const TECH_ICONS: { icon: string; label: string }[] = [
  { icon: 'devicon-nodejs-plain colored',          label: 'Node.js' },
  { icon: 'devicon-react-original colored',        label: 'React' },
  { icon: 'devicon-nextjs-plain',                   label: 'Next.js' },
  { icon: 'devicon-vuejs-plain colored',           label: 'Vue.js' },
  { icon: 'devicon-angularjs-plain colored',       label: 'Angular' },
  { icon: 'devicon-laravel-plain colored',         label: 'Laravel' },
  { icon: 'devicon-php-plain colored',             label: 'PHP' },
  { icon: 'devicon-python-plain colored',          label: 'Python' },
  { icon: 'devicon-javascript-plain colored',      label: 'JavaScript' },
  { icon: 'devicon-typescript-plain colored',      label: 'TypeScript' },
  { icon: 'devicon-html5-plain colored',           label: 'HTML5' },
  { icon: 'devicon-css3-plain colored',            label: 'CSS3' },
  { icon: 'devicon-java-plain colored',            label: 'Java' },
  { icon: 'devicon-csharp-plain colored',          label: 'C#' },
  { icon: 'devicon-cplusplus-plain colored',       label: 'C++' },
  { icon: 'devicon-go-plain colored',              label: 'Go' },
  { icon: 'devicon-ruby-plain colored',            label: 'Ruby' },
  { icon: 'devicon-swift-plain colored',           label: 'Swift' },
  { icon: 'devicon-kotlin-plain colored',          label: 'Kotlin' },
  { icon: 'devicon-flutter-plain colored',         label: 'Flutter' },
  { icon: 'devicon-dart-plain colored',            label: 'Dart' },
  { icon: 'devicon-django-plain colored',          label: 'Django' },
  { icon: 'devicon-express-original colored',       label: 'Express' },
  { icon: 'devicon-spring-plain colored',          label: 'Spring' },
  { icon: 'devicon-mongodb-plain colored',         label: 'MongoDB' },
  { icon: 'devicon-mysql-plain colored',           label: 'MySQL' },
  { icon: 'devicon-postgresql-plain colored',      label: 'PostgreSQL' },
  { icon: 'devicon-redis-plain colored',           label: 'Redis' },
  { icon: 'devicon-docker-plain colored',          label: 'Docker' },
  { icon: 'devicon-kubernetes-plain colored',      label: 'Kubernetes' },
  { icon: 'devicon-amazonwebservices-plain colored',    label: 'AWS' },
  { icon: 'devicon-googlecloud-plain colored',     label: 'Google Cloud' },
  { icon: 'devicon-azure-plain colored',           label: 'Azure' },
  { icon: 'devicon-git-plain colored',             label: 'Git' },
  { icon: 'devicon-github-original colored',        label: 'GitHub' },
  { icon: 'devicon-figma-plain colored',           label: 'Figma' },
  { icon: 'devicon-photoshop-plain colored',       label: 'Photoshop' },
  { icon: 'devicon-illustrator-plain colored',     label: 'Illustrator' },
  { icon: 'devicon-redux-original colored',        label: 'Redux' },
  { icon: 'devicon-graphql-plain colored',         label: 'GraphQL' },
  { icon: 'devicon-firebase-plain colored',        label: 'Firebase' },
  { icon: 'devicon-wordpress-plain colored',       label: 'WordPress' },
  { icon: 'devicon-tailwindcss-plain colored',     label: 'Tailwind' },
  { icon: 'devicon-sass-original colored',         label: 'Sass' },
  { icon: 'devicon-linux-plain',                   label: 'Linux' },
  { icon: 'devicon-android-plain colored',         label: 'Android' },
  { icon: 'devicon-apple-original',                label: 'iOS' },
  { icon: 'devicon-tensorflow-original colored',   label: 'TensorFlow' },
  { icon: 'devicon-rust-plain',                    label: 'Rust' },
  { icon: 'devicon-nuxtjs-plain colored',          label: 'Nuxt.js' },
];

const GENERAL_ICONS: { icon: string; label: string }[] = [
  { icon: '📷', label: 'Photography' },
  { icon: '🎬', label: 'Video' },
  { icon: '🎨', label: 'Design' },
  { icon: '✍️', label: 'Writing' },
  { icon: '📣', label: 'Marketing' },
  { icon: '🎵', label: 'Music' },
  { icon: '🎭', label: 'Animation' },
  { icon: '📊', label: 'Data' },
  { icon: '🛒', label: 'eCommerce' },
  { icon: '🔒', label: 'Security' },
  { icon: '☁️', label: 'Cloud' },
  { icon: '🤖', label: 'AI/ML' },
  { icon: '📚', label: 'Education' },
  { icon: '💡', label: 'Consulting' },
  { icon: '💰', label: 'Finance' },
  { icon: '⚖️', label: 'Legal' },
  { icon: '🏠', label: 'Real Estate' },
  { icon: '✈️', label: 'Travel' },
  { icon: '🌿', label: 'Health' },
  { icon: '👗', label: 'Fashion' },
];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'tech' | 'general'>('tech');
  const icons = tab === 'tech' ? TECH_ICONS : GENERAL_ICONS;

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">Icon</label>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(['tech', 'general'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              tab === t ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'tech' ? '⚙️ Tech / Frameworks' : '🎨 General'}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-7 gap-1 max-h-44 overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50">
        {icons.map(({ icon, label }) => (
          <button
            key={icon}
            type="button"
            title={label}
            onClick={() => onChange(icon)}
            className={`flex flex-col items-center justify-center rounded-xl p-2 transition-all ${
              value === icon
                ? 'bg-[#e84545] shadow ring-2 ring-[#e84545]/30'
                : 'hover:bg-white hover:shadow-sm bg-transparent'
            }`}
          >
            <CatIcon icon={icon} className="text-2xl" />
          </button>
        ))}
      </div>

      {/* Selected preview */}
      {value && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">Selected:</span>
          <CatIcon icon={value} className="text-2xl" />
          <button type="button" onClick={() => onChange('')} className="text-red-400 hover:text-red-600 text-xs underline ml-1">Clear</button>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);

  // search + debounce
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // -- Add modal ---------------------------------------------
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addErrs, setAddErrs]     = useState<Record<string, string>>({});

  // -- Edit modal --------------------------------------------
  const [editCat, setEditCat]       = useState<Category | null>(null);
  const [editForm, setEditForm]     = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrs, setEditErrs]     = useState<Record<string, string>>({});

  // -- Delete confirm ----------------------------------------
  const [deleteCat, setDeleteCat]   = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Fetch -------------------------------------------------
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      const json = await categoryApi.list(params);
      setCategories(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // -- Add ---------------------------------------------------
  const handleAdd = async () => {
    const e: Record<string, string> = {};
    if (!addForm.name.trim()) e.name = 'Category name is required';
    if (Object.keys(e).length) { setAddErrs(e); return; }
    setAddErrs({});
    setAddLoading(true);
    try {
      await categoryApi.add({
        name:        addForm.name.trim(),
        icon:        addForm.icon.trim()        || undefined,
        description: addForm.description.trim() || undefined,
      });
      toast.success('Category added successfully');
      setShowAdd(false);
      setAddForm(emptyForm);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category');
    } finally {
      setAddLoading(false);
    }
  };

  // -- Edit --------------------------------------------------
  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setEditForm({ name: cat.name, icon: cat.icon || '', description: cat.description || '' });
    setEditErrs({});
  };

  const handleEdit = async () => {
    const e: Record<string, string> = {};
    if (!editForm.name.trim()) e.name = 'Category name is required';
    if (Object.keys(e).length) { setEditErrs(e); return; }
    setEditErrs({});
    setEditLoading(true);
    try {
      await categoryApi.edit(editCat!.id, {
        name:        editForm.name.trim(),
        icon:        editForm.icon.trim()        || undefined,
        description: editForm.description.trim() || undefined,
      });
      toast.success('Category updated');
      setEditCat(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setEditLoading(false);
    }
  };

  // -- Delete ------------------------------------------------
  const handleDelete = async () => {
    if (!deleteCat) return;
    setDeleteLoading(true);
    try {
      await categoryApi.delete(deleteCat.id);
      toast.success('Category deleted');
      setDeleteCat(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Categories">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 flex-shrink-0">All Categories</h2>
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search categories..."
            leftIcon={<i className="fa fa-search text-gray-400 text-sm" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => { setAddForm(emptyForm); setAddErrs({}); setShowAdd(true); }}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <>
          <CardSkeleton count={8} />
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between animate-pulse">
              <div className="h-4 w-36 bg-gray-200 rounded-full" />
              <div className="h-4 w-16 bg-gray-100 rounded-full" />
            </div>
            <TableSkeleton rows={5} cols={4} />
          </div>
        </>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="fa fa-tag text-4xl mb-3 block" />
          <p className="font-medium">No categories found</p>
          {debouncedSearch && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {categories.map((c) => (
              <Card key={c.id} padding="md" hover>
                <div className="mb-2"><CatIcon icon={c.icon} className="text-3xl" /></div>
                <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{c.services_count} services . {c.sellers_count} sellers</p>
                {c.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <i className="fa fa-pencil text-xs" />
                  </button>
                  <button
                    onClick={() => setDeleteCat(c)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i className="fa fa-trash text-xs" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <CardTitle>Categories Table</CardTitle>
              <span className="text-xs text-gray-400">{total} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Icon', 'Name', 'Description', 'Services', 'Sellers', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><CatIcon icon={c.icon} className="text-2xl" /></td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{c.description || '--'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.services_count}</td>
                      <td className="px-4 py-3 text-gray-600">{c.sellers_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <i className="fa fa-pencil text-sm" />
                          </button>
                          <button
                            onClick={() => setDeleteCat(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <i className="fa fa-trash text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* -- Add Modal -- */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Category" size="sm">
        <div className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Photography"
            value={addForm.name}
            onChange={(e) => { setAddForm(f => ({ ...f, name: e.target.value })); setAddErrs(p => ({ ...p, name: '' })); }}
            error={addErrs.name}
          />
          <IconPicker value={addForm.icon} onChange={(v) => setAddForm(f => ({ ...f, icon: v }))} />
          <Input
            label="Description"
            placeholder="Short description (optional)"
            value={addForm.description}
            onChange={(e) => setAddForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAdd} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* -- Edit Modal -- */}
      <Modal isOpen={!!editCat} onClose={() => setEditCat(null)} title="Edit Category" size="sm">
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={editForm.name}
            onChange={(e) => { setEditForm(f => ({ ...f, name: e.target.value })); setEditErrs(p => ({ ...p, name: '' })); }}
            error={editErrs.name}
          />
          <IconPicker value={editForm.icon} onChange={(v) => setEditForm(f => ({ ...f, icon: v }))} />
          <Input
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setEditCat(null)}>Cancel</Button>
            <Button fullWidth onClick={handleEdit} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* -- Delete Confirm Modal -- */}
      <Modal isOpen={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteCat?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setDeleteCat(null)}>Cancel</Button>
            <Button
              fullWidth
              onClick={handleDelete}
              disabled={deleteLoading}
              className="!bg-red-500 hover:!bg-red-600"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}

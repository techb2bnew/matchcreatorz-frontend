'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

type Banner = { id: number; title: string; position: string; active: boolean; gradient: string };

const initialBanners: Banner[] = [
  { id: 1, title: 'Summer Sale',   position: 'Home Top',       active: true,  gradient: 'from-blue-400 to-purple-500'  },
  { id: 2, title: 'Pro Sellers',   position: 'Sidebar',        active: true,  gradient: 'from-green-400 to-teal-500'   },
  { id: 3, title: 'New Features',  position: 'Services Page',  active: false, gradient: 'from-orange-400 to-red-500'   },
  { id: 4, title: 'Holiday Promo', position: 'Footer',         active: false, gradient: 'from-pink-400 to-rose-500'    },
];

export default function BannersPage() {
  const [banners, setBanners] = useState(initialBanners);
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('');

  const toggleActive = (id: number) => {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, active: !b.active } : b));
  };

  const deleteBanner = (id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <DashboardLayout role="ADMIN" title="Banners">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">All Banners</h2>
        <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => { setNewTitle(''); setNewPosition(''); setAddModal(true); }}>
          Add Banner
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {banners.map((b) => (
          <Card key={b.id} padding="none" className="overflow-hidden">
            {/* Banner preview */}
            <div className={`bg-gradient-to-r ${b.gradient} w-full`} style={{ aspectRatio: '16/5' }} />

            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{b.position}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><i className="fa fa-pencil text-sm" /></button>
                  <button onClick={() => deleteBanner(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><i className="fa fa-trash text-sm" /></button>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">{b.active ? 'Active' : 'Inactive'}</span>
                <button
                  onClick={() => toggleActive(b.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${b.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Banner Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Banner" size="sm">
        <div className="space-y-4">
          <Input label="Banner Title" placeholder="e.g. Summer Sale" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="Position" placeholder="e.g. Home Top, Sidebar, Footer" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activeCheck" className="accent-[#e84545]" />
            <label htmlFor="activeCheck" className="text-sm text-gray-700">Set as Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)}>Cancel</Button>
            <Button fullWidth onClick={() => setAddModal(false)}>Add Banner</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

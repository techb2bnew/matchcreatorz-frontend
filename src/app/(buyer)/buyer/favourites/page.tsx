'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Loader';
import { formatCurrency } from '@/lib/utils';
import { buyerFavouriteApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface FavService {
  id: number;
  title: string;
  price: number;
  delivery_days: number;
  rating: number;
  reviews_count: number;
  images: string[] | null;
  seller: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
}
interface FavRow {
  id: number;
  service: FavService | null;
}

export default function FavouritesPage() {
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [removing, setRemoving]     = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await buyerFavouriteApi.list();
      setFavourites((res.data || []).filter((r: FavRow) => r.service));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load favourites');
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (serviceId: number) => {
    setRemoving(serviceId);
    // optimistic removal
    const prev = favourites;
    setFavourites((f) => f.filter((row) => row.service?.id !== serviceId));
    try {
      await buyerFavouriteApi.remove(serviceId);
      toast.success('Removed from favourites');
    } catch (err: unknown) {
      setFavourites(prev); // revert
      toast.error(err instanceof Error ? err.message : 'Could not remove favourite');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="BUYER" title="My Favourites">
        <CardSkeleton count={6} />
      </DashboardLayout>
    );
  }

  if (favourites.length === 0) {
    return (
      <DashboardLayout role="BUYER" title="My Favourites">
        <div className="flex flex-col items-center justify-center py-24">
          <i className="fa fa-heart text-3xl text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No favourites yet</h3>
          <p className="text-sm text-gray-400 mb-6">Browse services and save your favourite creators</p>
          <Button onClick={() => router.push('/buyer/search')}>Browse Services</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="BUYER" title="My Favourites">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{favourites.length} saved service{favourites.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {favourites.map((row) => {
          const s = row.service!;
          return (
            <Card key={row.id} padding="md" hover className="text-center relative">
              {/* Heart remove button */}
              <button
                onClick={() => remove(s.id)}
                disabled={removing === s.id}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Remove from favourites"
              >
                {removing === s.id
                  ? <i className="fa fa-spinner fa-spin text-sm text-[#e84545]" />
                  : <i className="fa fa-heart text-sm text-[#e84545]" />}
              </button>

              {/* Avatar */}
              <div className="flex justify-center mb-3">
                <Avatar name={s.seller?.name || 'Seller'} size="lg" />
              </div>

              <h3 className="font-semibold text-gray-900 mb-0.5 line-clamp-1">{s.seller?.name || 'Seller'}</h3>
              <p className="text-xs text-gray-500 mb-1 line-clamp-2">{s.title}</p>
              {s.category && <p className="text-[11px] text-gray-400 mb-2">{s.category.name}</p>}

              <div className="flex items-center justify-center gap-1 mb-2">
                <i className="fa fa-star text-yellow-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">{Number(s.rating || 0).toFixed(1)}</span>
                <span className="text-xs text-gray-400">({s.reviews_count || 0})</span>
              </div>

              <p className="text-sm font-bold text-[#e84545] mb-3">From {formatCurrency(s.price)}</p>

              <Button variant="outline" size="sm" fullWidth onClick={() => router.push('/buyer/search')}>
                View Services
              </Button>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

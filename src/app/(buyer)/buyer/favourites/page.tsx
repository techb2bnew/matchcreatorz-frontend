'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

const initialFavourites = [
  { id: 1, name: 'Bob Smith',    category: 'Logo Designer',    rating: 4.9, reviews: 124, price: 50  },
  { id: 2, name: 'Diana Prince', category: 'Full Stack Dev',   rating: 4.8, reviews: 87,  price: 120 },
  { id: 3, name: 'Frank Miller', category: 'SEO Specialist',   rating: 4.7, reviews: 203, price: 80  },
  { id: 4, name: 'Grace Hopper', category: 'Content Writer',   rating: 4.9, reviews: 156, price: 40  },
  { id: 5, name: 'Iris West',    category: 'Motion Designer',  rating: 4.6, reviews: 68,  price: 150 },
  { id: 6, name: 'Jake Long',    category: 'Brand Strategist', rating: 4.8, reviews: 45,  price: 200 },
];

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState(initialFavourites);

  const remove = (id: number) => {
    setFavourites((prev) => prev.filter((f) => f.id !== id));
  };

  if (favourites.length === 0) {
    return (
      <DashboardLayout role="BUYER" title="My Favourites">
        <div className="flex flex-col items-center justify-center py-24">
          <i className="fa fa-heart text-lg text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No favourites yet</h3>
          <p className="text-sm text-gray-400 mb-6">Browse services and save your favourite creators</p>
          <Button>Browse Services</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="BUYER" title="My Favourites">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{favourites.length} saved creators</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {favourites.map((f) => (
          <Card key={f.id} padding="md" hover className="text-center relative">
            {/* Heart remove button */}
            <button
              onClick={() => remove(f.id)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Remove from favourites"
            >
              <i className="fa fa-heart text-sm fill-[#e84545] stroke-[#e84545]" />
            </button>

            {/* Avatar */}
            <div className="flex justify-center mb-3">
              <Avatar name={f.name} size="lg" />
            </div>

            <h3 className="font-semibold text-gray-900 mb-0.5">{f.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{f.category}</p>

            <div className="flex items-center justify-center gap-1 mb-2">
              <i className="fa fa-star text-yellow-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">{f.rating}</span>
              <span className="text-xs text-gray-400">({f.reviews})</span>
            </div>

            <p className="text-sm font-bold text-[#e84545] mb-3">From {formatCurrency(f.price)}</p>

            <Button variant="outline" size="sm" fullWidth>View Profile</Button>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

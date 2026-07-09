'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatCurrency } from '@/lib/utils';

const services = [
  { id: 1,  title: 'Professional Logo Design',     seller: 'Bob Smith',    rating: 4.9, reviews: 124, price: 75,  category: 'Design',       gradient: 'from-blue-100 to-indigo-200'   },
  { id: 2,  title: 'Full Stack Web Development',   seller: 'Diana Prince', rating: 4.8, reviews: 87,  price: 300, category: 'Development',  gradient: 'from-green-100 to-teal-200'    },
  { id: 3,  title: 'SEO Content Writing',          seller: 'Frank Miller', rating: 4.7, reviews: 203, price: 50,  category: 'Writing',      gradient: 'from-yellow-100 to-orange-200' },
  { id: 4,  title: 'Social Media Marketing',       seller: 'Grace Hopper', rating: 4.6, reviews: 156, price: 120, category: 'Marketing',    gradient: 'from-pink-100 to-rose-200'     },
  { id: 5,  title: 'Product Photography',          seller: 'Henry Ford',   rating: 4.5, reviews: 92,  price: 180, category: 'Photography',  gradient: 'from-purple-100 to-violet-200' },
  { id: 6,  title: 'Motion Graphics & Animation',  seller: 'Iris West',    rating: 4.9, reviews: 68,  price: 250, category: 'Video',        gradient: 'from-red-100 to-pink-200'      },
  { id: 7,  title: 'Brand Identity Package',       seller: 'Jake Long',    rating: 4.8, reviews: 45,  price: 500, category: 'Design',       gradient: 'from-cyan-100 to-blue-200'     },
  { id: 8,  title: 'Email Marketing Campaigns',    seller: 'Karen Cole',   rating: 4.4, reviews: 178, price: 85,  category: 'Marketing',    gradient: 'from-lime-100 to-green-200'    },
  { id: 9,  title: 'Mobile App UI/UX Design',      seller: 'Leo Max',      rating: 4.7, reviews: 112, price: 200, category: 'Design',       gradient: 'from-amber-100 to-yellow-200'  },
];

const categoryChips = ['All', 'Design', 'Development', 'Marketing', 'Writing', 'Video'];

export default function BuyerSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [liked, setLiked] = useState<number[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [rating, setRating] = useState('any');
  const [delivery, setDelivery] = useState('any');
  const [sort, setSort] = useState('relevance');

  const toggleLike = (id: number) => {
    setLiked((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const filtered = services.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChip = activeChip === 'All' || s.category === activeChip;
    const matchMin = priceMin === '' || s.price >= Number(priceMin);
    const matchMax = priceMax === '' || s.price <= Number(priceMax);
    return matchSearch && matchChip && matchMin && matchMax;
  });

  return (
    <DashboardLayout role="BUYER" title="Search">
      {/* Top search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-10">
          <i className="fa fa-search text-sm text-gray-400" />
          <input
            type="text"
            placeholder="Search services, skills, sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="w-48">
          <CustomSelect
            value={sort}
            onChange={(v) => setSort(v)}
            options={['Relevance', 'Price: Low to High', 'Price: High to Low', 'Best Rated']}
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {categoryChips.map((c) => (
          <button
            key={c}
            onClick={() => setActiveChip(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeChip === c ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Sidebar filters */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa fa-sliders text-sm text-[#e84545]" />
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#e84545]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#e84545]"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
              {[{ v: 'any', l: 'Any' }, { v: '4', l: '4+ Stars' }, { v: '4.5', l: '4.5+ Stars' }].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input type="radio" name="rating" value={opt.v} checked={rating === opt.v} onChange={() => setRating(opt.v)} className="accent-[#e84545]" />
                  <span className="text-sm text-gray-700">{opt.l}</span>
                </label>
              ))}
            </div>

            {/* Delivery Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Time</label>
              {[{ v: 'any', l: 'Any' }, { v: '1', l: '1 Day' }, { v: '3', l: '3 Days' }, { v: '7', l: '7 Days' }].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input type="radio" name="delivery" value={opt.v} checked={delivery === opt.v} onChange={() => setDelivery(opt.v)} className="accent-[#e84545]" />
                  <span className="text-sm text-gray-700">{opt.l}</span>
                </label>
              ))}
            </div>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-4">Showing <strong>{filtered.length}</strong> results</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-[#e8e8e8] shadow overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                {/* Image placeholder */}
                <div className={`h-40 bg-gradient-to-br ${s.gradient} relative`}>
                  <button
                    onClick={() => toggleLike(s.id)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <i className={liked.includes(s.id) ? 'fa fa-heart text-[#e84545] text-sm' : 'fa fa-heart-o text-gray-400 text-sm'} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={s.seller} size="xs" />
                    <span className="text-xs text-gray-500">{s.seller}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{s.title}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <i className="fa fa-star text-yellow-400 text-xs" />
                    <span className="text-xs font-medium text-gray-700">{s.rating}</span>
                    <span className="text-xs text-gray-400">({s.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">From</span>
                    <span className="text-sm font-bold text-[#e84545]">{formatCurrency(s.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

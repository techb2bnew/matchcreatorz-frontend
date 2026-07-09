'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';

const initialReviews = [
  { id: 1, reviewer: 'Alice Johnson', seller: 'Bob Smith',    rating: 5, comment: 'Absolutely amazing work! The logo exceeded all my expectations. Highly recommend.', date: '2024-11-10', status: 'PUBLISHED' },
  { id: 2, reviewer: 'Carlos Ruiz',   seller: 'Diana Prince', rating: 4, comment: 'Great developer, delivered on time. Minor tweaks needed but overall very satisfied.', date: '2024-11-08', status: 'PUBLISHED' },
  { id: 3, reviewer: 'Eva Green',     seller: 'Frank Miller', rating: 2, comment: 'Disappointing experience. Work quality was below par and communication was poor.', date: '2024-11-07', status: 'HIDDEN'    },
  { id: 4, reviewer: 'John Doe',      seller: 'Grace Hopper', rating: 5, comment: 'Perfect content writing. She understood our brand voice immediately. Will hire again!', date: '2024-11-05', status: 'PUBLISHED' },
  { id: 5, reviewer: 'Maria Chen',    seller: 'Henry Ford',   rating: 3, comment: 'Decent video quality but took longer than promised. Final result was acceptable.', date: '2024-11-03', status: 'PUBLISHED' },
  { id: 6, reviewer: 'Sam Taylor',    seller: 'Bob Smith',    rating: 1, comment: 'This is spam. Completely fake review trying to destroy the seller reputation.', date: '2024-11-01', status: 'HIDDEN'    },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= rating ? 'fa fa-star text-yellow-400 text-xs' : 'fa fa-star-o text-gray-300 text-xs'} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = reviews.filter((r) =>
    activeFilter === 'All' || r.status === activeFilter.toUpperCase()
  );

  const toggle = (id: number) => {
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: r.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED' } : r)
    );
  };

  return (
    <DashboardLayout role="ADMIN" title="Reviews">
      <Card padding="none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Filter:</p>
          <div className="flex gap-2">
            {['All', 'Published', 'Hidden'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Reviewer', 'Seller', 'Rating', 'Comment', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.reviewer} size="sm" />
                      <span className="font-medium text-gray-900">{r.reviewer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.seller}</td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                    <p className="truncate text-xs">{r.comment.length > 60 ? r.comment.slice(0, 60) + '…' : r.comment}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View"><i className="fa fa-eye text-sm" /></button>
                      <button onClick={() => toggle(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Toggle visibility">
                        {r.status === 'PUBLISHED' ? <i className="fa fa-eye-slash text-sm" /> : <i className="fa fa-eye text-sm" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-400">Showing {filtered.length} of {reviews.length} reviews</p>
          <div className="flex gap-1">
            {[1, 2].map((p) => (
              <button key={p} className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === 1 ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

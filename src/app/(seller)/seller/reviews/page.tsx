'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { formatTimeAgo } from '@/lib/utils';
import { sellerReviewApi } from '@/lib/adminApi';

interface ReviewUser { id: number; name: string; email: string; }
interface Review {
  id: number;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  buyer:   ReviewUser | null;
  service: { id: number; title: string } | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`${i <= rating ? 'fa fa-star text-yellow-400' : 'fa fa-star-o text-gray-300'} text-sm`} />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [avgRating, setAvgRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await sellerReviewApi.list({ limit: 50 });
      const data: Review[] = res.data || [];
      setReviews(data);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  return (
    <DashboardLayout role="SELLER" title="My Reviews">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <i className="fa fa-star text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Average Rating</p>
              <p className="text-xl font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <i className="fa fa-comments text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Reviews</p>
              <p className="text-xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card padding="md">
          <div className="py-12 text-center">
            <i className="fa fa-star text-4xl text-gray-200 mb-3 block" />
            <p className="text-gray-400 text-sm font-medium">No reviews yet</p>
            <p className="text-gray-400 text-xs mt-1">Reviews will appear here after buyers complete bookings</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} padding="md">
              <div className="flex items-start gap-4">
                <Avatar name={r.buyer?.name || 'B'} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{r.buyer?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{r.buyer?.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatTimeAgo(r.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <StarRow rating={r.rating} />
                    {r.service && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                        {r.service.title}
                      </span>
                    )}
                  </div>

                  {r.comment && (
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed bg-gray-50 rounded-xl p-3">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

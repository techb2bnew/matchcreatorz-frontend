'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatCurrency } from '@/lib/utils';
import { buyerSearchApi, publicCategoryApi, buyerBookingApi, buyerFavouriteApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  rating: number;
  reviews_count: number;
  images: string[] | null;
  seller: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const SORT_OPTIONS = [
  { label: 'Relevance',          value: 'relevance'  },
  { label: 'Price: Low to High', value: 'price_asc'  },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Rated',         value: 'best_rated' },
];

const CARD_GRADIENTS = [
  'from-blue-100 to-indigo-200',
  'from-green-100 to-teal-200',
  'from-yellow-100 to-orange-200',
  'from-pink-100 to-rose-200',
  'from-purple-100 to-violet-200',
  'from-red-100 to-pink-200',
  'from-cyan-100 to-blue-200',
  'from-lime-100 to-green-200',
  'from-amber-100 to-yellow-200',
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-3 w-8 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/* -- Booking Confirm Modal ----------------------------------------- */
function BookingModal({
  service,
  onClose,
  onSuccess,
}: {
  service: Service;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!service.seller?.id) { setError('Seller info missing'); return; }
    setLoading(true); setError('');
    try {
      await buyerBookingApi.create({
        seller_id:    service.seller.id,
        service_id:   service.id,
        title:        service.title,
        amount:       service.price,
        delivery_days: service.delivery_days,
        notes:        notes.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(onSuccess, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">Confirm Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa fa-times text-lg" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Service summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{service.title}</p>
            <div className="flex items-center gap-2 mb-3">
              <Avatar name={service.seller?.name || 'Seller'} size="xs" />
              <span className="text-xs text-gray-500">{service.seller?.name || 'Seller'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2.5 text-center">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="font-bold text-[#e84545] text-sm">{formatCurrency(service.price)}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 text-center">
                <p className="text-xs text-gray-400">Delivery</p>
                <p className="font-bold text-gray-800 text-sm">{service.delivery_days} days</p>
              </div>
            </div>
          </div>

          {/* Platform fee note */}
          <div className="flex items-start gap-2 text-xs text-gray-400 bg-blue-50 rounded-lg px-3 py-2">
            <i className="fa fa-info-circle text-blue-400 mt-0.5" />
            <span>Platform fee of 10% will be applied. Total: <strong className="text-gray-600">{formatCurrency(service.price * 1.1)}</strong></span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Notes <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or instructions for the seller..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 text-center">
              <i className="fa fa-exclamation-circle mr-1" />{error}
            </p>
          )}

          {/* Success */}
          {submitted && (
            <p className="text-sm text-green-600 text-center font-medium">
              <i className="fa fa-check-circle mr-1" />Booking created! Redirecting...
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={loading || submitted}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || submitted}
              className="flex-1 py-2.5 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73a3a] transition-colors disabled:opacity-60"
            >
              {loading ? <><i className="fa fa-spinner fa-spin mr-1" />Booking...</> : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- Service Detail Modal ------------------------------------------ */
function ServiceDetailModal({
  service,
  onClose,
  onBook,
}: {
  service: Service;
  onClose: () => void;
  onBook: (s: Service) => void;
}) {
  const images = service.images && service.images.length > 0 ? service.images : [];
  const [imgIdx, setImgIdx] = useState(0);
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image carousel -- fixed top */}
        <div className="flex-shrink-0 relative h-48 bg-gray-100">
          {images.length > 0 ? (
            <img
              src={images[imgIdx]}
              alt={`${service.title} ${imgIdx + 1}`}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className={`h-48 bg-gradient-to-br ${CARD_GRADIENTS[service.id % CARD_GRADIENTS.length]}`} />
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black bg-opacity-40 text-white flex items-center justify-center hover:bg-opacity-70 transition"
              >
                <i className="fa fa-chevron-left text-xs" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black bg-opacity-40 text-white flex items-center justify-center hover:bg-opacity-70 transition"
              >
                <i className="fa fa-chevron-right text-xs" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                    className={`rounded-full transition-all ${i === imgIdx ? 'bg-white w-4 h-2' : 'bg-white bg-opacity-50 w-2 h-2'}`}
                  />
                ))}
              </div>
            </>
          )}

          {images.length > 1 && (
            <span className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded-full">
              {imgIdx + 1}/{images.length}
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{service.title}</h2>
            <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5">
              <i className="fa fa-times text-lg" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Avatar name={service.seller?.name || 'Seller'} size="xs" />
              <span className="text-sm font-medium text-gray-700">{service.seller?.name || 'Seller'}</span>
            </div>
            {service.category && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{service.category.name}</span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <i className="fa fa-star text-yellow-400 text-xs" />
              <strong>{Number(service.rating).toFixed(1)}</strong>
              <span className="text-gray-400">({service.reviews_count} reviews)</span>
            </span>
            <span className="flex items-center gap-1">
              <i className="fa fa-clock-o text-gray-400 text-xs" />
              {service.delivery_days} day{service.delivery_days !== 1 ? 's' : ''} delivery
            </span>
          </div>

          {service.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">About this service</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">{service.description}</p>
            </div>
          )}
        </div>

        {/* Price + CTA -- fixed bottom */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
          <div>
            <span className="text-xs text-gray-400">Starting from</span>
            <p className="text-2xl font-bold text-[#e84545]">{formatCurrency(service.price)}</p>
          </div>
          <button
            onClick={() => onBook(service)}
            className="bg-[#e84545] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#c73a3a] transition-colors"
          >
            Contact Seller
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Main Page ----------------------------------------------------- */
export default function BuyerSearchPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery]   = useState('');
  const [activeChip,  setActiveChip]    = useState('All');
  const [liked,       setLiked]         = useState<number[]>([]);
  const [priceMin,    setPriceMin]       = useState('');
  const [priceMax,    setPriceMax]       = useState('');
  const [rating,      setRating]         = useState('any');
  const [delivery,    setDelivery]       = useState('any');
  const [sort,        setSort]           = useState('relevance');
  const [page,        setPage]           = useState(1);

  const [services,    setServices]       = useState<Service[]>([]);
  const [pagination,  setPagination]     = useState<Pagination | null>(null);
  const [loading,     setLoading]        = useState(true);
  const [error,       setError]          = useState('');
  const [selected,    setSelected]       = useState<Service | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  // Categories from API
  const [categories,  setCategories]     = useState<string[]>(['All']);
  const [catsLoading, setCatsLoading]    = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    publicCategoryApi.list()
      .then((res: { data: { id: number; name: string; icon: string }[] }) => {
        const names = (res.data || []).map((c) => c.name);
        setCategories(['All', ...names]);
      })
      .catch(() => {
        setCategories(['All', 'Design', 'Development', 'Marketing', 'Writing', 'Video', 'Photography']);
      })
      .finally(() => setCatsLoading(false));
  }, []);

  // Initialise the heart state from the buyer's favourited service ids
  useEffect(() => {
    buyerFavouriteApi.ids()
      .then((res: { data?: number[] }) => setLiked(res.data || []))
      .catch(() => {/* silent -- keep empty */});
  }, []);

  const fetchServices = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { sort, page: pg, limit: 12 };
      if (searchQuery.trim())          params.search        = searchQuery.trim();
      if (activeChip !== 'All')        params.category      = activeChip;
      if (priceMin !== '')             params.price_min     = priceMin;
      if (priceMax !== '')             params.price_max     = priceMax;
      if (rating !== 'any')            params.rating        = rating;
      if (delivery !== 'any')          params.delivery_days = delivery;

      const res = await buyerSearchApi.search(params);
      setServices(res.data || []);
      setPagination(res.pagination || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load services';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeChip, priceMin, priceMax, rating, delivery, sort]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchServices(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchServices]);

  const handlePageChange = (pg: number) => {
    setPage(pg);
    fetchServices(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLike = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const wasLiked = liked.includes(id);
    // optimistic update
    setLiked((prev) => wasLiked ? prev.filter((i) => i !== id) : [...prev, id]);
    try {
      if (wasLiked) await buyerFavouriteApi.remove(id);
      else          await buyerFavouriteApi.add(id);
    } catch (err: unknown) {
      // revert on failure
      setLiked((prev) => wasLiked ? [...prev, id] : prev.filter((i) => i !== id));
      toast.error(err instanceof Error ? err.message : 'Could not update favourite');
    }
  };

  const handleBook = (s: Service) => {
    setSelected(null);
    setBookingService(s);
  };

  const handleBookingSuccess = () => {
    setBookingService(null);
    router.push('/buyer/bookings');
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Relevance';

  return (
    <DashboardLayout role="BUYER" title="Search Creators">
      {/* Service detail modal */}
      {selected && (
        <ServiceDetailModal
          service={selected}
          onClose={() => setSelected(null)}
          onBook={handleBook}
        />
      )}

      {/* Booking confirm modal */}
      {bookingService && (
        <BookingModal
          service={bookingService}
          onClose={() => setBookingService(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

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
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
              <i className="fa fa-times text-xs" />
            </button>
          )}
        </div>
        <div className="w-48">
          <CustomSelect
            value={sortLabel}
            onChange={(v) => {
              const found = SORT_OPTIONS.find(o => o.label === v);
              if (found) setSort(found.value);
            }}
            options={SORT_OPTIONS.map(o => o.label)}
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {catsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
            ))
          : categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveChip(c);
                  setRating('any'); // reset Top Creators when category selected
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeChip === c && rating === 'any' ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))
        }

        {/* Top Creators chip */}
        <button
          onClick={() => {
            if (rating === '4') {
              setRating('any');
            } else {
              setRating('4');
              setActiveChip('All'); // reset category when Top Creators selected
            }
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            rating === '4' ? 'bg-yellow-400 text-white' : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
          }`}
        >
          <i className="fa fa-star text-xs" />
          Top Creators
        </button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar filters */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa fa-sliders text-sm text-[#e84545]" />
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
            </div>

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

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
              {[{ v: 'any', l: 'Any' }, { v: '4', l: '4+ Stars' }, { v: '4.5', l: '4.5+ Stars' }].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input type="radio" name="rating" value={opt.v} checked={rating === opt.v} onChange={() => setRating(opt.v)} className="accent-[#e84545]" />
                  <span className="text-sm text-gray-700">{opt.l}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Time</label>
              {[{ v: 'any', l: 'Any' }, { v: '1', l: '1 Day' }, { v: '3', l: '3 Days' }, { v: '7', l: '7 Days' }].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input type="radio" name="delivery" value={opt.v} checked={delivery === opt.v} onChange={() => setDelivery(opt.v)} className="accent-[#e84545]" />
                  <span className="text-sm text-gray-700">{opt.l}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => { setPriceMin(''); setPriceMax(''); setRating('any'); setDelivery('any'); setActiveChip('All'); setSearchQuery(''); }}
              className="w-full text-xs text-gray-400 hover:text-[#e84545] transition-colors text-center"
            >
              Clear all filters
            </button>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-4">
            {!loading && (pagination ? (
              <>Showing <strong>{services.length}</strong> of <strong>{pagination.total}</strong> results</>
            ) : (
              <>Showing <strong>{services.length}</strong> results</>
            ))}
          </p>

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600 flex items-center gap-2">
              <i className="fa fa-exclamation-circle" />
              <span>{error}</span>
              <button onClick={() => fetchServices(page)} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : services.length === 0 && !error
                ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                    <i className="fa fa-search text-4xl mb-3" />
                    <p className="text-base font-medium text-gray-500">No services found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search term</p>
                  </div>
                )
                : services.map((s, idx) => {
                    const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                    const firstImage = s.images && s.images.length > 0 ? s.images[0] : null;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className="bg-white rounded-2xl border border-[#e8e8e8] shadow overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                      >
                        <div className={`h-40 relative ${firstImage ? '' : `bg-gradient-to-br ${gradient}`}`}>
                          {firstImage && (
                            <img src={firstImage} alt={s.title} className="w-full h-full object-cover" />
                          )}
                          <button
                            onClick={(e) => toggleLike(e, s.id)}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <i className={liked.includes(s.id) ? 'fa fa-heart text-[#e84545] text-sm' : 'fa fa-heart-o text-gray-400 text-sm'} />
                          </button>
                          {s.category && (
                            <span className="absolute bottom-2 left-2 bg-black bg-opacity-40 text-white text-xs px-2 py-0.5 rounded-full">
                              {s.category.name}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar name={s.seller?.name || 'Seller'} size="xs" />
                            <span className="text-xs text-gray-500">{s.seller?.name || 'Seller'}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">{s.title}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <i className="fa fa-star text-yellow-400 text-xs" />
                            <span className="text-xs font-medium text-gray-700">{Number(s.rating).toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({s.reviews_count})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              <i className="fa fa-clock-o mr-1" />{s.delivery_days}d delivery
                            </span>
                            <span className="text-sm font-bold text-[#e84545]">from {formatCurrency(s.price)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
            }
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 w-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center hover:border-[#e84545] hover:text-[#e84545] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(pg => pg === 1 || pg === pagination.pages || Math.abs(pg - page) <= 2)
                .reduce<(number | string)[]>((acc, pg, i, arr) => {
                  if (i > 0 && typeof arr[i - 1] === 'number' && (pg as number) - (arr[i - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(pg);
                  return acc;
                }, [])
                .map((pg, i) =>
                  pg === '...' ? (
                    <span key={`ellipsis-${i}`} className="text-gray-400 text-sm px-1">...</span>
                  ) : (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg as number)}
                      className={`h-8 w-8 rounded-lg border text-sm font-medium transition-colors ${
                        page === pg
                          ? 'bg-[#e84545] border-[#e84545] text-white'
                          : 'border-gray-200 text-gray-600 hover:border-[#e84545] hover:text-[#e84545]'
                      }`}
                    >
                      {pg}
                    </button>
                  )
                )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.pages}
                className="h-8 w-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center hover:border-[#e84545] hover:text-[#e84545] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { publicBannerApi, PublicBanner } from '@/lib/adminApi';

/**
 * Fetches active promotional banners and renders them in a horizontally
 * scrollable strip. Renders nothing while loading or if there are none —
 * dashboards shouldn't show an empty placeholder for this.
 */
export default function BannerStrip({ position }: { position?: string }) {
  const [banners, setBanners] = useState<PublicBanner[]>([]);

  useEffect(() => {
    publicBannerApi.list(position)
      .then((res) => setBanners(res.data || []))
      .catch(() => {/* silent -- banners are decorative, never block the dashboard */});
  }, [position]);

  if (banners.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 -mb-1 mb-5 snap-x snap-mandatory">
      {banners.map((b) => {
        const content = (
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-100 border border-[#e8e8e8] shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        );
        return (
          <div
            key={b.id}
            className="flex-shrink-0 snap-start w-full sm:w-[420px]"
            style={{ aspectRatio: '16/5' }}
          >
            {b.link_url ? (
              <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full" aria-label={b.title}>
                {content}
              </a>
            ) : content}
          </div>
        );
      })}
    </div>
  );
}

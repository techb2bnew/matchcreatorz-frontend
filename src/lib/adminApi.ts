import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface BookingAttachment {
  url: string;
  name: string;
  type?: string;
  size?: number;
}

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${Cookies.get('mc_token') || ''}`,
});

// The backend re-checks the account is still live (not deleted/banned/inactive)
// on every request, so a 401 here means the session itself is no longer valid
// — not just "this one call failed". Clear it client-side and bounce to login
// so a deleted/blocked user can't keep sitting on a stale page.
const handleUnauthorized = () => {
  Cookies.remove('mc_token');
  Cookies.remove('mc_user_type');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const req = async (method: string, path: string, body?: unknown) => {
  const res  = await fetch(`${API}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error(json.message || 'Request failed');
  }
  return json;
};

/** Send multipart/form-data (for service create/update with image uploads) */
const sendForm = async (method: string, path: string, formData: FormData) => {
  const res  = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${Cookies.get('mc_token') || ''}` },
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error(json.message || 'Request failed');
  }
  return json;
};

// -- Sellers ----------------------------------------------------------
export const sellerApi = {
  list:    (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/sellers?${q}`);
  },
  get:     (id: number)          => req('GET',   `/api/v1/admin/sellers/${id}`),
  add:     (body: unknown)       => req('POST',  `/api/v1/admin/sellers`, body),
  edit:    (id: number, b: unknown) => req('PUT', `/api/v1/admin/sellers/${id}`, b),
  approve: (id: number)          => req('PATCH', `/api/v1/admin/sellers/${id}/approve`),
  reject:  (id: number)          => req('PATCH', `/api/v1/admin/sellers/${id}/reject`),
  block:   (id: number)          => req('PATCH', `/api/v1/admin/sellers/${id}/block`),
  unblock: (id: number)          => req('PATCH', `/api/v1/admin/sellers/${id}/unblock`),
};

// -- Buyers -----------------------------------------------------------
export const buyerApi = {
  list:    (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/buyers?${q}`);
  },
  get:     (id: number)          => req('GET',   `/api/v1/admin/buyers/${id}`),
  add:     (body: unknown)       => req('POST',  `/api/v1/admin/buyers`, body),
  edit:    (id: number, b: unknown) => req('PUT', `/api/v1/admin/buyers/${id}`, b),
  approve: (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/approve`),
  reject:  (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/reject`),
  block:   (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/block`),
  unblock: (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/unblock`),
};

// -- Public categories (no auth) ---------------------------------------
export const publicCategoryApi = {
  list: (): Promise<{ data: { id: number; name: string; icon: string }[] }> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`)
      .then(r => r.json()),
};

export interface PublicPlatformStats { total_creators: number; avg_rating: number; satisfaction_pct: number; avg_bids_per_job: number }
export const publicStatsApi = {
  get: (): Promise<{ data: PublicPlatformStats }> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/stats`).then(r => r.json()),
};

// -- Public static pages (Terms, Privacy, etc.) — no auth ----------------
export interface PublicPage { slug: string; title: string; content: string; updatedAt?: string }
export const publicPageApi = {
  get: (slug: string): Promise<{ data: PublicPage }> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/pages/${slug}`).then(r => r.json()),
};

// -- Seller Services ---------------------------------------------------
export const sellerServiceApi = {
  list: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/seller/services?${q}`);
  },
  get:     (id: number)                  => req('GET',    `/api/v1/seller/services/${id}`),
  /** Create service -- send FormData (fields + image files) */
  create:  (formData: FormData)          => sendForm('POST',   `/api/v1/seller/services`, formData),
  /** Update service -- send FormData (fields + new files + existing_images JSON) */
  update:  (id: number, formData: FormData) => sendForm('PUT', `/api/v1/seller/services/${id}`, formData),
  delete:  (id: number)                  => req('DELETE', `/api/v1/seller/services/${id}`),
  publish: (id: number)                  => req('PATCH',  `/api/v1/seller/services/${id}/publish`),
  pause:   (id: number)                  => req('PATCH',  `/api/v1/seller/services/${id}/pause`),
};

// -- Admin Services ----------------------------------------------------
export const adminServiceApi = {
  list: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/services?${q}`);
  },
  get:     (id: number) => req('GET',    `/api/v1/admin/services/${id}`),
  reject:  (id: number) => req('PATCH',  `/api/v1/admin/services/${id}/reject`),
  restore: (id: number) => req('PATCH',  `/api/v1/admin/services/${id}/restore`),
  feature: (id: number) => req('PATCH',  `/api/v1/admin/services/${id}/feature`),
  delete:  (id: number) => req('DELETE', `/api/v1/admin/services/${id}`),
};

// -- Categories (admin) ------------------------------------------------
export const categoryApi = {
  list:   (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/categories?${q}`);
  },
  get:    (id: number)             => req('GET',    `/api/v1/admin/categories/${id}`),
  add:    (body: unknown)          => req('POST',   `/api/v1/admin/categories`, body),
  edit:   (id: number, b: unknown) => req('PUT',    `/api/v1/admin/categories/${id}`, b),
  delete: (id: number)             => req('DELETE', `/api/v1/admin/categories/${id}`),
};

// -- Banners (admin) ----------------------------------------------------
export interface AdminBanner {
  id: number; title: string; image_url: string; link_url: string | null;
  position: string; is_active: boolean; display_order: number;
  createdAt?: string; created_at?: string;
}
export const adminBannerApi = {
  list:   (): Promise<{ data: AdminBanner[] }> => req('GET', `/api/v1/admin/banners`),
  create: (formData: FormData) => sendForm('POST', `/api/v1/admin/banners`, formData),
  update: (id: number, formData: FormData) => sendForm('PUT', `/api/v1/admin/banners/${id}`, formData),
  delete: (id: number) => req('DELETE', `/api/v1/admin/banners/${id}`),
};

// -- Static Pages (admin) -------------------------------------------------
export interface AdminPage {
  id: number; slug: string; title: string; content: string;
  createdAt?: string; updatedAt?: string;
}
export const adminPageApi = {
  list:   (): Promise<{ data: AdminPage[] }> => req('GET', `/api/v1/admin/pages`),
  update: (id: number, body: { title?: string; content?: string }) => req('PUT', `/api/v1/admin/pages/${id}`, body),
};

// -- Profile API (works for admin, seller, buyer) ----------------------
export const profileApi = {
  /** GET /api/v1/{role}/profile */
  get: (role: 'admin' | 'seller' | 'buyer') =>
    req('GET', `/api/v1/${role}/profile`),

  /** PUT /api/v1/{role}/profile */
  update: (role: 'admin' | 'seller' | 'buyer', body: {
    user_id?: number | null; name?: string; phone?: string; bio?: string; location?: string; avatar?: string;
    // seller professional fields
    skills?: string[]; hourly_rate?: number; city?: string; country?: string;
    resume?: string; portfolio_links?: string[]; portfolio_files?: string[];
  }) => req('PUT', `/api/v1/${role}/profile`, body),

  /** PUT /api/v1/{role}/change-password */
  changePassword: (role: 'admin' | 'seller' | 'buyer', body: {
    user_id?: number | null; current_password: string; new_password: string;
  }) => req('PUT', `/api/v1/${role}/change-password`, body),

  /** POST /api/v1/seller/upload/resume  — uploads PDF/DOC and returns { url } */
  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return sendForm('POST', `/api/v1/seller/upload/resume`, fd);
  },

  /** DELETE /api/v1/{role}/account — permanently (soft-)deletes the account */
  deleteAccount: (role: 'seller' | 'buyer', reason?: string) =>
    req('DELETE', `/api/v1/${role}/account`, reason ? { reason } : undefined),
};

// -- Buyer Jobs --------------------------------------------------------
export const buyerJobApi = {
  list: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/buyer/jobs${q ? `?${q}` : ''}`);
  },
  get:    (id: number)                  => req('GET',    `/api/v1/buyer/jobs/${id}`),
  /** GET /api/v1/buyer/jobs/stats — aggregate counters across ALL of the buyer's jobs, not just the current page */
  stats:  ()                            => req('GET',    `/api/v1/buyer/jobs/stats`),
  create: (body: {
    title: string; description?: string; category?: string;
    job_type?: string; budget_min?: number; budget_max?: number;
    deadline?: string; skills?: string[]; experience_level?: string;
    attachments?: { url: string; name: string }[];
  }) => req('POST', `/api/v1/buyer/jobs`, body),
  update: (id: number, body: {
    title?: string; description?: string; category?: string;
    job_type?: string; budget_min?: number; budget_max?: number;
    deadline?: string; skills?: string[]; experience_level?: string;
    attachments?: { url: string; name: string }[];
  }) => req('PUT', `/api/v1/buyer/jobs/${id}`, body),
  uploadDocs: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return sendForm('POST', `/api/v1/buyer/jobs/upload`, fd);
  },
  close:     (id: number)                  => req('PATCH',  `/api/v1/buyer/jobs/${id}/close`),
  complete:  (id: number)                  => req('PATCH',  `/api/v1/buyer/jobs/${id}/complete`),
  delete:    (id: number)                  => req('DELETE', `/api/v1/buyer/jobs/${id}`),
  getBids:   (id: number)                   => req('GET',   `/api/v1/buyer/jobs/${id}/bids`),
  acceptBid: (jobId: number, bidId: number) => req('PATCH', `/api/v1/buyer/jobs/${jobId}/bids/${bidId}/accept`),
  rejectBid: (jobId: number, bidId: number) => req('PATCH', `/api/v1/buyer/jobs/${jobId}/bids/${bidId}/reject`),
  counterBid: (jobId: number, bidId: number, body: { amount: number; delivery_days?: number; note?: string }) =>
    req('PATCH', `/api/v1/buyer/jobs/${jobId}/bids/${bidId}/counter`, body),
};

// -- Buyer Bookings ----------------------------------------------------
export const buyerBookingApi = {
  list:   (params: { tab?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && String(v) !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/buyer/bookings${q ? `?${q}` : ''}`);
  },
  get:    (id: number) => req('GET', `/api/v1/buyer/bookings/${id}`),
  create: (body: { seller_id: number; service_id?: number; job_id?: number; title: string; amount: number; delivery_days?: number; notes?: string }) =>
    req('POST', `/api/v1/buyer/bookings`, body),
  accept: (id: number) => req('PATCH', `/api/v1/buyer/bookings/${id}/accept`),
  reject: (id: number, dispute_reason?: string) => req('PATCH', `/api/v1/buyer/bookings/${id}/reject`, { dispute_reason }),
  cancel: (id: number, cancel_reason?: string)  => req('PATCH', `/api/v1/buyer/bookings/${id}/cancel`, { cancel_reason }),
  acceptMilestone: (id: number, milestoneId: number) =>
    req('PATCH', `/api/v1/buyer/bookings/${id}/milestones/${milestoneId}/accept`),
  rejectMilestone: (id: number, milestoneId: number, dispute_reason?: string) =>
    req('PATCH', `/api/v1/buyer/bookings/${id}/milestones/${milestoneId}/reject`, { dispute_reason }),
};

// -- Seller Bookings ---------------------------------------------------
export const sellerBookingApi = {
  list:   (params: { tab?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && String(v) !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/seller/bookings${q ? `?${q}` : ''}`);
  },
  get:     (id: number) => req('GET',   `/api/v1/seller/bookings/${id}`),
  accept:  (id: number) => req('PATCH', `/api/v1/seller/bookings/${id}/accept`),
  submit:  (id: number, body: { attachments?: BookingAttachment[]; notes?: string; delivery_days?: number | null; hours_worked?: number } = {}) =>
    req('PATCH', `/api/v1/seller/bookings/${id}/submit`, body),
  cancel:  (id: number, cancel_reason?: string) => req('PATCH', `/api/v1/seller/bookings/${id}/cancel`, { cancel_reason }),
  uploadAttachment: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return sendForm('POST', `/api/v1/seller/bookings/upload`, fd);
  },
  createMilestones: (id: number, milestones: { title: string; amount: number; duration_days?: number | null }[]) =>
    req('POST', `/api/v1/seller/bookings/${id}/milestones`, { milestones }),
  submitMilestone: (id: number, milestoneId: number, body: { attachments?: BookingAttachment[]; notes?: string; duration_days?: number | null } = {}) =>
    req('PATCH', `/api/v1/seller/bookings/${id}/milestones/${milestoneId}/submit`, body),
};

// -- Admin Bookings ----------------------------------------------------
export const adminBookingApi = {
  list:    (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && String(v) !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/bookings${q ? `?${q}` : ''}`);
  },
  get:     (id: number) => req('GET',    `/api/v1/admin/bookings/${id}`),
  resolve: (id: number, resolution: 'completed' | 'cancelled') => req('PATCH', `/api/v1/admin/bookings/${id}/resolve`, { resolution }),
  delete:  (id: number) => req('DELETE', `/api/v1/admin/bookings/${id}`),
};

// -- Buyer Search (services) -------------------------------------------
export const buyerSearchApi = {
  search: (params: {
    id?: number | string;
    search?: string;
    category?: string;
    price_min?: number | string;
    price_max?: number | string;
    rating?: number | string;
    delivery_days?: number | string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/buyer/services${q ? `?${q}` : ''}`);
  },
};

// -- Buyer Reviews -----------------------------------------------------
export const buyerReviewApi = {
  list:   (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/buyer/reviews${q ? `?${q}` : ''}`);
  },
  create: (body: { booking_id: number; rating: number; comment?: string }) =>
    req('POST', `/api/v1/buyer/reviews`, body),
};

// -- Seller Reviews ----------------------------------------------------
export const sellerReviewApi = {
  list: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/seller/reviews${q ? `?${q}` : ''}`);
  },
};

// -- Admin Reviews -----------------------------------------------------
export const adminReviewApi = {
  list:    (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && String(v) !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/reviews${q ? `?${q}` : ''}`);
  },
  publish: (id: number) => req('PATCH',  `/api/v1/admin/reviews/${id}/publish`),
  hide:    (id: number) => req('PATCH',  `/api/v1/admin/reviews/${id}/hide`),
  delete:  (id: number) => req('DELETE', `/api/v1/admin/reviews/${id}`),
};

// -- Seller Bids (my bids list) ----------------------------------------
export const sellerBidApi = {
  list: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/bids${q ? `?${q}` : ''}`);
  },
};

// -- Seller Jobs (browse + bid) ----------------------------------------
export const sellerJobApi = {
  list: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/jobs${q ? `?${q}` : ''}`);
  },
  get:         (id: number) => req('GET',    `/api/v1/seller/jobs/${id}`),
  bid:         (id: number, body: { amount: number; delivery_days: number; proposal?: string; attachments?: BookingAttachment[] }) =>
    req('POST',   `/api/v1/seller/jobs/${id}/bid`, body),
  updateBid:   (id: number, body: { amount: number; delivery_days: number; proposal?: string; attachments?: BookingAttachment[] }) =>
    req('PATCH',  `/api/v1/seller/jobs/${id}/bid`, body),
  /** POST /api/v1/seller/bids/upload — upload one portfolio/work-sample file, returns { url, name, type, size } */
  uploadBidFile: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return sendForm('POST', `/api/v1/seller/bids/upload`, fd);
  },
  withdrawBid: (id: number) =>
    req('DELETE', `/api/v1/seller/jobs/${id}/bid`),
  counterBid:  (id: number, body: { amount: number; delivery_days?: number; note?: string }) =>
    req('PATCH',  `/api/v1/seller/jobs/${id}/bid/counter`, body),
  acceptCounter: (id: number) =>
    req('PATCH',  `/api/v1/seller/jobs/${id}/bid/accept`),
};

// -- Stats (dashboard) -------------------------------------------------
export const adminStatsApi  = { get: () => req('GET', `/api/v1/admin/stats`)  };

// -- System health (public /health endpoint, no /api/v1 prefix) --------
export const systemApi = { health: () => req('GET', `/health`) };

// -- Admin Jobs --------------------------------------------------------
export const adminJobApi = {
  list:   (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req('GET', `/api/v1/admin/jobs${q ? `?${q}` : ''}`);
  },
  get:    (id: number) => req('GET',    `/api/v1/admin/jobs/${id}`),
  close:  (id: number) => req('PATCH',  `/api/v1/admin/jobs/${id}/close`),
  delete: (id: number) => req('DELETE', `/api/v1/admin/jobs/${id}`),
};
export const sellerStatsApi = { get: () => req('GET', `/api/v1/seller/stats`) };
export const buyerStatsApi  = { get: () => req('GET', `/api/v1/buyer/stats`)  };

// -- Buyer Notifications -----------------------------------------------
export const buyerNotificationApi = {
  list:        (params: { page?: number; limit?: number; unread_only?: boolean } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/buyer/notifications${q ? `?${q}` : ''}`);
  },
  unreadCount: ()           => req('GET',    `/api/v1/buyer/notifications/unread-count`),
  markRead:    (id: number) => req('PUT',    `/api/v1/buyer/notifications/${id}/read`),
  markAllRead: ()           => req('PUT',    `/api/v1/buyer/notifications/read-all`),
  delete:      (id: number) => req('DELETE', `/api/v1/buyer/notifications/${id}`),
};

// -- Seller Notifications ----------------------------------------------
export const sellerNotificationApi = {
  list:        (params: { page?: number; limit?: number; unread_only?: boolean } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/notifications${q ? `?${q}` : ''}`);
  },
  unreadCount: ()           => req('GET',    `/api/v1/seller/notifications/unread-count`),
  markRead:    (id: number) => req('PUT',    `/api/v1/seller/notifications/${id}/read`),
  markAllRead: ()           => req('PUT',    `/api/v1/seller/notifications/read-all`),
  delete:      (id: number) => req('DELETE', `/api/v1/seller/notifications/${id}`),
};

// -- Admin Notifications ------------------------------------------------
export const adminNotificationApi = {
  list:        (params: { page?: number; limit?: number; unread_only?: boolean } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/admin/notifications${q ? `?${q}` : ''}`);
  },
  unreadCount: ()           => req('GET',    `/api/v1/admin/notifications/unread-count`),
  markRead:    (id: number) => req('PUT',    `/api/v1/admin/notifications/${id}/read`),
  markAllRead: ()           => req('PUT',    `/api/v1/admin/notifications/read-all`),
  delete:      (id: number) => req('DELETE', `/api/v1/admin/notifications/${id}`),
};

// -- Buyer Favourites --------------------------------------------------
export const buyerFavouriteApi = {
  list: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/buyer/favourites${q ? `?${q}` : ''}`);
  },
  ids:    ()               => req('GET',    `/api/v1/buyer/favourites/ids`),
  add:    (serviceId: number) => req('POST',   `/api/v1/buyer/favourites/${serviceId}`),
  remove: (serviceId: number) => req('DELETE', `/api/v1/buyer/favourites/${serviceId}`),
};

// -- Buyer Offers (received) -------------------------------------------
export const buyerOfferApi = {
  list: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/buyer/offers${q ? `?${q}` : ''}`);
  },
  accept:  (id: number) => req('PATCH', `/api/v1/buyer/offers/${id}/accept`),
  decline: (id: number) => req('PATCH', `/api/v1/buyer/offers/${id}/decline`),
};

// -- Seller: buyer lookup (for offer picker) ---------------------------
export const sellerBuyerApi = {
  search: (params: { search?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/buyers${q ? `?${q}` : ''}`);
  },
};

// -- Seller Offers (sent) ----------------------------------------------
export const sellerOfferApi = {
  list: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/offers${q ? `?${q}` : ''}`);
  },
  send:     (body: { buyer_id: number; service_id?: number; title: string; description?: string; amount: number; delivery_days?: number }) =>
    req('POST', `/api/v1/seller/offers`, body),
  withdraw: (id: number) => req('DELETE', `/api/v1/seller/offers/${id}`),
};

// -- Seller Connects ----------------------------------------------------
export const sellerConnectApi = {
  balance: () => req('GET', `/api/v1/seller/connects/balance`),
  history: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/seller/connects/history${q ? `?${q}` : ''}`);
  },
  plans:          () => req('GET',  `/api/v1/seller/connects/plans`),
  purchase:       (planId: string, body: { success_url?: string; cancel_url?: string } = {}) =>
    req('POST', `/api/v1/seller/connects/purchase`, { plan_id: planId, ...body }),
  confirmPurchase: (sessionId: string) => req('GET', `/api/v1/seller/connects/purchase/confirm?session_id=${encodeURIComponent(sessionId)}`),
};

// -- Chat --------------------------------------------------------------
export const chatApi = {
  conversations: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/chat/conversations${q ? `?${q}` : ''}`);
  },
  open:      (recipient_id: number) => req('POST', `/api/v1/chat/conversations`, { recipient_id }),
  get:       (id: number) => req('GET', `/api/v1/chat/conversations/${id}`),
  messages:  (id: number, params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/chat/conversations/${id}/messages${q ? `?${q}` : ''}`);
  },
  send:      (id: number, body: string, attachment?: { url: string; name: string; type?: string }) =>
    req('POST', `/api/v1/chat/conversations/${id}/messages`, { body, attachment }),
  markRead:  (id: number) => req('PATCH', `/api/v1/chat/conversations/${id}/read`),
  unread:    () => req('GET', `/api/v1/chat/unread-count`),
  archive:   (id: number) => req('DELETE', `/api/v1/chat/conversations/${id}`),
  upload:    (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return sendForm('POST', `/api/v1/chat/upload`, fd);
  },
};

// -- Support tickets (user opens; admin queue handles) ------------------
export const supportApi = {
  tickets: (params: { page?: number; limit?: number; status?: string; scope?: string } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/support/tickets${q ? `?${q}` : ''}`);
  },
  open:     (body: { subject?: string; body: string; attachment?: { url: string; name: string; type?: string } }) =>
    req('POST', `/api/v1/support/tickets`, body),
  get:      (id: number) => req('GET', `/api/v1/support/tickets/${id}`),
  messages: (id: number, params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/support/tickets/${id}/messages${q ? `?${q}` : ''}`);
  },
  send:     (id: number, body: string, attachment?: { url: string; name: string; type?: string }) =>
    req('POST', `/api/v1/support/tickets/${id}/messages`, { body, attachment }),
  assign:   (id: number, admin_id?: number) => req('PATCH', `/api/v1/support/tickets/${id}/assign`, admin_id ? { admin_id } : {}),
  setStatus:(id: number, status: string) => req('PATCH', `/api/v1/support/tickets/${id}/status`, { status }),
  markRead: (id: number) => req('PATCH', `/api/v1/support/tickets/${id}/read`),
  unread:   () => req('GET', `/api/v1/support/unread-count`),
  upload:   (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return sendForm('POST', `/api/v1/support/upload`, fd);
  },
};

// -- Feedback (Settings → Send Feedback) --------------------------------
export const feedbackApi = {
  send: (role: 'buyer' | 'seller', body: { subject?: string; message: string }) =>
    req('POST', `/api/v1/${role}/feedback`, body),
};

// -- Wallet & payments -------------------------------------------------
export const walletApi = {
  summary:      () => req('GET', `/api/v1/wallet`),
  config:       () => req('GET', `/api/v1/wallet/config`),
  transactions: (params: { page?: number; limit?: number; type?: string } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/wallet/transactions${q ? `?${q}` : ''}`);
  },
  // buyer top-up
  topup:        (amount: number) => req('POST', `/api/v1/wallet/topup`, { amount }),
  confirmTopup: (sessionId: string) => req('GET', `/api/v1/wallet/topup/confirm?session_id=${encodeURIComponent(sessionId)}`),
  // seller payouts
  connectOnboard: () => req('POST', `/api/v1/wallet/connect/onboard`),
  connectStatus:  () => req('GET', `/api/v1/wallet/connect/status`),
  withdraw:       (amount: number) => req('POST', `/api/v1/wallet/withdraw`, { amount }),
  myWithdrawals:  (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/wallet/withdrawals${q ? `?${q}` : ''}`);
  },
  // admin
  adminOverview:    () => req('GET', `/api/v1/wallet/admin/overview`),
  adminWithdrawals: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/wallet/admin/withdrawals${q ? `?${q}` : ''}`);
  },
  approveWithdrawal: (id: number) => req('PATCH', `/api/v1/wallet/admin/withdrawals/${id}/approve`),
  rejectWithdrawal:  (id: number, note?: string) => req('PATCH', `/api/v1/wallet/admin/withdrawals/${id}/reject`, { note }),
  adminAdjust:       (body: { user_id: number; amount: number; note?: string }) => req('POST', `/api/v1/wallet/admin/adjust`, body),
};

// -- Per-user preferences (settings toggles) ---------------------------
export const preferencesApi = {
  get:    (role: 'buyer' | 'seller') => req('GET', `/api/v1/${role}/preferences`),
  update: (role: 'buyer' | 'seller', body: Record<string, unknown>) =>
    req('PUT', `/api/v1/${role}/preferences`, body),
};

// -- Admin Settings -----------------------------------------------------
export const adminSettingApi = {
  get:    ()             => req('GET', `/api/v1/admin/settings`),
  update: (body: Record<string, unknown>) => req('PUT', `/api/v1/admin/settings`, body),
};

// -- Admin Connects -----------------------------------------------------
export const adminConnectApi = {
  add:     (sellerId: number, body: { amount: number; note?: string }) =>
    req('POST', `/api/v1/admin/connects/${sellerId}`, body),
  history: (sellerId: number, params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/admin/connects/${sellerId}/history${q ? `?${q}` : ''}`);
  },
};

// -- Admin Reports --------------------------------------------------------
export interface ReportType { key: string; label: string; description: string }
export interface ReportChartPoint { date: string; value: number; type?: string }
export interface ReportResult {
  summary: Record<string, unknown>;
  chart: ReportChartPoint[];
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  truncated: boolean;
}
export const adminReportApi = {
  types: (): Promise<{ data: ReportType[] }> => req('GET', `/api/v1/admin/reports/types`),

  get: (type: string, params: { from?: string; to?: string } = {}): Promise<{ data: ReportResult }> => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/admin/reports/${type}${q ? `?${q}` : ''}`);
  },

  /** Downloads the CSV client-side (auth header can't travel on a plain <a href>) */
  export: async (type: string, params: { from?: string; to?: string } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    const res = await fetch(`${API}/api/v1/admin/reports/${type}/export${q ? `?${q}` : ''}`, {
      headers: { Authorization: `Bearer ${Cookies.get('mc_token') || ''}` },
    });
    if (!res.ok) {
      if (res.status === 401) handleUnauthorized();
      throw new Error('Export failed');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

// -- Admin Broadcast ------------------------------------------------------
export interface AdminBroadcast {
  id: number;
  title: string;
  body: string;
  audience: 'ALL' | 'SELLER' | 'BUYER';
  recipient_count: number;
  created_at?: string;
  createdAt?: string;
  admin?: { id: number; name: string };
}
export const adminBroadcastApi = {
  send: (body: { title: string; body: string; audience: 'ALL' | 'SELLER' | 'BUYER' }) =>
    req('POST', `/api/v1/admin/broadcasts`, body),
  list: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return req('GET', `/api/v1/admin/broadcasts${q ? `?${q}` : ''}`);
  },
};

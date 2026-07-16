import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${Cookies.get('mc_token') || ''}`,
});

const req = async (method: string, path: string, body?: unknown) => {
  const res  = await fetch(`${API}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
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
  if (!res.ok) throw new Error(json.message || 'Request failed');
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
  block:   (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/block`),
  unblock: (id: number)          => req('PATCH', `/api/v1/admin/buyers/${id}/unblock`),
};

// -- Public categories (no auth) ---------------------------------------
export const publicCategoryApi = {
  list: (): Promise<{ data: { id: number; name: string; icon: string }[] }> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`)
      .then(r => r.json()),
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
  create: (body: {
    title: string; description?: string; category?: string;
    job_type?: string; budget_min?: number; budget_max?: number;
    deadline?: string; skills?: string[]; experience_level?: string;
  }) => req('POST', `/api/v1/buyer/jobs`, body),
  update: (id: number, body: {
    title?: string; description?: string; category?: string;
    job_type?: string; budget_min?: number; budget_max?: number;
    deadline?: string; skills?: string[]; experience_level?: string;
  }) => req('PUT', `/api/v1/buyer/jobs/${id}`, body),
  close:     (id: number)                  => req('PATCH',  `/api/v1/buyer/jobs/${id}/close`),
  delete:    (id: number)                  => req('DELETE', `/api/v1/buyer/jobs/${id}`),
  getBids:   (id: number)                   => req('GET',   `/api/v1/buyer/jobs/${id}/bids`),
  acceptBid: (jobId: number, bidId: number) => req('PATCH', `/api/v1/buyer/jobs/${jobId}/bids/${bidId}/accept`),
  rejectBid: (jobId: number, bidId: number) => req('PATCH', `/api/v1/buyer/jobs/${jobId}/bids/${bidId}/reject`),
};

// -- Buyer Bookings ----------------------------------------------------
export const buyerBookingApi = {
  list:   (params: { tab?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/buyer/bookings${q ? `?${q}` : ''}`);
  },
  get:    (id: number) => req('GET', `/api/v1/buyer/bookings/${id}`),
  create: (body: { seller_id: number; service_id?: number; job_id?: number; title: string; amount: number; delivery_days?: number; notes?: string }) =>
    req('POST', `/api/v1/buyer/bookings`, body),
  accept: (id: number) => req('PATCH', `/api/v1/buyer/bookings/${id}/accept`),
  reject: (id: number, dispute_reason?: string) => req('PATCH', `/api/v1/buyer/bookings/${id}/reject`, { dispute_reason }),
  cancel: (id: number, cancel_reason?: string)  => req('PATCH', `/api/v1/buyer/bookings/${id}/cancel`, { cancel_reason }),
};

// -- Seller Bookings ---------------------------------------------------
export const sellerBookingApi = {
  list:   (params: { tab?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/seller/bookings${q ? `?${q}` : ''}`);
  },
  get:     (id: number) => req('GET',   `/api/v1/seller/bookings/${id}`),
  accept:  (id: number) => req('PATCH', `/api/v1/seller/bookings/${id}/accept`),
  submit:  (id: number) => req('PATCH', `/api/v1/seller/bookings/${id}/submit`),
  cancel:  (id: number, cancel_reason?: string) => req('PATCH', `/api/v1/seller/bookings/${id}/cancel`, { cancel_reason }),
};

// -- Admin Bookings ----------------------------------------------------
export const adminBookingApi = {
  list:    (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/admin/bookings${q ? `?${q}` : ''}`);
  },
  get:     (id: number) => req('GET',    `/api/v1/admin/bookings/${id}`),
  resolve: (id: number, resolution: 'completed' | 'cancelled') => req('PATCH', `/api/v1/admin/bookings/${id}/resolve`, { resolution }),
  delete:  (id: number) => req('DELETE', `/api/v1/admin/bookings/${id}`),
};

// -- Buyer Search (services) -------------------------------------------
export const buyerSearchApi = {
  search: (params: {
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
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)])).toString();
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
  bid:         (id: number, body: { amount: number; delivery_days: number; proposal?: string }) =>
    req('POST',   `/api/v1/seller/jobs/${id}/bid`, body),
  updateBid:   (id: number, body: { amount: number; delivery_days: number; proposal?: string }) =>
    req('PATCH',  `/api/v1/seller/jobs/${id}/bid`, body),
  withdrawBid: (id: number) =>
    req('DELETE', `/api/v1/seller/jobs/${id}/bid`),
};

// -- Stats (dashboard) -------------------------------------------------
export const adminStatsApi  = { get: () => req('GET', `/api/v1/admin/stats`)  };
export const sellerStatsApi = { get: () => req('GET', `/api/v1/seller/stats`) };
export const buyerStatsApi  = { get: () => req('GET', `/api/v1/buyer/stats`)  };

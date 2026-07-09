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

// ── Sellers ──────────────────────────────────────────────────────────
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

// ── Buyers ───────────────────────────────────────────────────────────
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

// ── Public categories (no auth) ───────────────────────────────────────
export const publicCategoryApi = {
  list: (): Promise<{ data: { id: number; name: string; icon: string }[] }> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`)
      .then(r => r.json()),
};

// ── Seller Services ───────────────────────────────────────────────────
export const sellerServiceApi = {
  list: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return req('GET', `/api/v1/seller/services?${q}`);
  },
  get:     (id: number)                  => req('GET',    `/api/v1/seller/services/${id}`),
  /** Create service — send FormData (fields + image files) */
  create:  (formData: FormData)          => sendForm('POST',   `/api/v1/seller/services`, formData),
  /** Update service — send FormData (fields + new files + existing_images JSON) */
  update:  (id: number, formData: FormData) => sendForm('PUT', `/api/v1/seller/services/${id}`, formData),
  delete:  (id: number)                  => req('DELETE', `/api/v1/seller/services/${id}`),
  publish: (id: number)                  => req('PATCH',  `/api/v1/seller/services/${id}/publish`),
  pause:   (id: number)                  => req('PATCH',  `/api/v1/seller/services/${id}/pause`),
};

// ── Admin Services ────────────────────────────────────────────────────
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

// ── Categories (admin) ────────────────────────────────────────────────
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

// ── Profile API (works for admin, seller, buyer) ──────────────────────
export const profileApi = {
  /** GET /api/v1/{role}/profile */
  get: (role: 'admin' | 'seller' | 'buyer') =>
    req('GET', `/api/v1/${role}/profile`),

  /** PUT /api/v1/{role}/profile */
  update: (role: 'admin' | 'seller' | 'buyer', body: {
    user_id?: number | null; name?: string; phone?: string; bio?: string; location?: string; avatar?: string;
  }) => req('PUT', `/api/v1/${role}/profile`, body),

  /** PUT /api/v1/{role}/change-password */
  changePassword: (role: 'admin' | 'seller' | 'buyer', body: {
    user_id?: number | null; current_password: string; new_password: string;
  }) => req('PUT', `/api/v1/${role}/change-password`, body),
};

// ── Buyer Jobs ────────────────────────────────────────────────────────
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
  close:  (id: number)                  => req('PATCH',  `/api/v1/buyer/jobs/${id}/close`),
  delete: (id: number)                  => req('DELETE', `/api/v1/buyer/jobs/${id}`),
};

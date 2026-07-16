import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/types';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const BASE = {
  profileStatus: 'APPROVED' as const,
  isEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  isSuspended: false,
  walletAmount: 0,
  holdAmount: 0,
  totalEarningAmount: 0,
  totalConnects: 10,
  totalCompletedJobs: 0,
  avgRating: 0,
  totalRating: 0,
  step: 1,
  created: '2024-01-01T00:00:00.000Z',
};

const MOCK_USERS: Record<string, User & { password: string }> = {
  admin: { ...BASE, id: 1, fullName: 'Admin User',    email: 'admin@matchcreatorz.com',  phone: '1234567890', type: 'ADMIN',  password: 'admin123'  },
  seller: { ...BASE, id: 2, fullName: 'Alex Johnson',  email: 'seller@matchcreatorz.com', phone: '9876543210', type: 'SELLER', password: 'seller123', totalConnects: 25, totalEarningAmount: 12500, totalCompletedJobs: 8, avgRating: 4.7, totalRating: 38 },
  buyer:  { ...BASE, id: 3, fullName: 'Sarah Williams', email: 'buyer@matchcreatorz.com',  phone: '5551234567', type: 'BUYER',  password: 'buyer123',  walletAmount: 2500 },
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    payload: { email?: string; phone?: string; password: string; countryCode?: string; role?: 'ADMIN' | 'SELLER' | 'BUYER' },
    thunkAPI
  ) => {
    // -- Real API call (email or phone login) -----------------
    if ((payload.email || payload.phone) && payload.password) {
      try {
        const body: Record<string, string> = { password: payload.password };
        if (payload.email) body.email = payload.email;
        if (payload.phone) body.phone = (payload.countryCode || '+91') + payload.phone;

        const res = await fetch(`${API}/api/v1/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          // Show first validation error field message if available
          if (json.errors?.length) {
            return thunkAPI.rejectWithValue(json.errors[0].message);
          }
          return thunkAPI.rejectWithValue(json.message || 'Login failed');
        }

        // Map backend fields -> frontend User shape
        const apiUser = json.data.user;
        const role    = (json.data.role || apiUser.role) as User['type'];
        const user: User = {
          ...BASE,
          id:       apiUser.id,
          fullName: apiUser.name,
          email:    apiUser.email,
          phone:    apiUser.phone || '',
          type:     role,
        };
        return { user, token: json.data.token };
      } catch {
        return thunkAPI.rejectWithValue('Server unreachable. Make sure backend is running.');
      }
    }

    // -- Mock demo login (role-based) --------------------------
    await new Promise((r) => setTimeout(r, 800));
    if (payload.role) {
      const key = payload.role.toLowerCase() as keyof typeof MOCK_USERS;
      return { user: { ...MOCK_USERS[key] }, token: 'mock-token-' + key };
    }

    return thunkAPI.rejectWithValue('Please enter credentials');
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const token = Cookies.get('mc_token');
    if (token) {
      await fetch(`${API}/api/v1/auth/logout`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch { /* ignore network errors on logout */ }
  // Always clear local state regardless of API response
  Cookies.remove('mc_token');
  Cookies.remove('mc_user_type');
  return true;
});

export const getProfile = createAsyncThunk('auth/profile', async (_, thunkAPI) => {
  try {
    const token = Cookies.get('mc_token');
    if (!token) return thunkAPI.rejectWithValue('No token');
    const type = (Cookies.get('mc_user_type') || 'BUYER').toLowerCase();

    const res = await fetch(`${API}/api/v1/${type}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue('Failed to fetch profile');

    const apiUser = json.data;
    const user: User = {
      ...BASE,
      id:       apiUser.id,
      fullName: apiUser.name,
      email:    apiUser.email,
      phone:    apiUser.phone || '',
      type:     (Cookies.get('mc_user_type') || 'BUYER') as User['type'],
    };
    return user;
  } catch (_e) {
    return thunkAPI.rejectWithValue('Failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      Cookies.set('mc_token', action.payload.token, { expires: 7 });
      Cookies.set('mc_user_type', action.payload.user.type, { expires: 7 });
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      Cookies.remove('mc_token');
      Cookies.remove('mc_user_type');
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = action.payload as any;
        state.user = p.user as User;
        state.token = p.token as string;
        state.isAuthenticated = true;
        Cookies.set('mc_token', p.token as string, { expires: 7 });
        Cookies.set('mc_user_type', (p.user as User).type, { expires: 7 });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isAuthenticated = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
        state.error           = null;
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

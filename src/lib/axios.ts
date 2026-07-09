import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.matchcreatorz.com',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const userType = Cookies.get('mc_user_type');
  if (userType) config.headers['user-type'] = userType;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('mc_token');
      Cookies.remove('mc_user_type');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

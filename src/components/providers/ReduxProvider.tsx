'use client';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { getProfile } from '@/store/slices/authSlice';
import Cookies from 'js-cookie';

function AuthInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = Cookies.get('mc_token');
    if (token) {
      store.dispatch(getProfile());
    }
  }, []);
  return <>{children}</>;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInit>{children}</AuthInit>
    </Provider>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function SellerRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token    = Cookies.get('mc_token');
    const userType = Cookies.get('mc_user_type');
    if (!token) {
      router.replace('/login');
    } else if (userType !== 'SELLER') {
      if (userType === 'ADMIN')  router.replace('/admin/dashboard');
      else                       router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
}

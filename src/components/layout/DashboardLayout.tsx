'use client';
import { useAppSelector } from '@/store/hooks';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
}

export default function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#efefef' }}>
      <Sidebar role={role} />
      <Header title={title} role={role} />
      <main
        className={cn(
          'pt-16 min-h-screen sidebar-transition pl-0',
          sidebarCollapsed ? 'lg:pl-[92px]' : 'lg:pl-[254px]'
        )}
      >
        <div className="p-4 sm:p-5 page-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebarCollapse } from '@/store/slices/uiSlice';
import { logoutUser } from '@/store/slices/authSlice';
import { adminNav, sellerNav, buyerNav } from '@/constants/navigation';
import Logo from '@/components/ui/Logo';

interface SidebarProps { role: 'ADMIN' | 'SELLER' | 'BUYER'; }

const navByRole = { ADMIN: adminNav, SELLER: sellerNav, BUYER: buyerNav };

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-[#e84545] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-bold">{initials || '?'}</span>
    </div>
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };
  const nav = navByRole[role];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col z-40 sidebar-transition',
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      )}
      style={{ background: '#1e2235' }}
    >
      {/* -- Logo --------------------------------------------- */}
      <div
        className="relative flex items-center justify-center py-5 px-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {sidebarCollapsed
          ? <Logo iconOnly className="h-11 w-11" />
          : <>
              <Logo className="h-14 w-auto" />
              {/* Collapse arrow only when expanded */}
              <button
                onClick={() => dispatch(toggleSidebarCollapse())}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse"
              >
                <i className="fa fa-angle-left text-sm" />
              </button>
            </>
        }
      </div>

      {/* Expand button -- only when collapsed, below logo */ }
      {sidebarCollapsed && (
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="mx-auto mt-2 h-6 w-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Expand"
        >
          <i className="fa fa-angle-right text-sm" />
        </button>
      )}

      {/* -- Nav ---------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#e84545] text-white rounded-full'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 rounded-xl',
                sidebarCollapsed && 'justify-center px-0 rounded-xl'
              )}
            >
              <i className={`fa ${item.icon} text-base w-4 text-center flex-shrink-0`} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {!sidebarCollapsed && item.badge && (
                <span className="ml-auto bg-white/20 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* -- Bottom ------------------------------------------- */}
      <div
        className="px-3 pb-4 pt-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* User row */}
        {user && (
          <div className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-xl mb-1',
            sidebarCollapsed && 'justify-center px-0'
          )}>
            <InitialsAvatar name={user.fullName || user.email || 'U'} />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <i className="fa fa-sign-out text-base w-4 text-center" />
          {!sidebarCollapsed && 'Logout'}
        </button>

      </div>
    </aside>
  );
}

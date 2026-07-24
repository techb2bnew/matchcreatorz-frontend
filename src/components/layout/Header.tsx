'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileSidebar } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
}

const notifPath: Record<string, string> = {
  ADMIN: '/admin/notifications',
  SELLER: '/seller/notifications',
  BUYER: '/buyer/notifications',
};

const profilePath: Record<string, string> = {
  ADMIN: '/admin/profile',
  SELLER: '/seller/account',
  BUYER: '/buyer/account',
};

const settingsPath: Record<string, string> = {
  ADMIN: '/admin/settings',
  SELLER: '/seller/account',
  BUYER: '/buyer/account',
};

export default function Header({ title, role }: HeaderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { notificationCount, sidebarCollapsed } = useAppSelector((s) => s.ui);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-[#d8d8d8] z-30 flex items-center px-5 gap-4 sidebar-transition left-0',
        sidebarCollapsed ? 'lg:left-[92px]' : 'lg:left-[254px]'
      )}
    >
      {/* Mobile menu toggle — opens the slide-in sidebar drawer */}
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
      >
        <i className="fa fa-bars text-lg" />
      </button>

      {/* Title */}
      {title && <h1 className="text-base font-semibold text-gray-900 hidden sm:block">{title}</h1>}

      <div className="flex-1" />

      {/* Notifications */}
      <Link
        href={notifPath[role]}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <i className="fa fa-bell text-lg text-[#888888]" />
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#e84545] text-white text-[10px] flex items-center justify-center font-bold">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>

      {/* Messages shortcut */}
      <Link
        href={role === 'ADMIN' ? '/admin/support' : `/${role.toLowerCase()}/chat`}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors hidden sm:flex"
      >
        <i className="fa fa-comments text-lg text-[#888888]" />
      </Link>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <Avatar src={user?.avatar} name={user?.fullName || 'User'} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-none">{user?.fullName || 'User'}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{role.toLowerCase()}</p>
          </div>
          <i className={`fa fa-chevron-down text-xs text-gray-400 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-[#e0e0e0] py-2 z-50 overflow-hidden">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[#f0f0f0]">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href={profilePath[role]}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#fef2f2] hover:text-[#e84545] transition-colors"
              >
                <i className="fa fa-user-circle text-base w-4 text-center text-[#e84545]" />
                My Profile
              </Link>

            </div>

            {/* Logout */}
            <div className="border-t border-[#f0f0f0] py-1 mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-[#e84545] transition-colors"
              >
                <i className="fa fa-sign-out text-base w-4 text-center text-[#e84545]" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

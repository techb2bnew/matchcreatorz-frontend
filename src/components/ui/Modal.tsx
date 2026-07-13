'use client';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  noPadding?: boolean;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', className, noPadding = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal box */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-xl z-10 animate-[fadeIn_0.2s_ease-out]',
          'flex flex-col overflow-hidden',
          sizes[size],
          className
        )}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header -- never scrolls */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <i className="fa fa-times text-base" />
            </button>
          </div>
        )}

        {/* Content -- scrolls when tall */}
        <div className={cn('overflow-y-auto flex-1 min-h-0', noPadding ? '' : 'p-6')}>
          {children}
        </div>
      </div>
    </div>
  );
}

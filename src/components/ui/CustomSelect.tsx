'use client';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  placeholder?: string;
  leftIcon?: string; // FA icon class e.g. 'fa-globe'
  className?: string;
}

export default function CustomSelect({
  value, onChange, options, label, placeholder, leftIcon, className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={open ? () => setOpen(false) : openDropdown}
        className={cn(
          'w-full h-11 bg-white border rounded-xl px-3 text-sm text-left flex items-center gap-2 transition-all',
          'focus:outline-none',
          open
            ? 'border-[#e84545] ring-2 ring-[#e84545]/20'
            : 'border-gray-200 hover:border-gray-300',
        )}
      >
        {leftIcon && <i className={`fa ${leftIcon} text-gray-400 text-xs flex-shrink-0`} />}
        <span className="flex-1 truncate text-[#1a1a1a]">
          {value || <span className="text-gray-400">{placeholder}</span>}
        </span>
        <i className={`fa fa-chevron-down text-gray-400 text-[10px] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.13)] overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={cn(
                    'w-full px-3.5 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors',
                    selected
                      ? 'bg-[#e84545] text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <span className="w-3.5 flex-shrink-0 text-[10px] text-center">
                    {selected && <i className="fa fa-check" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

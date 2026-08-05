import { cn } from '@/lib/utils';

interface SortableThProps {
  label: string;
  sortKey: string;
  activeKey: string;
  direction: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableTh({ label, sortKey, activeKey, direction, onSort, className = '' }: SortableThProps) {
  const active = activeKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors whitespace-nowrap', className)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <i className={`fa ${active ? (direction === 'asc' ? 'fa-sort-asc' : 'fa-sort-desc') : 'fa-sort'} text-[10px] ${active ? 'text-[#e84545]' : 'text-gray-300'}`} />
      </span>
    </th>
  );
}

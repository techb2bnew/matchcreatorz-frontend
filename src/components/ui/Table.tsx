import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T extends { id: number | string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function Table<T extends { id: number | string }>({
  columns,
  data,
  loading,
  emptyText = 'No data found',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider', col.className)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

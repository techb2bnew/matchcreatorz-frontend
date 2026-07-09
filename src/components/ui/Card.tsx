import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export default function Card({ children, className, padding = 'md', hover }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#e8e8e8] shadow-sm',
        paddings[padding],
        hover && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-gray-900', className)}>{children}</h3>;
}

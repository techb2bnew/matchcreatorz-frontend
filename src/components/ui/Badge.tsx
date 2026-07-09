import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-[#fff0f0] text-[#e84545]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'border border-gray-300 text-gray-700',
};

const dotColors: Record<Variant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-[#e84545]',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-gray-500',
};

export default function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

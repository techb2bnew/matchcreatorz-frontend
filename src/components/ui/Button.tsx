'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from '@/components/ui/Loader';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#e84545] hover:bg-[#c73333] text-white shadow-sm',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm',
  outline: 'border border-[#e84545] text-[#e84545] hover:bg-[#fff0f0]',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e84545] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" color={variant === 'outline' || variant === 'ghost' ? 'red' : 'white'} />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

'use client';
import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-[#e84545] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none">{leftIcon}</div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full h-11 bg-white border text-sm text-gray-900 rounded-xl px-4 transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-[#e84545]/30 focus:border-[#e84545]',
              'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400',
              error ? 'border-red-500 focus:ring-red-300' : 'border-gray-200',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <i className="fa fa-eye-slash text-sm" /> : <i className="fa fa-eye text-sm" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 text-gray-400">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;

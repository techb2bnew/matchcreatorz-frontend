import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

const sizes = { xs: 'h-6 w-6 text-xs', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' };
const dotSizes = { xs: 'h-1.5 w-1.5', sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3', xl: 'h-3.5 w-3.5' };

export default function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-[#e84545] to-[#ff6666] text-white font-semibold flex items-center justify-center select-none',
            sizes[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            dotSizes[size],
            online ? 'bg-green-400' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
}

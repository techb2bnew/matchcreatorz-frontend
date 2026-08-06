import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'red' | 'blue' | 'green' | 'purple' | 'orange';
  className?: string;
}

const colorMap = {
  red: { bg: 'bg-[#fff0f0]', icon: 'text-[#e84545]', badge: 'bg-[#e84545]' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', badge: 'bg-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-600' },
};

export default function StatCard({ title, value, icon, change, changeType = 'up', color = 'red', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-4 sm:p-5 flex items-start gap-3 sm:gap-4', className)}>
      <div className={cn('p-2.5 sm:p-3 rounded-xl flex-shrink-0', c.bg)}>
        <i className={cn('fa text-base sm:text-lg', icon, c.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium leading-snug break-words">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 break-words">{value}</p>
        {change && (
          <p className={cn('text-xs mt-1 font-medium break-words',
            changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-500' : 'text-gray-400'
          )}>
            {changeType === 'up' ? '^' : changeType === 'down' ? 'v' : '--'} {change}
          </p>
        )}
      </div>
    </div>
  );
}

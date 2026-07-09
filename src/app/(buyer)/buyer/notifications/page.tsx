'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const initialNotifications = [
  { id: 1, type: 'Bookings', title: 'Booking Confirmed',      message: 'Your booking for Logo Design with Bob Smith is confirmed.', time: '5m ago',  read: false },
  { id: 2, type: 'Bookings', title: 'Order Delivered',        message: 'Bob Smith has delivered your Logo Design order. Please review.', time: '2h ago',  read: false },
  { id: 3, type: 'Payments', title: 'Payment Successful',     message: 'Your payment of $75 for Logo Design was successful.', time: '3h ago',  read: true  },
  { id: 4, type: 'System',   title: 'New Offer Received',     message: 'Frank Miller sent you an offer for your WordPress job post.', time: '6h ago',  read: false },
  { id: 5, type: 'Bookings', title: 'Booking Cancelled',      message: 'Your booking #B-2031 has been cancelled and refunded.', time: '1d ago',  read: true  },
  { id: 6, type: 'Payments', title: 'Refund Processed',       message: 'Refund of $120 has been credited to your wallet.', time: '2d ago',  read: true  },
  { id: 7, type: 'System',   title: 'Job Post Closed',        message: 'Your job post "Logo Design for My Bakery" has been auto-closed.', time: '3d ago',  read: true  },
  { id: 8, type: 'Bookings', title: 'New Proposal',           message: 'You have 3 new proposals on your WordPress job post.', time: '5d ago',  read: true  },
];

const typeIcon = (type: string): string => {
  if (type === 'Payments') return 'fa-credit-card';
  if (type === 'Bookings') return 'fa-calendar';
  return 'fa-bell';
};

const typeColor = (type: string) => {
  if (type === 'Payments') return 'bg-green-50 text-green-600';
  if (type === 'Bookings') return 'bg-blue-50 text-blue-600';
  return 'bg-[#fff0f0] text-[#e84545]';
};

const filters = ['All', 'Bookings', 'Payments', 'System'];

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = notifications.filter((n) =>
    activeFilter === 'All' || n.type === activeFilter
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DashboardLayout role="BUYER" title="Notifications">
      {/* Top row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" leftIcon={<i className="fa fa-bell-slash text-sm" />} onClick={markAllRead}>
          Mark all as read
        </Button>
      </div>

      {/* Notifications list */}
      <Card padding="none">
        <div className="divide-y divide-gray-50">
          {filtered.map((n) => {
            const iconClass = typeIcon(n.type);
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  !n.read ? 'bg-[#fff8f8] border-l-4 border-[#e84545]' : 'hover:bg-gray-50'
                )}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${typeColor(n.type)}`}>
                  <i className={`fa ${iconClass} text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{n.time}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </DashboardLayout>
  );
}

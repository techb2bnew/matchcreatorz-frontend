'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const tickets = [
  { id: 1, name: 'Alice Johnson', lastMsg: 'I cannot complete my booking.', time: '5m ago',  unread: 3, status: 'OPEN'   },
  { id: 2, name: 'Bob Martinez',  lastMsg: 'Payment is stuck.',              time: '2h ago',  unread: 0, status: 'OPEN'   },
  { id: 3, name: 'Carol White',   lastMsg: 'Account suspended wrongly.',     time: '1d ago',  unread: 1, status: 'CLOSED' },
  { id: 4, name: 'Dave Wilson',   lastMsg: 'Thank you for your help!',       time: '3d ago',  unread: 0, status: 'CLOSED' },
];

const allMsgs: Record<number, { id: number; senderId: number; text: string; time: string }[]> = {
  1: [
    { id: 1, senderId: 2, text: 'Hi, I cannot complete my booking. The payment page keeps failing.', time: '10:00 AM' },
    { id: 2, senderId: 1, text: 'Hello Alice, could you share which payment method you are using?', time: '10:05 AM' },
    { id: 3, senderId: 2, text: 'I am using a Visa card. The error says "payment declined".', time: '10:07 AM' },
    { id: 4, senderId: 1, text: 'I have escalated this to our payments team. You will hear back within 24 hours.', time: '10:10 AM' },
  ],
  2: [
    { id: 1, senderId: 2, text: 'Hello, my payment has been deducted but booking is not confirmed.', time: '8:00 AM' },
    { id: 2, senderId: 1, text: 'Hi Bob, I can see the transaction. Let me check the booking system.', time: '8:30 AM' },
    { id: 3, senderId: 2, text: 'Payment is stuck. Please resolve asap.', time: '9:00 AM' },
  ],
  3: [
    { id: 1, senderId: 2, text: 'My account was suspended but I did not violate any terms.', time: '2d ago' },
    { id: 2, senderId: 1, text: 'Hi Carol, we are reviewing your account. Please give us 24h.', time: '2d ago' },
    { id: 3, senderId: 2, text: 'Account suspended wrongly. This is affecting my business.', time: '1d ago' },
    { id: 4, senderId: 1, text: 'Update: we reviewed your case and the suspension has been lifted.', time: '1d ago' },
  ],
  4: [
    { id: 1, senderId: 2, text: 'I had trouble logging in earlier. Any outage?', time: '4d ago' },
    { id: 2, senderId: 1, text: 'Hi Dave, there was a brief maintenance window. It should be resolved now.', time: '4d ago' },
    { id: 3, senderId: 2, text: 'Thank you for your help!', time: '3d ago' },
  ],
};

const MY_ID = 1;

export default function AdminSupportPage() {
  const [activeTicket, setActiveTicket] = useState(tickets[0]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'All' | 'OPEN' | 'CLOSED'>('All');

  const filtered = tickets.filter((t) => filter === 'All' || t.status === filter);
  const msgs = allMsgs[activeTicket.id] || [];

  const send = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <DashboardLayout role="ADMIN" title="Support">
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden flex h-[calc(100vh-120px)]">

        {/* Sidebar */}
        <div className="w-[300px] border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Conversations</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tickets.filter((t) => t.status === 'OPEN').length} open tickets</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                <i className="fa fa-headphones text-[#e84545] text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all">
              <i className="fa fa-search text-xs text-gray-400" />
              <input type="text" placeholder="Search tickets..." className="flex-1 bg-transparent text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none" />
            </div>
            <div className="flex gap-1.5 mt-2.5">
              {(['All', 'OPEN', 'CLOSED'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors', filter === f ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100')}>
                  {f === 'OPEN' ? 'Open' : f === 'CLOSED' ? 'Closed' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((t) => {
              const isActive = activeTicket.id === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTicket(t)}
                  className={cn('w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors relative', isActive ? 'bg-[#fff8f8]' : 'hover:bg-gray-50')}>
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#e84545] rounded-r-full" />}
                  <Avatar name={t.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-sm truncate', isActive ? 'font-bold text-[#e84545]' : 'font-semibold text-gray-900')}>{t.name}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{t.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1.5">{t.lastMsg}</p>
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold', t.status === 'OPEN' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', t.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400')} />
                      {t.status}
                    </span>
                  </div>
                  {t.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-[#e84545] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{t.unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: '#f7f8fa' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar name={activeTicket.name} size="md" />
                {activeTicket.status === 'OPEN' && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeTicket.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <i className="fa fa-ticket text-[9px]" />
                  Ticket #{activeTicket.id.toString().padStart(4, '0')}
                  <span className="mx-1 text-gray-200">|</span>
                  <span className={activeTicket.status === 'OPEN' ? 'text-green-500 font-medium' : 'text-gray-400'}>{activeTicket.status}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTicket.status === 'OPEN' && (
                <button className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  <i className="fa fa-check-circle text-green-500 text-xs" /> Close Ticket
                </button>
              )}
              <button className="h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center">
                <i className="fa fa-ellipsis-v text-sm" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {msgs.map((m) => {
              const isMine = m.senderId === MY_ID;
              return (
                <div key={m.id} className={cn('flex items-end gap-2.5', isMine ? 'justify-end' : 'justify-start')}>
                  {!isMine && <Avatar name={activeTicket.name} size="xs" className="flex-shrink-0 mb-0.5" />}
                  <div className={cn('max-w-[58%] px-4 py-3 text-sm shadow-sm', isMine ? 'bg-[#e84545] text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100')}>
                    <p className="leading-relaxed">{m.text}</p>
                    <p className={cn('text-[10px] mt-1.5 flex items-center gap-1', isMine ? 'text-red-200 justify-end' : 'text-gray-400')}>
                      {m.time}
                      {isMine && <i className="fa fa-check text-[8px] text-red-300" />}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3.5 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all">
              <button className="text-gray-400 hover:text-[#e84545] transition-colors flex-shrink-0">
                <i className="fa fa-paperclip text-base" />
              </button>
              <input type="text" placeholder="Type a reply..." value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none" />
              <button onClick={send}
                className={cn('h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all', message.trim() ? 'bg-[#e84545] text-white hover:bg-[#c73333] shadow-sm' : 'bg-gray-100 text-gray-300 cursor-not-allowed')}>
                <i className="fa fa-paper-plane text-xs" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1 flex items-center gap-1">
              <i className="fa fa-keyboard-o text-[9px]" /> Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

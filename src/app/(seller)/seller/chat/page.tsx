'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const rooms = [
  { id: 1, name: 'Alice Johnson', lastMsg: 'Can you send the final files?',      time: '2m ago',  unread: 2, online: true  },
  { id: 2, name: 'Carlos Ruiz',   lastMsg: 'Great work! When can we start?',     time: '1h ago',  unread: 0, online: false },
  { id: 3, name: 'Eva Green',     lastMsg: 'I have reviewed the design.',        time: '3h ago',  unread: 1, online: true  },
  { id: 4, name: 'Grace Hopper',  lastMsg: 'Payment sent.',                      time: '1d ago',  unread: 0, online: false },
];

const allMsgs: Record<number, { id: number; senderId: number; text: string; time: string }[]> = {
  1: [
    { id: 1, senderId: 2, text: 'Hi! I saw your portfolio, amazing work!', time: '10:00 AM' },
    { id: 2, senderId: 1, text: 'Thank you! What kind of project do you have in mind?', time: '10:02 AM' },
    { id: 3, senderId: 2, text: 'I need a complete brand identity for my startup. Logo, colors, typography.', time: '10:04 AM' },
    { id: 4, senderId: 1, text: 'That sounds great! I can definitely help. My starting package for brand identity is $500.', time: '10:05 AM' },
    { id: 5, senderId: 2, text: 'Can you send the final files?', time: '10:07 AM' },
  ],
  2: [
    { id: 1, senderId: 2, text: 'Hey, great work on the last project!', time: '9:00 AM' },
    { id: 2, senderId: 1, text: 'Thank you Carlos! Really appreciate it.', time: '9:05 AM' },
    { id: 3, senderId: 2, text: 'When can we start the next one?', time: '9:10 AM' },
  ],
  3: [
    { id: 1, senderId: 2, text: 'I have reviewed the design you sent.', time: '7:00 AM' },
    { id: 2, senderId: 1, text: 'Great! Any feedback?', time: '7:05 AM' },
    { id: 3, senderId: 2, text: 'Looks clean. Just one small revision on the header.', time: '7:08 AM' },
  ],
  4: [
    { id: 1, senderId: 2, text: 'Payment has been sent for the last milestone.', time: 'Yesterday' },
    { id: 2, senderId: 1, text: 'Received! Thank you Grace.', time: 'Yesterday' },
  ],
};

const MY_ID = 1;

export default function SellerChatPage() {
  const [activeRoom, setActiveRoom] = useState(rooms[0]);
  const [message, setMessage] = useState('');

  const msgs = allMsgs[activeRoom.id] || [];

  const send = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <DashboardLayout role="SELLER" title="Chat">
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden flex h-[calc(100vh-120px)]">

        {/* Sidebar */}
        <div className="w-[300px] border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Messages</h3>
                <p className="text-xs text-gray-400 mt-0.5">{rooms.filter((r) => r.unread > 0).length} unread</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                <i className="fa fa-comments text-[#e84545] text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all">
              <i className="fa fa-search text-xs text-gray-400" />
              <input type="text" placeholder="Search conversations..." className="flex-1 bg-transparent text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {rooms.map((r) => {
              const isActive = activeRoom.id === r.id;
              return (
                <button key={r.id} onClick={() => setActiveRoom(r)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors relative', isActive ? 'bg-[#fff8f8]' : 'hover:bg-gray-50')}>
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#e84545] rounded-r-full" />}
                  <Avatar name={r.name} size="md" online={r.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-sm truncate', isActive ? 'font-bold text-[#e84545]' : 'font-semibold text-gray-900')}>{r.name}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{r.time}</span>
                    </div>
                    <p className={cn('text-xs truncate', r.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400')}>{r.lastMsg}</p>
                  </div>
                  {r.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-[#e84545] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{r.unread}</span>
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
              <Avatar name={activeRoom.name} size="md" online={activeRoom.online} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeRoom.name}</p>
                <p className={cn('text-xs flex items-center gap-1 mt-0.5', activeRoom.online ? 'text-green-500' : 'text-gray-400')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', activeRoom.online ? 'bg-green-500' : 'bg-gray-400')} />
                  {activeRoom.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <i className="fa fa-file-text-o text-xs text-[#e84545]" /> View Order
              </button>
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
                  {!isMine && <Avatar name={activeRoom.name} size="xs" className="flex-shrink-0 mb-0.5" />}
                  <div className={cn('max-w-[55%] px-4 py-3 text-sm shadow-sm', isMine ? 'bg-[#e84545] text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100')}>
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
              <input type="text" placeholder="Type a message..." value={message}
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

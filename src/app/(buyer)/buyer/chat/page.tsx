'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const rooms = [
  { id: 1, name: 'Bob Smith',    lastMsg: 'The logo files are ready!',         time: '3m ago',  unread: 1, online: true  },
  { id: 2, name: 'Diana Prince', lastMsg: 'Let me know if you have questions.', time: '2h ago',  unread: 0, online: true  },
  { id: 3, name: 'Frank Miller', lastMsg: 'I will start on Monday.',            time: '5h ago',  unread: 0, online: false },
  { id: 4, name: 'Grace Hopper', lastMsg: 'Great, the content is ready.',       time: '2d ago',  unread: 0, online: false },
];

const allMsgs: Record<number, { id: number; senderId: number; text: string; time: string }[]> = {
  1: [
    { id: 1, senderId: 2, text: 'Hi Alice! I have completed the initial logo concepts.', time: '9:00 AM' },
    { id: 2, senderId: 1, text: 'Wow, these look amazing! I love the second concept.', time: '9:15 AM' },
    { id: 3, senderId: 2, text: 'Great! I can refine it further. Any color preferences?', time: '9:17 AM' },
    { id: 4, senderId: 1, text: 'I am thinking more pastel tones -- maybe soft pink and gold.', time: '9:20 AM' },
    { id: 5, senderId: 2, text: 'The logo files are ready! Check your email for the full package.', time: '9:45 AM' },
  ],
  2: [
    { id: 1, senderId: 2, text: 'I have deployed the latest build. Let me know if you have questions.', time: '10:00 AM' },
    { id: 2, senderId: 1, text: 'Looks great! One thing -- can we tweak the mobile nav?', time: '10:30 AM' },
    { id: 3, senderId: 2, text: 'Of course! I will push an update by EOD.', time: '10:35 AM' },
  ],
  3: [
    { id: 1, senderId: 2, text: 'Hey, just confirming -- I will start on Monday.', time: '5h ago' },
    { id: 2, senderId: 1, text: 'Perfect! All assets have been shared.', time: '5h ago' },
  ],
  4: [
    { id: 1, senderId: 2, text: 'Great, the content is ready for review.', time: '2d ago' },
    { id: 2, senderId: 1, text: 'Amazing work, Grace! Approving now.', time: '2d ago' },
  ],
};

const MY_ID = 1;

export default function BuyerChatPage() {
  const [activeRoom, setActiveRoom] = useState(rooms[0]);
  const [message, setMessage] = useState('');

  const msgs = allMsgs[activeRoom.id] || [];

  const send = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <DashboardLayout role="BUYER" title="Chat">
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

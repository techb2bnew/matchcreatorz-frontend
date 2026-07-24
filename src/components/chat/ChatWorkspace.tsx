'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { chatApi } from '@/lib/adminApi';
import { connectSocket, getSocket } from '@/lib/chatSocket';
import { useAppSelector } from '@/store/hooks';

type Role = 'BUYER' | 'SELLER' | 'ADMIN';

interface OtherUser { id: number; name: string; role?: string; avatar?: string | null }
interface Conversation {
  id: number;
  other_user: OtherUser | null;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_id: number | null;
  unread_count: number;
  updated_at?: string | null;
  updatedAt?: string | null;
}
interface Attachment { url: string; name: string; type?: string }
interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  attachment?: Attachment | null;
  is_read: boolean;
  created_at?: string;
  createdAt?: string;
  sender?: { id: number; name: string; avatar?: string | null };
}

const EMOJIS = ['😀','😄','😁','😊','😍','😘','😜','🤔','😎','🥳','😅','😂','🙂','😉','😇','🤝','👍','👎','👌','🙏','💪','🔥','✨','🎉','❤️','💯','✅','❌','⭐','💰','📎','📌','⏰','🚀','👀','🙌'];

const msgDate = (m: Message) => new Date(m.created_at || m.createdAt || Date.now());
const timeOf = (m: Message) => {
  const d = msgDate(m);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const relTime = (iso: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
};
const dayLabel = (m: Message) => {
  const d = msgDate(m); const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
};

export default function ChatWorkspace({ role, title = 'Chat' }: { role: Role; title?: string }) {
  const me = useAppSelector((s) => s.auth.user);
  const myId = me?.id ? Number(me.id) : 0;
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('c');
  const deepLinkDone = useRef(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [online, setOnline] = useState<Record<number, boolean>>({});
  const [typingIn, setTypingIn] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [mobileThread, setMobileThread] = useState(false); // small-screen: show thread vs list
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAtt, setPendingAtt] = useState<Attachment | null>(null);

  const activeIdRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = conversations.find((c) => c.id === activeId) || null;
  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);

  useEffect(() => {
    if (deepLinkDone.current || loadingConvos || !deepLinkId) return;
    deepLinkDone.current = true;
    openConversation(Number(deepLinkId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConvos, deepLinkId]);

  const scrollToBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  // Ask the server which of these users are currently online (initial presence sync)
  const queryPresence = (ids: number[]) => {
    const s = getSocket();
    if (!s) return;
    ids.filter(Boolean).forEach((id) => {
      s.emit('isOnline', id, (r: { userId: number; online: boolean } | undefined) => {
        if (r) setOnline((prev) => ({ ...prev, [r.userId]: r.online }));
      });
    });
  };

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.conversations({ limit: 100 });
      const rows: Conversation[] = res.data || [];
      setConversations(rows);
      queryPresence(rows.map((c) => c.other_user?.id).filter((x): x is number => !!x));
    } catch { /* ignore */ }
    finally { setLoadingConvos(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConversation = useCallback(async (id: number) => {
    setActiveId(id);
    activeIdRef.current = id;
    setMobileThread(true);
    setLoadingMsgs(true);
    try {
      const res = await chatApi.messages(id, { limit: 50 });
      const rows: Message[] = (res.data || []).slice().reverse();
      setMessages(rows);
      scrollToBottom();
      getSocket()?.emit('joinConversation', id);
      await chatApi.markRead(id);
      getSocket()?.emit('messageRead', { conversationId: id });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    loadConversations();
    const socket = connectSocket();
    if (!socket) return;

    const onReceive = ({ conversationId, message }: { conversationId: number; message: Message }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        scrollToBottom();
        if (message.sender_id !== myId) {
          chatApi.markRead(conversationId).catch(() => {});
          getSocket()?.emit('messageRead', { conversationId });
        }
      }
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        const updated = prev.map((c) => c.id === conversationId
          ? {
              ...c,
              last_message: message.body || (message.attachment ? '📎 Attachment' : ''),
              last_message_at: message.created_at || message.createdAt || new Date().toISOString(),
              last_sender_id: message.sender_id,
              unread_count: (conversationId === activeIdRef.current || message.sender_id === myId)
                ? c.unread_count : c.unread_count + 1,
            }
          : c);
        updated.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
        if (!exists) loadConversations();
        return updated;
      });
    };
    const onMessageRead = ({ conversationId }: { conversationId: number }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) => (m.sender_id === myId ? { ...m, is_read: true } : m)));
      }
    };
    const onPresence = ({ userId, online: on }: { userId: number; online: boolean }) =>
      setOnline((prev) => ({ ...prev, [userId]: on }));
    const onTyping = ({ conversationId }: { conversationId: number }) => setTypingIn(conversationId);
    const onStopTyping = ({ conversationId }: { conversationId: number }) =>
      setTypingIn((t) => (t === conversationId ? null : t));

    // On (re)connect, refresh conversations + presence so status is never stale
    const onConnect = () => { loadConversations(); };

    socket.on('connect', onConnect);
    socket.on('receiveMessage', onReceive);
    socket.on('messageRead', onMessageRead);
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    return () => {
      socket.off('connect', onConnect);
      socket.off('receiveMessage', onReceive);
      socket.off('messageRead', onMessageRead);
      socket.off('presence', onPresence);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const sendMessage = () => {
    if (!active) return;
    const body = input.trim();
    const attachment = pendingAtt || undefined;
    if (!body && !attachment) return;
    const socket = getSocket();
    const recipientId = active.other_user?.id;
    setInput('');
    setPendingAtt(null);
    setEmojiOpen(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    if (socket && socket.connected) {
      socket.emit('sendMessage', { conversationId: active.id, body, attachment });
      socket.emit('stopTyping', { conversationId: active.id, recipientId });
    } else {
      chatApi.send(active.id, body, attachment).then((res) => {
        const m = res?.data;
        if (m) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        scrollToBottom();
      }).catch(() => {});
    }
  };

  const archiveActive = async () => {
    if (!active) return;
    const id = active.id;
    setMenuOpen(false);
    try { await chatApi.archive(id); } catch { /* ignore */ }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId(null);
    activeIdRef.current = null;
    setMobileThread(false);
  };

  // Pick a file → upload → STAGE as a preview (does NOT send yet)
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active) return;
    setUploading(true);
    try {
      const res = await chatApi.upload(file);
      const att = res?.data as Attachment | undefined;
      if (att?.url) { setPendingAtt(att); inputRef.current?.focus(); }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const onInputChange = (v: string) => {
    setInput(v);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'; }
    if (!active) return;
    const socket = getSocket();
    const recipientId = active.other_user?.id;
    socket?.emit('typing', { conversationId: active.id, recipientId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('stopTyping', { conversationId: active.id, recipientId }), 1500);
  };

  const filtered = conversations.filter((c) =>
    !search || (c.other_user?.name || '').toLowerCase().includes(search.toLowerCase()));
  const otherOnline = active?.other_user?.id ? online[active.other_user.id] : false;

  return (
    <DashboardLayout role={role} title={title}>
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">

        {/* ── Conversation list ─────────────────────────────────────────── */}
        <div className={cn(
          'w-full sm:w-[340px] border-r border-gray-200 flex flex-col flex-shrink-0 bg-white',
          mobileThread ? 'hidden sm:flex' : 'flex'
        )}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              {totalUnread > 0 && (
                <span className="h-6 min-w-[24px] px-2 rounded-full bg-[#e84545] text-white text-xs font-bold flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="relative">
              <i className="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-100 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e84545]/20 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loadingConvos ? (
              <div className="space-y-2 px-1 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="h-11 w-11 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded w-1/2" /><div className="h-2.5 bg-gray-100 rounded w-3/4" /></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-300 py-16">
                <i className="fa fa-comments text-4xl mb-3" />
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            ) : filtered.map((c) => {
              const on = c.other_user?.id ? online[c.other_user.id] : false;
              const activeRow = activeId === c.id;
              const mineLast = c.last_sender_id === myId;
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors mb-0.5',
                    activeRow ? 'bg-[#fff1f1]' : 'hover:bg-gray-50')}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={c.other_user?.name || 'User'} size="md" />
                    <span className={cn('absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                      on ? 'bg-green-500' : 'bg-gray-300')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm truncate', c.unread_count > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>
                        {c.other_user?.name || 'User'}
                      </p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">{relTime(c.last_message_at || c.updated_at || c.updatedAt || null)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn('text-xs truncate', c.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                        {mineLast && <span className="text-gray-400">You: </span>}
                        {c.last_message || 'No messages yet'}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-[#e84545] text-white text-[10px] flex items-center justify-center font-bold">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Thread ────────────────────────────────────────────────────── */}
        <div className={cn('flex-1 flex-col min-w-0', mobileThread ? 'flex' : 'hidden sm:flex')}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-[#fbfbfb]">
              <div className="h-20 w-20 rounded-full bg-[#fff1f1] flex items-center justify-center mb-4">
                <i className="fa fa-comments text-3xl text-[#e84545]" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">Choose a chat from the left to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white">
                <button onClick={() => setMobileThread(false)} className="sm:hidden text-gray-500 px-1">
                  <i className="fa fa-arrow-left" />
                </button>
                <div className="relative">
                  <Avatar name={active.other_user?.name || 'User'} size="sm" />
                  <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white',
                    otherOnline ? 'bg-green-500' : 'bg-gray-300')} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{active.other_user?.name || 'User'}</p>
                  <p className="text-xs">
                    {otherOnline ? <span className="text-green-500 font-medium">● Online</span> : <span className="text-gray-400">Offline</span>}
                    {active.other_user?.role && <span className="text-gray-400 capitalize"> · {active.other_user.role.toLowerCase()}</span>}
                  </p>
                </div>

                {/* Options menu */}
                <div className="relative">
                  <button onClick={() => setMenuOpen((o) => !o)}
                    className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition">
                    <i className="fa fa-ellipsis-v" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 z-20 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1">
                        <button onClick={archiveActive}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 text-left">
                          <i className="fa fa-archive text-gray-400" /> Archive chat
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1 bg-[#f7f7f8]">
                {loadingMsgs ? (
                  <p className="text-center text-gray-400 text-sm py-6"><i className="fa fa-spinner fa-spin mr-2" />Loading…</p>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <i className="fa fa-paper-plane text-2xl mb-2" />
                    <p className="text-sm">No messages yet — say hello 👋</p>
                  </div>
                ) : messages.map((m, i) => {
                  const mine = m.sender_id === myId;
                  const prev = messages[i - 1];
                  const next = messages[i + 1];
                  const showDay = !prev || dayLabel(prev) !== dayLabel(m);
                  const grouped = prev && prev.sender_id === m.sender_id && !showDay;
                  const lastOfGroup = !next || next.sender_id !== m.sender_id || dayLabel(next) !== dayLabel(m);
                  const avName = m.sender?.name || (mine ? (me?.fullName || 'You') : active.other_user?.name || 'User');
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">{dayLabel(m)}</span>
                        </div>
                      )}
                      <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-2')}>
                        {!mine && (lastOfGroup
                          ? <Avatar name={avName} size="sm" />
                          : <span className="w-8 flex-shrink-0" />)}
                        <div className={cn('max-w-[75%] px-3.5 py-2 text-sm shadow-sm',
                          mine
                            ? 'bg-[#e84545] text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md')}>
                          {m.attachment && (m.attachment.type || '').startsWith('image/') ? (
                            <a href={m.attachment.url} target="_blank" rel="noreferrer" className="block mb-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.attachment.url} alt={m.attachment.name} className="rounded-xl max-w-[220px] max-h-[220px] object-cover" />
                            </a>
                          ) : m.attachment ? (
                            <a href={m.attachment.url} target="_blank" rel="noreferrer"
                              className={cn('flex items-center gap-2 mb-1 rounded-xl px-3 py-2', mine ? 'bg-white/15' : 'bg-gray-50 border border-gray-100')}>
                              <i className="fa fa-file-o text-lg" />
                              <span className="text-xs underline max-w-[160px] truncate">{m.attachment.name}</span>
                            </a>
                          ) : null}
                          {m.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
                          <div className={cn('flex items-center gap-1 justify-end mt-0.5 text-[10px]', mine ? 'text-red-100' : 'text-gray-400')}>
                            <span>{timeOf(m)}</span>
                            {mine && (m.is_read
                              ? <i className="fa fa-check-double text-sky-300" title="Seen" />
                              : <i className="fa fa-check text-red-200" title="Sent" />)}
                          </div>
                        </div>
                        {mine && (lastOfGroup
                          ? <Avatar name={avName} size="sm" />
                          : <span className="w-8 flex-shrink-0" />)}
                      </div>
                      {/* Read/unread status under the last sent message */}
                      {mine && i === messages.length - 1 && (
                        <p className={cn('text-[10px] mt-0.5 pr-10 text-right font-medium', m.is_read ? 'text-sky-500' : 'text-gray-400')}>
                          {m.is_read ? '✓✓ Seen' : '✓ Sent'}
                        </p>
                      )}
                    </div>
                  );
                })}
                {typingIn === active.id && (
                  <div className="flex items-end gap-2 justify-start mt-2">
                    <Avatar name={active.other_user?.name || 'User'} size="sm" />
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <span className="flex gap-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="relative p-3 sm:p-4 border-t border-gray-200 bg-white">
                {/* Emoji popover */}
                {emojiOpen && (
                  <div className="absolute bottom-[80px] left-4 z-20 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-3">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map((e) => (
                        <button key={e} type="button"
                          onClick={() => { onInputChange(input + e); inputRef.current?.focus(); }}
                          className="text-xl hover:bg-gray-100 rounded-lg p-1 transition">{e}</button>
                      ))}
                    </div>
                  </div>
                )}

                <input ref={fileRef} type="file" hidden onChange={onPickFile}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

                {/* Staged attachment / uploading preview (send on click) */}
                {(pendingAtt || uploading) && (
                  <div className="mb-2 inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 pr-3 max-w-full">
                    {uploading ? (
                      <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <i className="fa fa-spinner fa-spin" />
                      </div>
                    ) : pendingAtt && (pendingAtt.type || '').startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pendingAtt.url} alt={pendingAtt.name} className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#e84545]">
                        <i className="fa fa-file-o text-xl" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                        {uploading ? 'Uploading…' : pendingAtt?.name}
                      </p>
                      <p className="text-[11px] text-gray-400">{uploading ? 'Please wait' : 'Ready to send'}</p>
                    </div>
                    {pendingAtt && !uploading && (
                      <button type="button" onClick={() => setPendingAtt(null)}
                        className="ml-1 h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-white flex items-center justify-center">
                        <i className="fa fa-times" />
                      </button>
                    )}
                  </div>
                )}

                {/* Single rounded pill: attach + emoji inside, textarea, send on the right */}
                <div className="flex items-end gap-2 border border-gray-300 rounded-full pl-3 pr-1.5 py-1.5 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/15 transition">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    title="Attach file"
                    className="h-8 w-8 flex-shrink-0 rounded-full text-gray-400 hover:text-[#e84545] hover:bg-gray-100 flex items-center justify-center transition disabled:opacity-50">
                    <i className={`fa ${uploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`} />
                  </button>
                  <button type="button" onClick={() => setEmojiOpen((o) => !o)}
                    title="Emoji"
                    className={cn('h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center transition',
                      emojiOpen ? 'text-[#e84545] bg-[#fff1f1]' : 'text-gray-400 hover:text-[#e84545] hover:bg-gray-100')}>
                    <i className="fa fa-smile-o text-base" />
                  </button>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    onFocus={() => setEmojiOpen(false)}
                    placeholder="Type a message…"
                    className="flex-1 resize-none max-h-[120px] bg-transparent px-1 py-1.5 text-sm focus:outline-none leading-relaxed"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={(!input.trim() && !pendingAtt) || uploading}
                    className="h-9 w-9 flex-shrink-0 rounded-full bg-[#e84545] text-white flex items-center justify-center hover:bg-[#c73333] active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
                  >
                    <i className="fa fa-paper-plane text-xs" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 ml-2">
                  <i className="fa fa-keyboard-o mr-1" />Press Enter to send, Shift+Enter for a new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

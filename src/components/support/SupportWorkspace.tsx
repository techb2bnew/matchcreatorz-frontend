'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { supportApi } from '@/lib/adminApi';
import { connectSocket, getSocket } from '@/lib/chatSocket';
import { useAppSelector } from '@/store/hooks';

type Role = 'BUYER' | 'SELLER' | 'ADMIN';
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Party { id: number; name: string; role?: string; avatar?: string | null }
interface Ticket {
  id: number;
  subject: string | null;
  status: Status;
  assigned_admin_id: number | null;
  assignee: Party | null;
  requester: Party | null;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_id: number | null;
  unread_count: number;
}
interface Attachment { url: string; name: string; type?: string }
interface Msg {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role?: string;
  body: string;
  attachment?: Attachment | null;
  is_read: boolean;
  created_at?: string;
  createdAt?: string;
  sender?: { id: number; name: string; avatar?: string | null };
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  OPEN:        { label: 'Open',        cls: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  RESOLVED:    { label: 'Resolved',    cls: 'bg-green-100 text-green-700' },
  CLOSED:      { label: 'Closed',      cls: 'bg-gray-200 text-gray-600' },
};

const EMOJIS = ['😀','😊','🙂','👍','🙏','🔥','✅','❌','⭐','❤️','🎉','💯','📎','⏰','🚀','👀'];

const msgDate = (m: Msg) => new Date(m.created_at || m.createdAt || Date.now());
const timeOf  = (m: Msg) => { const d = msgDate(m); return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
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
const initials = (name?: string) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function SupportWorkspace({ variant, role, title = 'Support' }: { variant: 'USER' | 'ADMIN'; role: Role; title?: string }) {
  const me = useAppSelector((s) => s.auth.user);
  const myId = me?.id ? Number(me.id) : 0;
  const isAdmin = variant === 'ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [scope, setScope] = useState<'open' | 'mine' | 'unassigned' | 'all'>(isAdmin ? 'open' : 'all');
  const [pendingAtt, setPendingAtt] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);
  activeRef.current = activeId;

  // Close the status dropdown when clicking outside of it
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const active = tickets.find((t) => t.id === activeId) || null;

  const scrollToBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  // ── Load ticket list ──────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: Record<string, string> = {};
      if (isAdmin) {
        if (scope === 'open') params.status = 'OPEN';
        else if (scope === 'mine') params.scope = 'mine';
        else if (scope === 'unassigned') params.scope = 'unassigned';
        else params.scope = 'all';
      }
      const res = await supportApi.tickets(params);
      setTickets(res.data || []);
    } catch { /* ignore */ } finally { setLoadingList(false); }
  }, [isAdmin, scope]);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Load messages for the active ticket ─────────────────────────────────────
  const openTicket = useCallback(async (id: number) => {
    setActiveId(id);
    setMobileThread(true);
    setLoadingMsgs(true);
    try {
      const res = await supportApi.messages(id, { limit: 50 });
      setMessages([...(res.data || [])].reverse());
      scrollToBottom();
      await supportApi.markRead(id).catch(() => {});
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, unread_count: 0 } : t)));
    } catch { /* ignore */ } finally { setLoadingMsgs(false); }
  }, []);

  // ── Socket: live messages + ticket updates ──────────────────────────────────
  useEffect(() => {
    const s = connectSocket() || getSocket();
    if (!s) return;

    const onMsg = (payload: { ticketId: number; message: Msg }) => {
      const { ticketId, message } = payload;
      if (ticketId === activeRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        scrollToBottom();
        supportApi.markRead(ticketId).catch(() => {});
      }
      // refresh list preview / unread
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === ticketId);
        if (!exists) { loadList(); return prev; }
        return prev.map((t) => t.id === ticketId
          ? { ...t, last_message: message.body || (message.attachment ? '📎 Attachment' : ''), last_message_at: message.created_at || message.createdAt || new Date().toISOString(), last_sender_id: message.sender_id, unread_count: ticketId === activeRef.current ? 0 : (message.sender_id === myId ? t.unread_count : t.unread_count + 1) }
          : t);
      });
    };
    const onTicket = (h: { ticketId: number; status: Status; assigned_admin_id: number | null; last_message: string; last_message_at: string; last_sender_id: number }) => {
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === h.ticketId);
        if (!exists) { loadList(); return prev; }
        return prev.map((t) => t.id === h.ticketId
          ? { ...t, status: h.status, assigned_admin_id: h.assigned_admin_id, last_message: h.last_message, last_message_at: h.last_message_at, last_sender_id: h.last_sender_id }
          : t);
      });
    };

    s.on('supportMessage', onMsg);
    s.on('supportTicketUpdated', onTicket);
    return () => { s.off('supportMessage', onMsg); s.off('supportTicketUpdated', onTicket); };
  }, [loadList, myId]);

  // ── Send a message ──────────────────────────────────────────────────────────
  const doSend = async () => {
    const text = input.trim();
    if ((!text && !pendingAtt) || !activeId || sending) return;
    setSending(true);
    try {
      const res = await supportApi.send(activeId, text, pendingAtt || undefined);
      const msg: Msg = res.data?.message;
      if (msg) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        scrollToBottom();
      }
      setInput(''); setPendingAtt(null); setEmojiOpen(false);
      // update local list + status (admin reply may have auto-claimed)
      if (res.data?.ticket) setTickets((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...res.data.ticket } : t)));
    } catch (e) { alert((e as Error).message); } finally { setSending(false); }
  };

  const onPickFile = async (f: File | null) => {
    if (!f) return;
    setUploading(true);
    try { const res = await supportApi.upload(f); setPendingAtt(res.data); }
    catch (e) { alert((e as Error).message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  // ── Admin actions ───────────────────────────────────────────────────────────
  const assignToMe = async () => {
    if (!activeId) return;
    try { const res = await supportApi.assign(activeId); setTickets((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...res.data } : t))); }
    catch (e) { alert((e as Error).message); }
  };
  const changeStatus = async (status: Status) => {
    if (!activeId) return;
    try { const res = await supportApi.setStatus(activeId, status); setTickets((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...res.data } : t))); }
    catch (e) { alert((e as Error).message); }
  };

  // ── User: open a new ticket ─────────────────────────────────────────────────
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const submitNew = async () => {
    if (!newBody.trim()) return;
    try {
      const res = await supportApi.open({ subject: newSubject.trim() || undefined, body: newBody.trim() });
      const t: Ticket = res.data;
      setTickets((prev) => [t, ...prev]);
      setComposeOpen(false); setNewSubject(''); setNewBody('');
      openTicket(t.id);
    } catch (e) { alert((e as Error).message); }
  };

  const partyOf = (t: Ticket) => (isAdmin ? t.requester : t.assignee);
  const canWrite = active && active.status !== 'CLOSED';

  return (
    <DashboardLayout title={title} role={role}>
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">

        {/* ── Left: ticket list ─────────────────────────────────── */}
        <div className={cn('w-full md:w-[340px] border-r border-gray-200 flex flex-col', mobileThread && 'hidden md:flex')}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{isAdmin ? 'Support Queue' : 'My Tickets'}</h2>
            {!isAdmin && (
              <button onClick={() => setComposeOpen(true)} className="text-sm font-medium text-white bg-[#e84545] rounded-full px-3 py-1.5 hover:bg-[#d63a3a]">
                <i className="fa fa-plus mr-1" /> New
              </button>
            )}
          </div>

          {/* Admin filter tabs */}
          {isAdmin && (
            <div className="flex gap-1 px-3 py-2 border-b border-gray-100 text-xs">
              {(['open', 'unassigned', 'mine', 'all'] as const).map((s) => (
                <button key={s} onClick={() => setScope(s)}
                  className={cn('px-2.5 py-1 rounded-full capitalize', scope === s ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                <span className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[#e84545] animate-spin" />
                <span className="text-sm">Loading tickets…</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
                <i className="fa fa-inbox text-3xl text-gray-300" />
                <p className="text-sm text-gray-400">{isAdmin ? 'No tickets here.' : 'No tickets yet.'}</p>
                {!isAdmin && <p className="text-xs text-gray-400">Tap “New” to contact support.</p>}
              </div>
            ) : tickets.map((t) => {
              const p = partyOf(t);
              return (
                <button key={t.id} onClick={() => openTicket(t.id)}
                  className={cn('w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex gap-3', activeId === t.id && 'bg-red-50')}>
                  <div className="h-10 w-10 rounded-full bg-[#e84545] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials(isAdmin ? p?.name : (t.subject || 'S'))}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{isAdmin ? (p?.name || 'User') : (t.subject || 'Support request')}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{relTime(t.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{t.last_message || 'No messages yet'}</p>
                      {t.unread_count > 0 && <span className="bg-[#e84545] text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center flex-shrink-0">{t.unread_count}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', STATUS_META[t.status].cls)}>{STATUS_META[t.status].label}</span>
                      {isAdmin && !t.assigned_admin_id && <span className="text-[10px] text-amber-600 font-medium">• Unassigned</span>}
                      {isAdmin && t.assigned_admin_id === myId && <span className="text-[10px] text-blue-600 font-medium">• Mine</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: thread ─────────────────────────────────────── */}
        <div className={cn('flex-1 flex flex-col', !mobileThread && 'hidden md:flex')}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <i className="fa fa-life-ring text-5xl mb-3 text-gray-300" />
              <p className="text-sm">Select a ticket to view the conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                <button className="md:hidden text-gray-500" onClick={() => setMobileThread(false)}><i className="fa fa-arrow-left" /></button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{active.subject || 'Support request'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isAdmin ? (active.requester?.name || 'User') : 'Support team'}
                    {active.assignee && <span className="text-gray-400"> • handled by {active.assignee.name}</span>}
                  </p>
                </div>
                <span className={cn('text-[11px] font-medium px-2 py-1 rounded-full', STATUS_META[active.status].cls)}>{STATUS_META[active.status].label}</span>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {active.assigned_admin_id !== myId && (
                      <button onClick={assignToMe} className="text-xs font-medium text-white bg-[#e84545] rounded-full px-3 py-1.5 hover:bg-[#d63a3a]">
                        {active.assigned_admin_id ? 'Reassign to me' : 'Accept'}
                      </button>
                    )}
                    <div className="relative" ref={statusRef}>
                      <button
                        onClick={() => setStatusMenuOpen((v) => !v)}
                        className="flex items-center gap-2 text-xs font-medium border border-gray-300 rounded-lg pl-2 pr-1.5 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className={cn('h-2 w-2 rounded-full', {
                          OPEN: 'bg-amber-500', IN_PROGRESS: 'bg-blue-500', RESOLVED: 'bg-green-500', CLOSED: 'bg-gray-400',
                        }[active.status])} />
                        {STATUS_META[active.status].label}
                        <i className={cn('fa fa-chevron-down text-[10px] text-gray-400 transition-transform', statusMenuOpen && 'rotate-180')} />
                      </button>
                      {statusMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 overflow-hidden">
                          {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as Status[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => { changeStatus(s); setStatusMenuOpen(false); }}
                              className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors',
                                active.status === s ? 'text-[#e84545] font-semibold' : 'text-gray-700')}
                            >
                              <span className={cn('h-2 w-2 rounded-full', {
                                OPEN: 'bg-amber-500', IN_PROGRESS: 'bg-blue-500', RESOLVED: 'bg-green-500', CLOSED: 'bg-gray-400',
                              }[s])} />
                              {STATUS_META[s].label}
                              {active.status === s && <i className="fa fa-check ml-auto text-[10px]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
                {loadingMsgs ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                    <span className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[#e84545] animate-spin" />
                    <span className="text-sm">Loading conversation…</span>
                  </div>
                ) : messages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div key={m.id} className={cn('flex gap-2 items-end', mine ? 'justify-end' : 'justify-start')}>
                      {!mine && (
                        <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-700">{initials(m.sender?.name)}</span>
                        </div>
                      )}
                      <div className={cn('max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm', mine ? 'bg-[#e84545] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm')}>
                        {m.attachment && (
                          <a href={m.attachment.url} target="_blank" rel="noreferrer"
                             className={cn('flex items-center gap-2 mb-1 rounded-lg px-2 py-1.5 text-xs', mine ? 'bg-white/15' : 'bg-gray-100')}>
                            <i className="fa fa-paperclip" />
                            <span className="truncate max-w-[160px]">{m.attachment.name}</span>
                          </a>
                        )}
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                        <div className={cn('text-[10px] mt-1 text-right', mine ? 'text-red-100' : 'text-gray-400')}>{timeOf(m)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              {canWrite ? (
                <div className="border-t border-gray-200 p-3">
                  {pendingAtt && (
                    <div className="mb-2 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-xs">
                      <i className="fa fa-paperclip text-gray-500" />
                      <span className="truncate flex-1">{pendingAtt.name}</span>
                      <button onClick={() => setPendingAtt(null)} className="text-gray-400 hover:text-red-500"><i className="fa fa-times" /></button>
                    </div>
                  )}
                  {emojiOpen && (
                    <div className="mb-2 flex flex-wrap gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
                      {EMOJIS.map((e) => <button key={e} onClick={() => setInput((v) => v + e)} className="text-lg hover:scale-125 transition-transform">{e}</button>)}
                    </div>
                  )}
                  <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-gray-500 hover:text-[#e84545] pb-1">
                      <i className={cn('fa', uploading ? 'fa-spinner fa-spin' : 'fa-paperclip')} />
                    </button>
                    <button onClick={() => setEmojiOpen((v) => !v)} className="text-gray-500 hover:text-[#e84545] pb-1"><i className="fa fa-smile-o" /></button>
                    <input ref={fileRef} type="file" hidden onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } }}
                      rows={1}
                      placeholder="Type a message…"
                      className="flex-1 bg-transparent resize-none focus:outline-none text-sm py-1 max-h-24"
                    />
                    <button onClick={doSend} disabled={sending || (!input.trim() && !pendingAtt)}
                      className="h-9 w-9 rounded-full bg-[#e84545] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#d63a3a]">
                      <i className={cn('fa', sending ? 'fa-spinner fa-spin' : 'fa-paper-plane')} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-400">
                  This ticket is closed.{!isAdmin && ' Open a new ticket to continue.'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── New ticket modal (user) ─────────────────────────────── */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 page-fade-in" onClick={() => setComposeOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Header band */}
            <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#e84545] to-[#c53030] text-white">
              <button onClick={() => setComposeOpen(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <i className="fa fa-times text-sm" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <i className="fa fa-life-ring text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Contact Support</h3>
                  <p className="text-xs text-white/80 mt-0.5">We usually reply within a few hours</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="p-6">
              <label className="text-xs font-semibold text-gray-700">Subject <span className="font-normal text-gray-400">(optional)</span></label>
              <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Payment not received"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm mb-4 mt-1.5 focus:outline-none focus:bg-white focus:border-[#e84545] focus:ring-2 focus:ring-[#e84545]/15 transition-all" />

              <label className="text-xs font-semibold text-gray-700">How can we help?</label>
              <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={4} maxLength={1000} placeholder="Describe your issue in detail…"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:bg-white focus:border-[#e84545] focus:ring-2 focus:ring-[#e84545]/15 transition-all resize-none" />
              <div className="text-[11px] text-gray-400 text-right mt-1">{newBody.length}/1000</div>

              <button onClick={submitNew} disabled={!newBody.trim()}
                className="w-full mt-3 bg-[#e84545] text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d63a3a] active:scale-[0.99] transition-all shadow-sm shadow-[#e84545]/30">
                <i className="fa fa-paper-plane" /> Send to Support
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                <i className="fa fa-lock mr-1" /> Your conversation is private between you and the support team
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

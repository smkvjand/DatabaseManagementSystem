import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronLeft, Search, Trash2, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

const HUES = [['#ff9a6b', '#ff5e8a'], ['#6bc4ff', '#5a7dff'], ['#7be0a8', '#2fb5a0'], ['#ffd36b', '#ff9a3c'], ['#c79bff', '#8a6bff'], ['#ff8fb1', '#e8508a']];
const grad = (s: string) => { const h = [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length; return `linear-gradient(145deg, ${HUES[h][0]}, ${HUES[h][1]})`; };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 44 }) => (
  <span className="msg-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: grad(name) }}>{initials(name)}</span>
);

const short = (iso: string) => {
  const d = new Date(iso), now = new Date(), days = Math.floor((+now - +d) / 864e5);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

export const MessagesView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const [, tick] = useState(0);
  const [withId, setWithId] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [reqs, setReqs] = useState<any[]>([]);
  const [menu, setMenu] = useState(false);
  const [cerr, setCerr] = useState('');
  const loadReqs = () => StorageService.contacts().then(setReqs).catch(() => {});
  useEffect(() => { loadReqs(); const t = setInterval(loadReqs, 15000); return () => clearInterval(t); }, []);
  const act = async (fn: () => Promise<any>) => { setCerr(''); try { await fn(); await loadReqs(); } catch (e: any) { setCerr(e.message || 'Something went wrong'); } };

  useEffect(() => StorageService.subscribe(() => tick((t) => t + 1)), []);
  useEffect(() => {
    const t = setInterval(() => StorageService.load().then(() => tick((x) => x + 1)).catch(() => {}), 20000);
    return () => clearInterval(t);
  }, []);

  const me = currentUser.id;
  const msgs = StorageService.getMessages();
  const nameOf = (id: string) => allUsers.find((u) => u.id === id)?.name || 'Unknown';
  const otherOf = (m: { senderId: string; recipientId: string }) => (m.senderId === me ? m.recipientId : m.senderId);

  // one row per conversation, newest first
  const convos = useMemo(() => {
    const last = new Map<string, (typeof msgs)[number]>();
    msgs.forEach((m) => last.set(otherOf(m), m));
    return [...last.entries()].map(([id, m]) => ({ id, m, unread: msgs.filter((x) => x.senderId === id && x.recipientId === me && !x.readAt).length }))
      .sort((a, b) => +new Date(b.m.sentAt) - +new Date(a.m.sentAt));
  }, [msgs.length, msgs[msgs.length - 1]?.id, msgs.filter((m) => !m.readAt).length]);

  const q = query.trim().toLowerCase();
  const shownConvos = convos.filter((c) => !q || nameOf(c.id).toLowerCase().includes(q) || c.m.body.toLowerCase().includes(q));
  const haveIds = new Set(convos.map((c) => c.id));
  const people = q ? allUsers.filter((u) => u.id !== me && !haveIds.has(u.id) && u.name.toLowerCase().includes(q)).slice(0, 6) : [];

  const thread = msgs.filter((m) => otherOf(m) === withId);
  const unreadIds = thread.filter((m) => m.recipientId === me && !m.readAt).map((m) => m.id);
  useEffect(() => { if (unreadIds.length) StorageService.markMessagesRead(unreadIds); }, [unreadIds.join(',')]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [withId, thread.length]);

  const send = async () => {
    if (!withId || !text.trim() || sending) return;
    setSending(true);
    try { await StorageService.sendMessage(withId, text.trim()); setText(''); } catch { /* alert shown by storage layer */ } finally { setSending(false); }
  };
  const open = (id: string) => { setWithId(id); setQuery(''); };
  const lastMineId = [...thread].reverse().find((m) => m.senderId === me)?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10">
      <div className={`msg-shell ${withId ? 'has-thread' : ''}`}>
        {/* ---------- sidebar ---------- */}
        <aside className="msg-side">
          <div className="px-5 pt-6 pb-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#161617] mb-3">Messages</h1>
            <label className="msg-search block">
              <Search size={16} />
              <input className="msg-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or messages" aria-label="Search messages" />
            </label>
          </div>

          <div className="msg-scroll flex-1 px-3 pb-4 space-y-0.5">
            {people.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">Start a new message</div>
                {people.map((u) => (
                  <button key={u.id} className="msg-row cursor-pointer" onClick={() => open(u.id)}>
                    <Avatar name={u.name} />
                    <div className="min-w-0"><div className="text-[15px] font-medium text-[#161617] truncate">{u.name}</div><div className="text-[12px] text-[#86868B]">Tap to message</div></div>
                  </button>
                ))}
                {shownConvos.length > 0 && <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">Conversations</div>}
              </>
            )}
            {shownConvos.map(({ id, m, unread }) => (
              <button key={id} onClick={() => open(id)} className={`msg-row cursor-pointer ${withId === id ? 'on' : ''}`}>
                <Avatar name={nameOf(id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-[15px] truncate ${unread ? 'font-semibold' : 'font-medium'} text-[#161617]`}>{nameOf(id)}</span>
                    <span className="text-[11px] text-[#86868B] shrink-0">{short(m.sentAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] truncate ${unread ? 'text-[#161617]' : 'text-[#86868B]'}`}>{m.senderId === me ? 'You: ' : ''}{m.body}</span>
                    {unread > 0 && <span className="shrink-0 min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: '#0a7aff' }}>{unread}</span>}
                  </div>
                </div>
              </button>
            ))}
            {!shownConvos.length && !people.length && (
              <p className="text-[13px] text-[#86868B] text-center px-4 py-10">{q ? `No one matches “${query}”.` : 'No conversations yet. Search for a classmate above to say hi.'}</p>
            )}
          </div>
        </aside>

        {/* ---------- thread ---------- */}
        <section className="msg-main">
          {withId ? (
            <>
              <div className="msg-head">
                <button className="msg-back cursor-pointer text-[#0a7aff]" onClick={() => setWithId('')} aria-label="Back"><ChevronLeft size={22} /></button>
                <Avatar name={nameOf(withId)} size={38} />
                <div><div className="text-[15px] font-semibold text-[#161617] leading-tight">{nameOf(withId)}</div><div className="text-[12px] text-[#86868B]">reWear campus member</div></div>
              </div>
              {(() => {
                const mine = reqs.filter((r) => [r.requesterId, r.recipientId].includes(withId) && [r.requesterId, r.recipientId].includes(me) && r.status !== 'declined');
                if (!mine.length && !cerr) return null;
                const label = (k: string) => (k === 'phone' ? 'WhatsApp' : 'Instagram');
                return (
                  <div className="px-5 pt-3 space-y-2">
                    {cerr && <div className="text-[12px] text-red-600">{cerr}</div>}
                    {mine.map((r) => {
                      const incoming = r.recipientId === me;
                      return (
                        <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F5F5F7] px-4 py-2.5 text-[13px]">
                          {r.status === 'accepted' ? (
                            <>
                              <span>{label(r.kind)} shared</span>
                              {r.theirValue
                                ? <a className="font-semibold text-[#0a7aff]" target="_blank" rel="noopener noreferrer" href={r.kind === 'phone' ? `https://wa.me/${String(r.theirValue).replace(/\D/g, '')}` : `https://instagram.com/${r.theirValue}`}>{r.kind === 'phone' ? r.theirValue : '@' + r.theirValue}</a>
                                : <span className="text-[#86868B]">Not available</span>}
                            </>
                          ) : incoming ? (
                            <>
                              <span>{nameOf(withId)} wants to exchange {label(r.kind)}</span>
                              <span className="flex gap-2 shrink-0">
                                <button className="px-3 py-1 rounded-full bg-[#161617] text-white cursor-pointer" onClick={() => act(() => StorageService.respondContact(r.id, 'accept'))}>Accept</button>
                                <button className="px-3 py-1 rounded-full border border-[#E5E5EA] cursor-pointer" onClick={() => act(() => StorageService.respondContact(r.id, 'decline'))}>Decline</button>
                              </span>
                            </>
                          ) : <span className="text-[#86868B]">{label(r.kind)} request sent. Waiting for {nameOf(withId)}.</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="msg-scroll flex-1 px-5 py-4">
                {thread.map((m, i) => {
                  const mine = m.senderId === me, prev = thread[i - 1], next = thread[i + 1];
                  const newDay = !prev || new Date(prev.sentAt).toDateString() !== new Date(m.sentAt).toDateString();
                  const endOfRun = !next || next.senderId !== m.senderId || new Date(next.sentAt).toDateString() !== new Date(m.sentAt).toDateString();
                  const startOfRun = newDay || prev.senderId !== m.senderId;
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && <div className="text-center text-[11px] font-medium text-[#86868B] py-3">{dayLabel(m.sentAt)}</div>}
                      <div className={`bubble-wrap flex ${mine ? 'justify-end' : 'justify-start'} ${startOfRun ? 'mt-2' : 'mt-0.5'}`} title={new Date(m.sentAt).toLocaleString()}>
                        <div className={`bubble ${mine ? 'me' : 'them'} ${endOfRun ? 'tail' : ''}`}>
                          {mine && <button className="bubble-del cursor-pointer" aria-label="Unsend" title="Unsend" onClick={() => window.confirm('Unsend this message for everyone?') && StorageService.deleteMessage(m.id)}><Trash2 size={14} /></button>}
                          {m.body}
                        </div>
                      </div>
                      {mine && m.id === lastMineId && <div className="text-right text-[11px] text-[#86868B] pr-1 pt-0.5">{m.readAt ? `Read ${short(m.readAt)}` : 'Delivered'}</div>}
                    </React.Fragment>
                  );
                })}
                {!thread.length && <p className="text-center text-[13px] text-[#86868B] pt-16">This is the start of your conversation with {nameOf(withId)}.</p>}
                <div ref={endRef} />
              </div>

              <div className="msg-composer">
                <div className="relative self-center -ml-2">
                  <button onClick={() => setMenu(!menu)} className="cursor-pointer w-8 h-8 grid place-items-center rounded-full bg-[rgba(120,120,128,.18)] text-[#3c3c43]" title="Share contact" aria-label="Share contact"><Plus size={18} strokeWidth={2.5} /></button>
                  {menu && (
                    <div className="absolute left-0 bottom-full mb-2 z-20 w-56 rounded-xl bg-white border border-[#E5E5EA] shadow-lg p-1 text-[13px]">
                      <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer" onClick={() => { setMenu(false); act(() => StorageService.requestContact(withId, 'phone')); }}>Request WhatsApp number</button>
                      <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer" onClick={() => { setMenu(false); act(() => StorageService.requestContact(withId, 'instagram')); }}>Request Instagram</button>
                    </div>
                  )}
                </div>
                <textarea
                  className="msg-input" rows={1} value={text} maxLength={1000} placeholder="Message"
                  onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button className="msg-send cursor-pointer" onClick={send} disabled={sending || !text.trim()} aria-label="Send"><ArrowUp size={18} strokeWidth={2.5} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center px-8">
              <div>
                <span className="inline-grid place-items-center w-16 h-16 rounded-full mb-4 text-white" style={{ background: 'linear-gradient(180deg,#3da0ff,#0a7aff)' }}><MessageCircle size={28} /></span>
                <div className="text-[17px] font-semibold text-[#161617]">Your messages</div>
                <p className="text-[13px] text-[#86868B] mt-1">Pick a conversation, or search for someone to start one.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

interface MessagesViewProps { initialWithId?: string; }

export const MessagesView: React.FC<MessagesViewProps> = ({ initialWithId }) => {
  const { currentUser, allUsers } = useAuth();
  const [, tick] = useState(0);
  const [withId, setWithId] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');

  // opened from "Message Owner" / charity "Message" -> jump straight into that conversation
  useEffect(() => { if (initialWithId) setWithId(initialWithId); }, [initialWithId]);

  useEffect(() => StorageService.subscribe(() => tick((t) => t + 1)), []);
  useEffect(() => {
    const t = setInterval(() => StorageService.load().then(() => tick((x) => x + 1)).catch(() => {}), 20000);
    return () => clearInterval(t);
  }, []);

  const me = currentUser.id;
  const msgs = StorageService.getMessages();
  const nameOf = (id: string) => allUsers.find((u) => u.id === id)?.name || 'Unknown';
  const otherOf = (m: { senderId: string; recipientId: string }) => (m.senderId === me ? m.recipientId : m.senderId);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? allUsers.filter((u) => u.id !== me && (u.name.toLowerCase().includes(needle) || u.email.toLowerCase().startsWith(needle) || u.studentId.toLowerCase().includes(needle)))
    : [];
  const openUser = (id: string) => { setWithId(id); setQuery(''); }; // existing thread is reused: threads are derived per user, never duplicated

  const partners = [...new Set([...msgs].reverse().map(otherOf))];
  const unread = (id: string) => msgs.filter((m) => m.senderId === id && m.recipientId === me && !m.readAt).length;
  const thread = msgs.filter((m) => otherOf(m) === withId);
  const unreadIds = thread.filter((m) => m.recipientId === me && !m.readAt).map((m) => m.id);

  useEffect(() => { if (unreadIds.length) StorageService.markMessagesRead(unreadIds); }, [unreadIds.join(',')]);

  const send = async () => {
    if (!withId || !text.trim() || sending) return;
    setSending(true);
    try { await StorageService.sendMessage(withId, text.trim()); setText(''); } catch { /* alert shown by storage layer */ } finally { setSending(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      <h1 className="text-2xl font-semibold tracking-tight text-[#161617] mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <aside className="rounded-2xl bg-white border border-[#E5E5EA] p-3 space-y-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name…"
            className="w-full mb-2 px-3 py-2 text-[13px] rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] focus:outline-none focus:border-[#161617]"
          />
          {needle && (
            <div className="mb-2 rounded-lg border border-[#E5E5EA] overflow-hidden">
              {results.map((u) => (
                <button key={u.id} onClick={() => openUser(u.id)} className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[#F5F5F7] cursor-pointer">
                  <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                  <span className="flex-1">{u.name}</span>
                  <span className="text-[10px] text-[#86868B]">{u.role === 'charity' ? 'Charity' : u.campusDorm}</span>
                </button>
              ))}
              {!results.length && <p className="text-[12px] text-[#86868B] px-3 py-3">No users found</p>}
            </div>
          )}
          <select
            value=""
            onChange={(e) => e.target.value && setWithId(e.target.value)}
            className="w-full mb-2 px-2 py-1.5 text-[12px] rounded-lg border border-[#E5E5EA] bg-[#F5F5F7]"
          >
            <option value="">New message to…</option>
            {allUsers.filter((u) => u.id !== me).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {[...new Set([...(withId ? [withId] : []), ...partners])].map((id) => (
            <button
              key={id}
              onClick={() => setWithId(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex justify-between ${withId === id ? 'bg-[#F5F5F7] font-medium' : 'hover:bg-[#F5F5F7]'}`}
            >
              <span>{nameOf(id)}</span>
              {unread(id) > 0 && <span className="text-[11px] px-1.5 rounded-full bg-[#161617] text-white">{unread(id)}</span>}
            </button>
          ))}
          {!partners.length && !withId && <p className="text-[12px] text-[#86868B] px-2 py-3">No conversations yet.</p>}
        </aside>

        <section className="rounded-2xl bg-white border border-[#E5E5EA] flex flex-col min-h-[420px]">
          {withId ? (
            <>
              <div className="px-4 py-3 border-b border-[#F2F2F7] text-[13px] font-medium">{nameOf(withId)}</div>
              <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[480px]">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === me ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] ${m.senderId === me ? 'bg-[#161617] text-white' : 'bg-[#F5F5F7] text-[#161617]'}`}>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      <div className="text-[10px] opacity-60 mt-1">
                        {new Date(m.sentAt).toLocaleString()}{m.senderId === me && m.readAt ? ' • read' : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {!thread.length && <p className="text-[12px] text-[#86868B]">Say hi.</p>}
              </div>
              <div className="p-3 border-t border-[#F2F2F7] flex gap-2">
                <input
                  value={text}
                  maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Write a message…"
                  className="flex-1 px-3 py-2 text-[13px] rounded-full border border-[#E5E5EA] bg-[#F5F5F7] focus:outline-none focus:border-[#161617]"
                />
                <button onClick={send} disabled={sending || !text.trim()} className="px-4 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium disabled:opacity-40">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-[#86868B]">Pick a conversation or start a new one.</div>
          )}
        </section>
      </div>
    </div>
  );
};

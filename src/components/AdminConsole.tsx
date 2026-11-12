import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

const chip: Record<string, string> = { active: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-700' };

export const AdminConsole: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const [c, setC] = useState<any>(null);
  const [err, setErr] = useState('');
  const [over, setOver] = useState<Record<string, string>>({});
  const [gone, setGone] = useState<string[]>([]);
  const [uq, setUq] = useState('');
  const [page, setPage] = useState(0);
  const [box, setBox] = useState({ name: '', campusZone: '', buildingName: '', floorLocation: '', hours: '' });
  const load = () => StorageService.adminConsole().then(setC).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const go = async (fn: () => Promise<any>, after?: () => void) => { setErr(''); try { await fn(); after?.(); await load(); } catch (e: any) { setErr(e.message); } };
  if (!c) return <div className="mt-10 text-[13px] text-red-600">{err}</div>;

  const setRole = (u: any, role: string) => {
    let fid: number | undefined;
    if (role === 'charity') { fid = Number(prompt('Foundation ID:\n' + c.charities.map((f: any) => `${f.id} = ${f.name}`).join('\n'))); if (!fid) return; }
    go(() => StorageService.setUserRole(u.id, role, fid), () => setOver({ ...over, [u.id]: role }));
  };
  const needle = uq.trim().toLowerCase();
  const filtered = allUsers.filter((u) => !gone.includes(u.id) && (!needle || `${u.name} ${u.email} ${over[u.id] || u.role}`.toLowerCase().includes(needle)));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)), cur = Math.min(page, pages - 1);
  const pageUsers = filtered.slice(cur * 10, cur * 10 + 10);
  const inp = 'w-full px-3 py-2 text-[14px]';
  const h2 = 'text-xl font-semibold mb-3';

  return (
    <div className="mt-12 space-y-10">
      {err && <div className="text-[13px] text-red-600">{err}</div>}
      <section>
        <h2 className={h2}>Users & admins {c.isSuper ? <span className="text-[12px] font-medium text-emerald-800 ml-2">Super admin: you can appoint admins</span> : <span className="text-[12px] font-normal text-[#6e6e73] ml-2">Only {c.superEmail} can appoint admins</span>}</h2>
        <input className="w-full px-4 py-2.5 text-[14px] mb-3" placeholder="Search by name, email or role" value={uq} onChange={(e) => { setUq(e.target.value); setPage(0); }} />
        <div className="space-y-2">
          {!pageUsers.length && <div className="text-[13px] text-[#6e6e73]">No users match.</div>}
          {pageUsers.map((u) => {
            const role = over[u.id] || u.role, locked = u.id === currentUser.id || u.email.toLowerCase() === c.superEmail || (role === 'admin' && !c.isSuper);
            return (
              <div key={u.id} className="glass-panel p-3 flex items-center justify-between gap-3 text-[14px]">
                <div><div className="font-medium">{u.name}{u.email.toLowerCase() === c.superEmail && ' ★'}</div><div className="text-[12px] text-[#6e6e73]">{u.email}</div></div>
                <div className="flex items-center gap-2">
                  <select disabled={locked} value={role === 'student' ? 'user' : role} onChange={(e) => setRole(u, e.target.value)} className="px-2 py-1 text-[13px]">
                    <option value="user">User</option><option value="charity">Charity</option><option value="admin" disabled={!c.isSuper}>Admin</option>
                  </select>
                  <button disabled={locked} onClick={() => confirm(`Delete ${u.email}?`) && go(() => StorageService.deleteUser(u.id), () => setGone([...gone, u.id]))} className="px-3 py-1 rounded-full border border-red-300 text-red-600 text-[12px] disabled:opacity-30 cursor-pointer">Remove</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-[13px] text-[#6e6e73]">
          <span>{filtered.length} user{filtered.length === 1 ? '' : 's'} · page {cur + 1} of {pages}</span>
          <span className="flex gap-2">
            <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="px-3 py-1 rounded-full border border-[#E5E5EA] disabled:opacity-30 cursor-pointer">Prev</button>
            <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="px-3 py-1 rounded-full border border-[#E5E5EA] disabled:opacity-30 cursor-pointer">Next</button>
          </span>
        </div>
      </section>

      <section>
        <h2 className={h2}>Charities</h2>
        <div className="space-y-2">
          {c.charities.map((f: any) => (
            <div key={f.id} className="glass-panel p-3 flex items-center justify-between text-[14px]">
              <div className="font-medium">{f.name} <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${chip[f.status] || chip.pending}`}>{f.status === 'active' ? 'verified' : f.status || 'pending'}</span></div>
              <button onClick={() => go(() => StorageService.setCharityStatus(f.id, f.status === 'active' ? 'pending' : 'active'))} className="px-3 py-1 rounded-full border border-[#E5E5EA] text-[13px] cursor-pointer">{f.status === 'active' ? 'Revoke badge' : 'Verify'}</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={h2}>Add drop-off box</h2>
        <form onSubmit={(e) => { e.preventDefault(); go(() => StorageService.createDropoff(box), () => setBox({ name: '', campusZone: '', buildingName: '', floorLocation: '', hours: '' })); }} className="glass-panel p-4 grid sm:grid-cols-5 gap-2">
          <input className={inp} placeholder="Name" value={box.name} onChange={(e) => setBox({ ...box, name: e.target.value })} required />
          <input className={inp} placeholder="Campus zone" value={box.campusZone} onChange={(e) => setBox({ ...box, campusZone: e.target.value })} />
          <input className={inp} placeholder="Building" value={box.buildingName} onChange={(e) => setBox({ ...box, buildingName: e.target.value })} />
          <input className={inp} placeholder="Floor / spot" value={box.floorLocation} onChange={(e) => setBox({ ...box, floorLocation: e.target.value })} />
          <input className={inp} placeholder="Hours" value={box.hours} onChange={(e) => setBox({ ...box, hours: e.target.value })} />
          <button className="sm:col-span-5 bg-[#161617] text-white rounded-full py-2 text-[14px] font-medium cursor-pointer">Create box</button>
        </form>
      </section>

      <section>
        <h2 className={h2}>Audit log</h2>
        <div className="glass-panel divide-y divide-[#E5E5EA] text-[13px]">
          {!c.audit.length && <div className="p-4 text-[#6e6e73]">No actions yet.</div>}
          {c.audit.map((l: any) => <div key={l.id} className="px-4 py-2 flex justify-between gap-3"><span><b>{l.who}</b> · {l.action} · {l.target} {l.detail && `(${l.detail})`}</span><span className="text-[#6e6e73] shrink-0">{new Date(l.at).toLocaleString()}</span></div>)}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

const tabs = ['Dashboard', 'Drives', 'Verification'] as const;
const badge: Record<string, string> = { approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-700', pending: 'bg-amber-100 text-amber-800' };

export const CharityPortal: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Dashboard');
  const [me, setMe] = useState<any>(null);
  const [, tick] = useState(0);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', description: '', beneficiaries: '' });
  const [doc, setDoc] = useState({ type: 'Registration certificate', file: null as File | null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => StorageService.charityMe().then(setMe).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); return StorageService.subscribe(() => tick((n) => n + 1)); }, [load]);

  const verified = me?.foundation?.status === 'active';
  const fid = String(me?.foundation?.id ?? '');
  const boxes = [...StorageService.getDropBoxes()].filter((b) => b.active).sort((a, b) => b.currentFillPercent - a.currentFillPercent);
  const donations = StorageService.getDonations().filter((d) => d.charityFoundationId === fid);
  const run = async (fn: () => Promise<any>) => { setErr(''); setBusy(true); try { await fn(); await load(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };

  const upload = () => run(async () => {
    const file = doc.file; if (!file) throw new Error('Choose a file first');
    if (file.size > 2e6) throw new Error('Max file size is 2 MB');
    const data = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
    await StorageService.submitDoc({ type: doc.type, fileName: file.name, data }); setDoc({ ...doc, file: null });
  });

  const inp = 'w-full px-4 py-3 text-[15px]';

  return (
    <div className="min-h-screen text-[#1D1D1F]">
      <header className="glass fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.04em]"><span className="w-2.5 h-2.5 rounded-full bg-[#161617]" />reWear <span className="text-[12px] font-medium text-[#6e6e73] ml-1">Charity</span></div>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="hidden sm:block text-[#6e6e73]">{me?.foundation?.name || currentUser.name}</span>
            <button onClick={logout} className="px-4 py-1.5 rounded-full bg-[#161617] text-white font-medium cursor-pointer">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-5xl text-[#161617]">{me?.foundation?.name || 'Charity portal'}</h1>
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          <span className={`px-2.5 py-0.5 rounded-full font-medium ${verified ? badge.approved : badge.pending}`}>{verified ? 'Verified' : me?.foundation?.status === 'rejected' ? 'Verification rejected' : 'Not verified yet'}</span>
        </div>
        <div className="mt-8 flex gap-2">
          {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium cursor-pointer ${tab === t ? 'bg-[#161617] text-white' : 'text-[#6e6e73]'}`}>{t}</button>)}
        </div>
        {err && <div className="mt-4 text-[13px] text-red-600">{err}</div>}
        {!verified && <div className="glass-panel mt-6 px-6 py-4 text-[14px] text-[#6e6e73]">Reminder: submit your documents under <button onClick={() => setTab('Verification')} className="underline font-medium text-[#161617] cursor-pointer">Verification</button> to get the verified badge.</div>}

        {tab === 'Dashboard' && (
          <div className="mt-6 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">Drop-off boxes</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {boxes.map((b) => (
                  <div key={b.id} className="glass-panel p-5">
                    <div className="flex justify-between items-start"><div className="font-semibold">{b.name}</div>{b.currentFillPercent >= 70 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Ready to collect</span>}</div>
                    <div className="text-[13px] text-[#6e6e73] mt-1">{b.buildingName} · {b.campusZone}</div>
                    <div className="mt-3 h-2 rounded-full bg-[#E5E5EA] overflow-hidden"><div className="h-full bg-[#161617]" style={{ width: `${b.currentFillPercent}%` }} /></div>
                    <div className="mt-2 text-[12px] text-[#6e6e73]">{b.currentFillPercent}% full · {b.totalKgCollected} kg total · {b.hours}</div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">Donations to you</h2>
              {!donations.length && <div className="text-[14px] text-[#6e6e73]">Nothing yet.</div>}
              <div className="space-y-2">
                {donations.map((d) => (
                  <div key={d.id} className="glass-panel p-4 flex items-center justify-between gap-4 text-[14px]">
                    <div><div className="font-medium">{d.clothingItem?.title || `Item ${d.clothingItemId}`}</div><div className="text-[12px] text-[#6e6e73]">{d.weightKg} kg · box {d.dropBoxId} · {d.status}</div></div>
                    {d.status !== 'verified_by_council' && <button onClick={() => { StorageService.verifyDonation(d.id, currentUser.id); tick((n) => n + 1); }} className="px-4 py-1.5 rounded-full bg-[#161617] text-white text-[13px] cursor-pointer">Mark received</button>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'Drives' && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await StorageService.addProgram(f); setF({ name: '', description: '', beneficiaries: '' }); }); }} className="glass-panel p-6 space-y-3 h-fit">
              <h2 className="text-xl font-semibold">Start a charity drive</h2>
              <input className={inp} placeholder="Drive name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
              <input className={inp} placeholder="Who it helps" value={f.beneficiaries} onChange={(e) => setF({ ...f, beneficiaries: e.target.value })} />
              <textarea className={inp} rows={3} placeholder="What you need (e.g. winter coats, sizes M–XL)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
              <button disabled={busy} className="w-full bg-[#161617] text-white rounded-full py-3 text-[15px] font-medium disabled:opacity-60 cursor-pointer">Launch drive</button>
            </form>
            <div className="space-y-3">
              {me.programs.map((p: any) => (
                <div key={p.id} className="glass-panel p-5 flex justify-between gap-4">
                  <div><div className="font-semibold">{p.name}</div><div className="text-[13px] text-[#6e6e73]">{p.beneficiaries}</div><div className="text-[13px] mt-1">{p.description}</div></div>
                  <button onClick={() => run(() => StorageService.setProgram(p.id, p.status === 'active' ? 'closed' : 'active'))} className="self-start px-3 py-1 rounded-full text-[12px] border border-[#E5E5EA] cursor-pointer">{p.status === 'active' ? 'Close' : 'Reopen'}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Verification' && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 space-y-3 h-fit">
              <h2 className="text-xl font-semibold">Submit documents</h2>
              <p className="text-[13px] text-[#6e6e73]">Registration certificate, tax-exempt letter or ID of a representative. PDF or image, up to 2 MB.</p>
              <select className={inp} value={doc.type} onChange={(e) => setDoc({ ...doc, type: e.target.value })}>
                {['Registration certificate', 'Tax-exempt letter', 'Representative ID', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input className={inp} type="file" accept=".pdf,image/*" onChange={(e) => setDoc({ ...doc, file: e.target.files?.[0] || null })} />
              <button onClick={upload} disabled={busy} className="w-full bg-[#161617] text-white rounded-full py-3 text-[15px] font-medium disabled:opacity-60 cursor-pointer">Submit for review</button>
            </div>
            <div className="space-y-3">
              {!me?.docs.length && <div className="text-[14px] text-[#6e6e73]">No documents submitted yet.</div>}
              {me?.docs.map((d: any) => (
                <div key={d.id} className="glass-panel p-4 flex justify-between items-center gap-3 text-[14px]">
                  <div><div className="font-medium">{d.type}</div><div className="text-[12px] text-[#6e6e73]">{d.fileName}{d.note ? ` · ${d.note}` : ''}</div></div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${badge[d.status] || badge.pending}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

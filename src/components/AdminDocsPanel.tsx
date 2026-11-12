import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';

export const AdminDocsPanel: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const load = () => StorageService.adminDocs().then(setDocs).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const view = async (id: number) => { const { data } = await StorageService.adminDocData(id); const w = window.open(); if (w) w.document.write(`<iframe src="${data}" style="border:0;width:100%;height:100vh"></iframe>`); };
  const review = async (id: number, s: string) => { const note = s === 'rejected' ? prompt('Reason (shown to charity)') || '' : ''; await StorageService.reviewDoc(id, s, note); load(); };
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3">Charity verification</h2>
      {err && <div className="text-[13px] text-red-600">{err}</div>}
      {!docs.length && <div className="text-[14px] text-[#6e6e73]">No documents submitted.</div>}
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="glass-panel p-4 flex items-center justify-between gap-4 text-[14px]">
            <div><div className="font-medium">{d.foundation} · {d.type}</div><div className="text-[12px] text-[#6e6e73]">{d.fileName} · {d.status}{d.foundationStatus === 'active' ? ' · charity verified' : ''}</div></div>
            <div className="flex gap-2 text-[13px]">
              <button onClick={() => view(d.id)} className="px-3 py-1 rounded-full border border-[#E5E5EA] cursor-pointer">View</button>
              {d.status === 'pending' && <><button onClick={() => review(d.id, 'approved')} className="px-3 py-1 rounded-full bg-[#161617] text-white cursor-pointer">Approve</button><button onClick={() => review(d.id, 'rejected')} className="px-3 py-1 rounded-full border border-red-300 text-red-600 cursor-pointer">Reject</button></>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Trash2, Hourglass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

// Two-person delete: first tap records my agreement, the other person's tap removes the rows.
export const PurgeButton: React.FC<{ kind: 'exchanges' | 'orders'; id: string; purgeBy?: string; solo?: boolean }> = ({ kind, id, purgeBy, solo }) => {
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const run = async (cancel = false) => {
    if (busy) return;
    if (!cancel && !window.confirm(solo || purgeBy ? 'Delete this permanently? This cannot be undone.' : 'Ask your partner to delete this record too? It is removed once you both agree.')) return;
    setBusy(true);
    try { await StorageService.purge(kind, id, cancel); } catch { /* alert shown by storage layer */ } finally { setBusy(false); }
  };
  const mine = purgeBy === currentUser.id;
  if (mine) return (
    <button onClick={() => run(true)} disabled={busy} title="Click to withdraw" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#86868B] cursor-pointer">
      <Hourglass size={12} /> Waiting for partner · Undo
    </button>
  );
  return (
    <button onClick={() => run()} disabled={busy} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-red-700 cursor-pointer">
      <Trash2 size={12} /> {purgeBy ? 'Partner agreed · Delete' : solo ? 'Delete' : 'Delete record'}
    </button>
  );
};

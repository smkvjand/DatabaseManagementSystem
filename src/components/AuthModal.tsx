import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const [mode, setMode] = useState<'' | 'pw' | 'del'>('');
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [c, setC] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const reset = (m: '' | 'pw' | 'del') => { setMode(m); setA(''); setB(''); setC(''); setMsg(''); };
  const run = async (fn: () => Promise<any>, ok: () => void) => {
    setMsg(''); setBusy(true);
    try { await fn(); ok(); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const changePw = () => {
    if (b !== c) return setMsg('Passwords do not match');
    if (b.length < 6) return setMsg('New password must be 6+ characters');
    run(() => StorageService.changePassword(a, b), () => { reset(''); setMsg('Password changed ✓'); });
  };
  const del = () => {
    if (!window.confirm('Delete your account for good? This cannot be undone.')) return;
    run(() => StorageService.deleteAccount(a), () => { logout(); onClose(); });
  };
  const inp = 'w-full px-3 py-2 text-[14px] mb-2';
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E5E5EA] shadow-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-12 h-12 rounded-full ring-1 ring-[#E5E5EA]" />
          <div>
            <div className="font-semibold text-[#161617]">{currentUser.name}</div>
            <div className="text-[12px] text-[#86868B]">{currentUser.email}</div>
            <div className="text-[11px] text-emerald-800">{currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'charity' ? 'Charity representative' : 'Student'} • {currentUser.campusDorm}</div>
          </div>
        </div>
        {mode === 'pw' && <div className="mb-3">
          <input className={inp} type="password" placeholder="Current password" value={a} onChange={(e) => setA(e.target.value)} />
          <input className={inp} type="password" placeholder="New password" value={b} onChange={(e) => setB(e.target.value)} />
          <input className={inp} type="password" placeholder="Confirm new password" value={c} onChange={(e) => setC(e.target.value)} />
          <button disabled={busy} onClick={changePw} className="w-full bg-[#161617] text-white rounded-full py-2 text-sm font-medium disabled:opacity-60 cursor-pointer">Save password</button>
        </div>}
        {mode === 'del' && <div className="mb-3">
          <p className="text-[12px] text-red-600 mb-2">Deletes your listings, wishlist and messages. Cannot be undone.</p>
          <input className={inp} type="password" placeholder="Enter password to confirm" value={a} onChange={(e) => setA(e.target.value)} />
          <button disabled={busy} onClick={del} className="w-full bg-red-600 text-white rounded-full py-2 text-sm font-medium disabled:opacity-60 cursor-pointer">Delete my account</button>
        </div>}
        {msg && <div className={`text-[13px] text-center mb-2 ${msg.endsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}>{msg}</div>}
        {mode === '' && <div className="flex gap-2 mb-2">
          <button onClick={() => reset('pw')} className="flex-1 border border-[#E5E5EA] rounded-full py-2 text-[13px] cursor-pointer">Change password</button>
          <button onClick={() => reset('del')} className="flex-1 border border-red-200 text-red-600 rounded-full py-2 text-[13px] cursor-pointer">Delete account</button>
        </div>}
        {mode !== '' && <button onClick={() => reset('')} className="w-full text-[13px] text-[#86868B] py-1 mb-1 cursor-pointer">Back</button>}
        <button onClick={() => { logout(); onClose(); }} className="w-full bg-[#161617] text-white rounded-full py-2.5 text-sm font-medium cursor-pointer">Sign out</button>
        <button onClick={onClose} className="w-full mt-2 text-[13px] text-[#86868B] py-1.5 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
};

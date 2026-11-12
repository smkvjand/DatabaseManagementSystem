import React, { useState } from 'react';
import { StorageService } from '../services/storage';

export const AuthGate: React.FC<{ onDone: () => void; onClose?: () => void; initial?: 'login' | 'register'; as?: 'charity' | 'admin' }> = ({ onDone, onClose, initial = 'login', as }) => {
  const [mode, setMode] = useState<'login' | 'register'>(as === 'admin' ? 'login' : initial);
  const [f, setF] = useState({ name: '', orgName: '', email: '', password: '', campusDorm: 'Student Union' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const reg = mode === 'register';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await StorageService.auth(mode, as === 'charity' && reg ? { ...f, accountType: 'charity' } : f);
      if (as && !reg && StorageService.getUsers().find((u) => u.id === StorageService.meId)?.role !== as) { StorageService.setToken(null); throw new Error(`This account is not a${as === 'admin' ? 'n admin' : ' charity'} account`); }
      onDone();
    }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const inp = 'w-full px-4 py-3 text-[15px]';
  const title = as === 'charity' ? (reg ? 'Register your charity' : 'Charity sign in') : as === 'admin' ? 'Admin sign in' : reg ? 'Create your account' : 'Sign in to reWear';
  const sub = as === 'charity' ? (reg ? 'You can verify your documents after signing up.' : 'For charity partners.') : as === 'admin' ? 'For reWear administrators.' : reg ? 'Join your campus wardrobe.' : 'Welcome back.';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm reveal" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-panel w-full max-w-[380px] p-8 space-y-3.5">
        <div className="pb-2 text-center">
          <div className="mx-auto mb-4 w-11 h-11 rounded-[14px] bg-[#161617] shadow-[inset_0_1px_1px_rgba(255,255,255,.35),0_8px_20px_-6px_rgba(0,0,0,.5)] flex items-center justify-center"><span className="w-3 h-3 rounded-full bg-white" /></div>
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[#161617]">{title}</h1>
          <p className="text-[14px] text-[#6e6e73] mt-1">{sub}</p>
        </div>
        {as === 'charity' && reg && <input className={inp} placeholder="Organisation name" value={f.orgName} onChange={set('orgName')} required />}
        {reg && <input className={inp} placeholder={as === 'charity' ? 'Your name (representative)' : 'Full name'} value={f.name} onChange={set('name')} required />}
        <input className={inp} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className={inp} type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={6} />
        {reg && !as && <input className={inp} placeholder="Dorm or campus location" value={f.campusDorm} onChange={set('campusDorm')} />}
        {err && <div className="text-[13px] text-red-600 text-center">{err}</div>}
        <button disabled={busy} className="w-full bg-[#161617] text-white rounded-full py-3 text-[15px] font-medium disabled:opacity-60 cursor-pointer">
          {busy ? 'One moment…' : reg ? 'Create account' : 'Continue'}
        </button>
        {as !== 'admin' && <button type="button" onClick={() => { setMode(reg ? 'login' : 'register'); setErr(''); }} className="w-full text-[13px] text-[#6e6e73] hover:text-[#161617] cursor-pointer py-1">
          {reg ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>}
        {onClose && <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full text-[#6e6e73] cursor-pointer">✕</button>}
      </form>
    </div>
  );
};

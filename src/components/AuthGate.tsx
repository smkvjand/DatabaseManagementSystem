import React, { useState } from 'react';
import { StorageService } from '../services/storage';

export const AuthGate: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '', campusDorm: 'Student Union' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await StorageService.auth(mode, f); onDone(); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const inp = 'w-full border border-[#E5E5EA] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#161617]';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xl w-full max-w-sm p-8 space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">reWear</div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#161617]">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        </div>
        {mode === 'register' && <input className={inp} placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input className={inp} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className={inp} type="password" placeholder="Password (min 6)" value={f.password} onChange={set('password')} required />
        {mode === 'register' && <input className={inp} placeholder="Campus location / dorm" value={f.campusDorm} onChange={set('campusDorm')} />}
        {err && <div className="text-[13px] text-red-600">{err}</div>}
        <button disabled={busy} className="w-full bg-[#161617] text-white rounded-full py-2.5 text-sm font-medium disabled:opacity-60 cursor-pointer">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }} className="w-full text-[13px] text-[#86868B] hover:text-[#161617] cursor-pointer">
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
        <p className="text-[11px] text-[#86868B] text-center">Demo users (after seeding): alex@campus.edu / password123</p>
      </form>
    </div>
  );
};

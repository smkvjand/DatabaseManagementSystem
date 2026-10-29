import React, { useState } from 'react';
import { StorageService } from '../services/storage';

interface AuthGateProps { onDone: () => void; initialAccount?: 'user' | 'charity'; onBack?: () => void; }

export const AuthGate: React.FC<AuthGateProps> = ({ onDone, initialAccount = 'user', onBack }) => {
  const [account, setAccount] = useState<'user' | 'charity'>(initialAccount);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '', campusDorm: 'Student Union', charityName: '', description: '', category: 'Clothing', location: '', website: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const isCharity = account === 'charity';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (isCharity) await StorageService.auth(mode === 'login' ? 'login' : 'register-charity', mode === 'login' ? { email: f.email, password: f.password, accountType: 'charity' } : f);
      else await StorageService.auth(mode, f);
      onDone();
    }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const inp = 'w-full border border-[#E5E5EA] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#161617]';
  const tab = (a: 'user' | 'charity') => `flex-1 py-2 text-[13px] font-medium rounded-full cursor-pointer ${account === a ? 'bg-[#161617] text-white' : 'text-[#86868B] hover:text-[#161617]'}`;
  const switchAccount = (a: 'user' | 'charity') => { setAccount(a); setMode('login'); setErr(''); };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xl w-full max-w-sm p-8 space-y-4">
        {onBack && <button type="button" onClick={onBack} className="text-[12px] text-[#86868B] hover:text-[#161617] cursor-pointer">← Back</button>}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">reWear</div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#161617]">
            {isCharity ? (mode === 'login' ? 'Charity login' : 'Register your charity') : mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-[#F5F5F7]">
          <button type="button" className={tab('user')} onClick={() => switchAccount('user')}>User Login</button>
          <button type="button" className={tab('charity')} onClick={() => switchAccount('charity')}>Charity Login</button>
        </div>
        {!isCharity && mode === 'register' && <input className={inp} placeholder="Full name" value={f.name} onChange={set('name')} required />}
        {isCharity && mode === 'register' && (
          <>
            <input className={inp} placeholder="Charity name" value={f.charityName} onChange={set('charityName')} required maxLength={100} />
            <textarea className={inp} placeholder="Short description of your charity" value={f.description} onChange={set('description')} required rows={3} maxLength={2000} />
            <input className={inp} placeholder="Cause (e.g. Clothing, Shelter)" value={f.category} onChange={set('category')} maxLength={50} />
            <input className={inp} placeholder="Location (city / area)" value={f.location} onChange={set('location')} maxLength={25} />
            <input className={inp} placeholder="Website (optional)" value={f.website} onChange={set('website')} maxLength={255} />
          </>
        )}
        <input className={inp} type="email" placeholder={isCharity ? 'Charity email' : 'Email'} value={f.email} onChange={set('email')} required />
        <input className={inp} type="password" placeholder="Password (min 6)" value={f.password} onChange={set('password')} required />
        {!isCharity && mode === 'register' && <input className={inp} placeholder="Campus location / dorm" value={f.campusDorm} onChange={set('campusDorm')} />}
        {err && <div className="text-[13px] text-red-600">{err}</div>}
        <button disabled={busy} className="w-full bg-[#161617] text-white rounded-full py-2.5 text-sm font-medium disabled:opacity-60 cursor-pointer">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }} className="w-full text-[13px] text-[#86868B] hover:text-[#161617] cursor-pointer">
          {mode === 'login' ? (isCharity ? 'New charity? Register' : 'New here? Create an account') : 'Have an account? Sign in'}
        </button>
        <p className="text-[11px] text-[#86868B] text-center">Demo users (after seeding): alex@campus.edu / password123</p>
      </form>
    </div>
  );
};

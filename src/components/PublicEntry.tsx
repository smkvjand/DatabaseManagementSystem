import React, { useEffect, useState } from 'react';
import { AuthGate } from './AuthGate';
import { StorageService } from '../services/storage';
import { CharityFoundation } from '../types';

type Screen = 'landing' | 'login' | 'charity-login' | 'charities';

// Shown to signed-out visitors: landing page first, then login / public charity list.
export const PublicEntry: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [screen, setScreen] = useState<Screen>('landing');
  const [charities, setCharities] = useState<CharityFoundation[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (screen !== 'charities' || charities) return;
    StorageService.fetchPublicCharities().then(setCharities).catch((e) => setError(e.message));
  }, [screen, charities]);

  if (screen === 'login') return <AuthGate onDone={onDone} initialAccount="user" onBack={() => setScreen('landing')} />;
  if (screen === 'charity-login') return <AuthGate onDone={onDone} initialAccount="charity" onBack={() => setScreen('landing')} />;

  const btn = 'px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all';
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1D1D1F]">
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => setScreen('landing')} className="font-semibold tracking-tight text-[#161617] cursor-pointer">reWear</button>
        <nav className="flex items-center gap-2">
          <button onClick={() => setScreen('charities')} className="px-3 py-2 text-[13px] text-[#86868B] hover:text-[#161617] cursor-pointer">Charities</button>
          <button onClick={() => setScreen('login')} className={`${btn} bg-[#161617] text-white hover:bg-black`}>Login / Sign In</button>
        </nav>
      </header>

      {screen === 'landing' && (
        <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
          <div className="inline-flex items-center gap-2 mb-4 text-[11px] font-semibold tracking-wider uppercase text-[#86868B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /><span>Sustainable clothing exchange</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#161617] max-w-3xl">Give clothes a second life.</h1>
          <p className="mt-4 text-[16px] text-[#86868B] max-w-xl leading-relaxed">
            reWear is a campus marketplace to buy, swap and donate pre-loved clothing. Keep garments in circulation, cut textile waste, and support charities that put clothes back to use.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setScreen('login')} className={`${btn} bg-[#161617] text-white hover:bg-black`}>Login / Sign In</button>
            <button onClick={() => setScreen('charities')} className={`${btn} border border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7]`}>Explore Charities</button>
            <button onClick={() => setScreen('charity-login')} className={`${btn} text-[#86868B] hover:text-[#161617]`}>Charity Login</button>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[['Buy & Sell', 'Find quality second-hand pieces from students on campus.'], ['Swap', 'Trade items you no longer wear for ones you will.'], ['Donate', 'Support charities that receive and distribute clothing.']].map(([t, d]) => (
              <div key={t} className="p-6 rounded-2xl bg-white border border-[#E5E5EA]">
                <h3 className="font-semibold text-[15px] text-[#161617]">{t}</h3>
                <p className="mt-1 text-[13px] text-[#86868B] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {screen === 'charities' && (
        <main className="max-w-6xl mx-auto px-6 pt-10 pb-24">
          <h1 className="text-3xl font-semibold tracking-tight text-[#161617]">Charities on reWear</h1>
          <p className="mt-1.5 text-[14px] text-[#86868B]">Sign in to message a charity.</p>
          {error && <p className="mt-6 text-[13px] text-red-600">{error}</p>}
          {charities && !charities.length && <p className="mt-8 text-[13px] text-[#86868B]">No charities yet. Check back soon.</p>}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {(charities || []).map((c) => (
              <div key={c.id} className="p-6 rounded-2xl bg-white border border-[#E5E5EA]">
                <div className="flex items-center gap-3 mb-3">
                  <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-xl ring-1 ring-[#E5E5EA]" />
                  <div>
                    <h3 className="font-semibold text-[15px] text-[#161617] leading-tight">{c.name}</h3>
                    <span className="text-[11px] text-[#86868B]">{[c.category, c.location].filter(Boolean).join(' • ')}</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#414844] leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen('login')} className={`${btn} mt-10 bg-[#161617] text-white hover:bg-black`}>Login / Sign In</button>
        </main>
      )}
    </div>
  );
};

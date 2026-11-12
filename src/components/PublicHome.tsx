import React, { useState } from 'react';
import { AuthGate } from './AuthGate';

const HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuAHBwC1IeWAu1MAtkCdOAT_E7sJRGMjoNb1Up7EmUJm7VCdy_GI9b8XzEm5JDI6sSimqAZ3ZcFn8AnD-i9sP7K6kvrykSIxEetwKO2yZw9BHAGOHgrRwQpADYtujvRe8Qn7CPqemPe_KPJOYoHlTIcTgtd6NBESrgK2vst7NW1oFQY9QanJZ1VETDM78aAkOx_WNsPO9GPbUfKJMqKj7rXZsn2HW65wv4-YCTcwj6Vb7BMxmiXYaP7l";

export const PublicHome: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [auth, setAuth] = useState<null | 'login' | 'register' | 'charity' | 'admin'>(null);
  const open = (m: 'login' | 'register' | 'charity' | 'admin') => () => setAuth(m);
  const pillars = [
    ['01 / Peer thrift', 'Buy pre-loved', 'Student wardrobes at fair prices. Walk up and collect between classes.'],
    ['02 / Zero cash', 'Swap clothes', 'Closet-to-closet trades. Clear space without opening your wallet.'],
    ['03 / Giving back', 'Donate for good', 'Drop-offs routed to verified campus clothing banks and local shelters.'],
  ];
  return (
    <div className="min-h-screen flex flex-col text-[#1D1D1F]">
      <header className="glass fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.04em]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#161617]" />reWear
          </div>
          <div className="flex items-center gap-2">
            <button onClick={open('charity')} className="hidden sm:block px-4 py-1.5 rounded-full text-[13px] font-medium text-[#6e6e73] cursor-pointer">Charity login</button>
            <button onClick={open('admin')} className="hidden sm:block px-4 py-1.5 rounded-full text-[13px] font-medium text-[#6e6e73] cursor-pointer">Admin login</button>
            <button onClick={open('login')} className="px-4 py-1.5 rounded-full text-[13px] font-medium cursor-pointer">Sign in</button>
            <button onClick={open('register')} className="px-4 py-1.5 rounded-full bg-[#161617] text-white text-[13px] font-medium cursor-pointer">Get started</button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <div className="mb-4 text-[12px] font-medium tracking-wide text-[#6e6e73] uppercase reveal">Campus Circular Wardrobe</div>
            <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)] text-[#161617] text-balance reveal reveal-1">Good clothes deserve another life.</h1>
            <p className="mt-6 text-lg sm:text-xl text-[#6e6e73] max-w-xl text-balance reveal reveal-2">A student marketplace to buy, swap, and donate pre-loved clothing across campus.</p>
            <div className="mt-9 flex items-center gap-3 reveal reveal-3">
              <button onClick={open('register')} className="px-6 py-3 rounded-full bg-[#161617] text-white text-[14px] font-medium cursor-pointer">Get started</button>
              <button onClick={open('login')} className="px-6 py-3 rounded-full text-[14px] font-medium cursor-pointer">Sign in</button>
            </div>
          </div>
          <div className="mt-14 sm:mt-20 relative w-full aspect-[16/9] rounded-[28px] overflow-hidden ring-1 ring-black/5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)] bg-[#F5F5F7] reveal reveal-4">
            <img src={HERO} alt="Two students in second-hand clothing on campus" className="w-full h-full object-cover settle" />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-5 scroll-reveal">
          {pillars.map(([k, t, d]) => (
            <div key={t} onClick={open('register')} className="glass-panel lift p-8 cursor-pointer">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e73] mb-2">{k}</div>
              <h3 className="font-display text-3xl text-[#161617]">{t}</h3>
              <p className="mt-3 text-[15px] text-[#6e6e73] leading-relaxed">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-8 text-center text-[12px] text-[#86868B]">© reWear · Made for campus · <button onClick={open('charity')} className="underline cursor-pointer">Charity login</button> · <button onClick={open('admin')} className="underline cursor-pointer">Admin login</button></footer>
      {auth && <AuthGate initial={auth === 'register' ? 'register' : 'login'} as={auth === 'charity' || auth === 'admin' ? auth : undefined} onDone={onDone} onClose={() => setAuth(null)} />}
    </div>
  );
};

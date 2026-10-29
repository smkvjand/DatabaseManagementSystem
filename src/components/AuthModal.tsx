import React from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  if (!isOpen) return null;
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
        <button onClick={() => { logout(); onClose(); }} className="w-full bg-[#161617] text-white rounded-full py-2.5 text-sm font-medium cursor-pointer">Sign out</button>
        <button onClick={onClose} className="w-full mt-2 text-[13px] text-[#86868B] py-1.5 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
};

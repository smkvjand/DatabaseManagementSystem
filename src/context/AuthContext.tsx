import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { AuthGate } from '../components/AuthGate';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  updateCurrentUserRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<User>) => void;
  logout: () => void;
  isAdmin: boolean;
  isDonor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'anon' | 'ready'>(StorageService.token ? 'loading' : 'anon');
  const [users, setUsers] = useState<User[]>([]);
  const [meId, setMeId] = useState('');

  const sync = useCallback(() => { setUsers(StorageService.getUsers()); setMeId(StorageService.meId); }, []);

  const enter = useCallback(() => { sync(); setStatus('ready'); }, [sync]);

  useEffect(() => {
    if (!StorageService.token) return;
    StorageService.load().then(enter).catch(() => { StorageService.setToken(null); setStatus('anon'); });
  }, [enter]);

  useEffect(() => (status === 'ready' ? StorageService.subscribe(sync) : undefined), [status, sync]);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-[#86868B] text-sm">Connecting to reWear database…</div>;
  if (status === 'anon') return <AuthGate onDone={enter} />;

  const currentUser = users.find((u) => u.id === meId) || users[0];
  const logout = () => { StorageService.setToken(null); setStatus('anon'); };

  return (
    <AuthContext.Provider
      value={{
        currentUser, allUsers: users, logout,
        switchUser: () => {}, updateCurrentUserRole: () => {},
        updateProfile: (u) => { StorageService.updateUser({ id: currentUser.id, ...u }); sync(); },
        isAdmin: currentUser.role === 'admin', isDonor: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

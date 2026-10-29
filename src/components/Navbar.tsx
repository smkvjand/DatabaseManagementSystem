import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenListItem: () => void;
  onOpenPreferences: () => void;
  onOpenAuthModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenListItem,
  onOpenPreferences,
  onOpenAuthModal,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { wishlistCount, notifications } = useData();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#E5E5EA] transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Left: Brand & Nav Items */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group tracking-tight text-[#161617] font-medium text-lg hover:opacity-75 transition-opacity focus:outline-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#161617] inline-block" />
            <span className="tracking-[-0.03em] font-semibold">reWear</span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] tracking-normal font-normal text-[#86868B]">
            <button
              onClick={() => onNavigate('browse-clothes')}
              className={`transition-colors relative py-1 focus:outline-none ${
                currentPath === 'browse-clothes'
                  ? 'text-[#161617] font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#161617]'
                  : 'hover:text-[#161617]'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('exchanges')}
              className={`transition-colors relative py-1 focus:outline-none ${
                currentPath === 'exchanges'
                  ? 'text-[#161617] font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#161617]'
                  : 'hover:text-[#161617]'
              }`}
            >
              Exchange
            </button>
            <button
              onClick={() => onNavigate('charity')}
              className={`transition-colors relative py-1 focus:outline-none ${
                currentPath === 'charity'
                  ? 'text-[#161617] font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#161617]'
                  : 'hover:text-[#161617]'
              }`}
            >
              Charity
            </button>
            <button
              onClick={() => onNavigate('messages')}
              className={`transition-colors relative py-1 focus:outline-none ${
                currentPath === 'messages'
                  ? 'text-[#161617] font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#161617]'
                  : 'hover:text-[#161617]'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => onNavigate('my-wishlist')}
              className={`hover:text-[#161617] transition-colors flex items-center gap-1.5 focus:outline-none ${
                currentPath === 'my-wishlist' ? 'text-[#161617] font-medium' : ''
              }`}
            >
              <span>Wishlist</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#F5F5F7] text-[#161617] font-medium border border-[#E5E5EA]">
                {wishlistCount}
              </span>
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`transition-colors relative py-1 text-emerald-800 font-medium flex items-center gap-1 ${
                  currentPath === 'admin'
                    ? 'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-emerald-800'
                    : 'hover:text-emerald-950'
                }`}
              >
                <span>Admin Council</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-4">
          {/* Quiet Search Pill */}
          <div className="relative hidden sm:flex items-center">
            <span className="material-symbols-outlined text-[17px] text-[#86868B] absolute left-3 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentPath !== 'browse-clothes') {
                  onNavigate('browse-clothes');
                }
              }}
              placeholder="Search campus dorms, brands..."
              className="w-52 md:w-64 pl-8 pr-3 py-1.5 text-[12px] bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border border-[#E5E5EA]/70 rounded-full text-[#161617] placeholder:text-[#86868B]/70 focus:outline-none focus:border-[#161617] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#86868B] hover:text-[#161617] text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean Dark Pill Button */}
          <button
            onClick={onOpenListItem}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#161617] text-white text-[12px] font-medium tracking-tight hover:bg-black/85 transition-all active:scale-[0.98]"
          >
            <span>List an item</span>
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center focus:outline-none ml-1 group relative"
              aria-label="User profile options"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-[#E5E5EA] group-hover:ring-[#161617] transition-all"
              />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-3 w-72 rounded-2xl bg-white border border-[#E5E5EA] shadow-xl p-3 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Identity Header */}
                <div className="pb-3 mb-2 border-b border-[#F2F2F7]">
                  <div className="font-semibold text-[#161617]">{currentUser.name}</div>
                  <div className="text-[12px] text-[#86868B]">{currentUser.email}</div>
                  <div className="text-[11px] text-emerald-800 font-medium mt-1">
                    {currentUser.campusDorm} • {currentUser.ecoPoints} Eco Points
                  </div>
                </div>


                {/* Dropdown Menu Items */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#161617] flex items-center justify-between"
                  >
                    <span>My Campus Profile & Wardrobe</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('exchanges');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#161617] flex items-center justify-between"
                  >
                    <span>Dorm Swaps & Trades</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenPreferences();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#161617] flex items-center justify-between"
                  >
                    <span>Shopping & Eco Preferences</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 font-medium flex items-center justify-between"
                    >
                      <span>Admin Management Console</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#161617]"
                  >
                    <span>Account / Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-[#161617] focus:outline-none"
            aria-label="Open mobile menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Flyout */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF9F6] border-b border-[#E5E5EA] px-6 py-4 space-y-3">
          <div className="relative mb-3">
            <span className="material-symbols-outlined text-[17px] text-[#86868B] absolute left-3 top-2.5">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onNavigate('browse-clothes');
              }}
              placeholder="Search campus dorms, brands..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E5EA] rounded-full text-[#161617]"
            />
          </div>
          <button
            onClick={() => {
              onNavigate('browse-clothes');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-[#161617]"
          >
            Explore Catalog
          </button>
          <button
            onClick={() => {
              onNavigate('exchanges');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-[#161617]"
          >
            Dorm Exchanges
          </button>
          <button
            onClick={() => {
              onNavigate('charity');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-[#161617]"
          >
            Charity Bins
          </button>
          <button
            onClick={() => {
              onNavigate('my-wishlist');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-[#161617]"
          >
            Wishlist ({wishlistCount})
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 font-medium text-emerald-800"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={() => {
              onNavigate('profile');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-[#161617]"
          >
            My Profile
          </button>
        </div>
      )}
    </header>
  );
};

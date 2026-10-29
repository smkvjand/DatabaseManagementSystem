import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '28/30', '30/32', '31', '32/32', '34/32'];
const AVAILABLE_CATEGORIES = ['Outerwear', 'Denim', 'Knitwear', 'Tops', 'Dresses'];
const CAMPUS_HUBS = [
  'North Hall',
  'Student Union',
  'East Dorms',
  'South Campus',
  'Central Library',
  'Engineering Quad',
  'West Quad',
];

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const currentPref = StorageService.getPreference(currentUser.id);

  const [preferredSizes, setPreferredSizes] = useState<string[]>(currentPref.preferredSizes || ['M']);
  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    currentPref.preferredCategories || ['Outerwear']
  );
  const [primaryHub, setPrimaryHub] = useState<string>(
    currentPref.preferredHubs?.[0] || 'Student Union'
  );
  const [notificationEmail, setNotificationEmail] = useState<boolean>(currentPref.notificationEmail ?? true);
  const [notificationTrades, setNotificationTrades] = useState<boolean>(currentPref.notificationTrades ?? true);
  const [ecoGoalKg, setEcoGoalKg] = useState<number>(currentPref.ecoGoalKg || 20);
  const [budgetMax, setBudgetMax] = useState<number>(currentPref.budgetMax || 50);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const toggleSize = (sz: string) => {
    if (preferredSizes.includes(sz)) {
      setPreferredSizes(preferredSizes.filter((s) => s !== sz));
    } else {
      setPreferredSizes([...preferredSizes, sz]);
    }
  };

  const toggleCategory = (cat: string) => {
    if (preferredCategories.includes(cat)) {
      setPreferredCategories(preferredCategories.filter((c) => c !== cat));
    } else {
      setPreferredCategories([...preferredCategories, cat]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updatePreference(currentUser.id, {
      preferredSizes,
      preferredCategories,
      preferredHubs: [primaryHub],
      notificationEmail,
      notificationTrades,
      ecoGoalKg: Number(ecoGoalKg),
      budgetMax: Number(budgetMax),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#E5E5EA] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#161617] hover:bg-[#E5E5EA] cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Personalization
          </div>
          <h2 className="text-2xl font-semibold text-[#161617] tracking-tight">
            Shopping & Eco Preferences
          </h2>
          <p className="text-[13px] text-[#86868B] mt-0.5">
            Customize your circular wardrobe feed, dorm location, and semester impact goals.
          </p>
        </div>

        {saved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-[13px] font-medium text-center">
            ✓ Preferences saved!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-[13px]">
          {/* Preferred Sizes */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-2">
              My Garment Sizes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SIZES.map((sz) => {
                const isSelected = preferredSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#161617] text-white shadow-xs'
                        : 'bg-[#F5F5F7] text-[#161617] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Categories */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-2">
              Favorite Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = preferredCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B4332] text-white shadow-xs'
                        : 'bg-[#F5F5F7] text-[#161617] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Campus Hub */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
              Primary Campus Dorm / Pickup Hub
            </label>
            <select
              value={primaryHub}
              onChange={(e) => setPrimaryHub(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
            >
              {CAMPUS_HUBS.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Impact Goal & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Semester Eco Goal (kg)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={ecoGoalKg}
                onChange={(e) => setEcoGoalKg(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Max Thrift Budget ($)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="pt-3 border-t border-[#F2F2F7] space-y-3">
            <div className="text-[11px] uppercase font-semibold text-[#86868B]">
              Alerts & Trade Notifications
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationTrades}
                onChange={(e) => setNotificationTrades(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800"
              />
              <span className="text-[#161617]">Notify me immediately when a classmate proposes a 1:1 trade</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800"
              />
              <span className="text-[#161617]">Send weekly digest of newly listed pieces in my sizes</span>
            </label>
          </div>

          <div className="pt-4 border-t border-[#F2F2F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#161617] text-white hover:bg-black font-medium transition-all shadow-xs cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

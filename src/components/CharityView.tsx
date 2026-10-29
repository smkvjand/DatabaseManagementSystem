import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { DropBoxLocation, CharityFoundation } from '../types';

interface CharityViewProps {
  onOpenDonationModal: (preselectedBoxId?: string, preselectedCharityId?: string) => void;
  onOpenImpactReport: () => void;
  onMessageCharity?: (hostUserId?: string) => void;
}

export const CharityView: React.FC<CharityViewProps> = ({
  onOpenDonationModal,
  onOpenImpactReport,
  onMessageCharity,
}) => {
  const { currentUser, isCharityHost } = useAuth();
  const { dropBoxes, charities, impactReport, donations } = useData();
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const filteredBoxes = dropBoxes.filter((box) => {
    if (selectedZone === 'all') return true;
    return box.campusZone.toLowerCase().includes(selectedZone.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E5E5EA]">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[#86868B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Giving Back To Campus & Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
            Charity Bins & Foundations
          </h1>
          <p className="mt-1.5 text-[14px] text-[#86868B] max-w-xl">
            Streamlined drop-offs routed directly to verified university student clothing banks and local shelters. Managed by the Student Sustainability Council.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenDonationModal()}
            className="px-5 py-2.5 rounded-full bg-[#1B4332] text-white text-[12px] font-medium tracking-tight hover:bg-[#123124] transition-all shadow-xs cursor-pointer"
          >
            Log a Drop-off Donation
          </button>
          <button
            onClick={onOpenImpactReport}
            className="px-4 py-2.5 rounded-full border border-[#E5E5EA] text-[#161617] text-[12px] font-medium hover:bg-[#F5F5F7] transition-all cursor-pointer"
          >
            View Council Audit
          </button>
        </div>
      </div>

      {/* Semester Milestone Banner */}
      <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-[#161617] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Real-Time Campus Metric
          </span>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1 text-white">
            {impactReport.textileWasteKgDiverted.toLocaleString()} kg diverted across {dropBoxes.length} campus bins.
          </h3>
          <p className="text-[13px] text-white/70 mt-1 max-w-lg">
            Every garment logged directly increments the council dashboard and is sorted for emergency coat drives or student pantry access.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 rounded-xl bg-white/10 text-center min-w-[110px]">
            <div className="text-2xl font-bold">{donations.length + 88}</div>
            <div className="text-[10px] text-white/70 uppercase font-medium">Verified Drops</div>
          </div>
          <div className="p-3 rounded-xl bg-white/10 text-center min-w-[110px]">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-[10px] text-white/70 uppercase font-medium">Free To Students</div>
          </div>
        </div>
      </div>

      {/* Section: 8 Campus Drop-off Bins */}
      <div className="mt-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#161617]">
              Campus Drop-Off Bins
            </h2>
            <p className="text-[13px] text-[#86868B] mt-0.5">
              Secure, keycard-monitored bins with live fill capacity sensors.
            </p>
          </div>

          {/* Zone Filter */}
          <div className="flex items-center gap-1.5 text-[12px] overflow-x-auto pb-1">
            {['all', 'North', 'Central', 'East', 'South', 'West'].map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  selectedZone === zone
                    ? 'bg-[#161617] text-white font-medium'
                    : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#161617]'
                }`}
              >
                {zone === 'all' ? 'All Campus' : `${zone} Zone`}
              </button>
            ))}
          </div>
        </div>

        {/* Bins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBoxes.map((box) => (
            <div
              key={box.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between hover:border-[#161617]/40 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#86868B] mb-2 font-medium">
                  <span className="uppercase tracking-wider">{box.campusZone}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    Active
                  </span>
                </div>

                <h4 className="font-semibold text-[15px] text-[#161617] tracking-tight">
                  {box.name}
                </h4>
                <div className="text-[12px] text-[#414844] mt-1 font-medium">
                  {box.buildingName}
                </div>
                <div className="text-[11px] text-[#86868B] mt-0.5">
                  {box.floorLocation}
                </div>

                {/* Fill Capacity Bar */}
                <div className="mt-5 pt-3 border-t border-[#F2F2F7]">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                    <span className="text-[#86868B]">Bin Capacity</span>
                    <span
                      className={
                        box.currentFillPercent > 80
                          ? 'text-amber-700 font-semibold'
                          : 'text-emerald-700 font-semibold'
                      }
                    >
                      {box.currentFillPercent}% Full
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        box.currentFillPercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${box.currentFillPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Total Diverted:</span>
                  <span className="font-medium text-[#161617]">{box.totalKgCollected} kg</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => onOpenDonationModal(box.id)}
                  className="w-full py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] text-[#161617] hover:bg-[#161617] hover:text-white transition-all text-[12px] font-medium cursor-pointer"
                >
                  Drop Off at this Bin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charity host panel: only for accounts signed in via Charity Login */}
      {isCharityHost && <CharityHostPanel charity={charities.find((c) => c.hostUserId === currentUser.id)} />}

      {/* Section: Partner Charity Foundations */}
      <div className="mt-16">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#161617] mb-1">
          Verified Charity Foundations
        </h2>
        <p className="text-[13px] text-[#86868B] mb-6">
          Organizations that receive, sort, and distribute clothing directly to students and local shelter programs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {charities.map((charity) => (
            <div
              key={charity.id}
              className="p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={charity.logoUrl}
                    alt={charity.name}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-[#E5E5EA]"
                  />
                  <div>
                    <h3 className="font-semibold text-[15px] text-[#161617] leading-tight">
                      {charity.name}
                    </h3>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      ✓ University Verified
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-[#414844] leading-relaxed mb-4">
                  {charity.description}
                </p>

                <div className="p-3 rounded-xl bg-[#FAF9F6] text-[12px] space-y-1 mb-4">
                  <div className="font-medium text-[#161617]">Current Campaign:</div>
                  <div className="text-[#86868B]">{charity.activeCampaign}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2F2F7] flex items-center justify-between text-[12px]">
                <span className="text-[#86868B]">Total Received:</span>
                <span className="font-semibold text-emerald-800">
                  {charity.totalKgReceived} kg
                </span>
              </div>
              {onMessageCharity && charity.hostUserId && charity.hostUserId !== currentUser.id && (
                <button
                  onClick={() => onMessageCharity(charity.hostUserId)}
                  className="mt-4 w-full py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] text-[#161617] hover:bg-[#161617] hover:text-white transition-all text-[12px] font-medium cursor-pointer"
                >
                  Message Charity
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Edit the public profile of the charity hosted by the signed-in charity account.
const CharityHostPanel: React.FC<{ charity?: CharityFoundation }> = ({ charity }) => {
  const [f, setF] = useState({ name: charity?.name || '', description: charity?.description || '', category: charity?.category || '', location: charity?.location || '', contactEmail: charity?.contactEmail || '' });
  const [msg, setMsg] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const inp = 'w-full border border-[#E5E5EA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#161617]';
  if (!charity) return null;
  const save = async () => { setMsg(''); try { await StorageService.updateCharity(f); setMsg('Saved'); } catch { /* alert shown by storage layer */ } };
  return (
    <div className="mt-12 p-6 rounded-2xl bg-white border border-[#E5E5EA]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Charity host</div>
      <h2 className="text-lg font-semibold text-[#161617] mb-4">Manage your charity profile</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inp} placeholder="Name" value={f.name} onChange={set('name')} />
        <input className={inp} placeholder="Cause" value={f.category} onChange={set('category')} />
        <input className={inp} placeholder="Location" value={f.location} onChange={set('location')} />
        <input className={inp} placeholder="Contact email" value={f.contactEmail} onChange={set('contactEmail')} />
        <textarea className={`${inp} md:col-span-2`} rows={3} placeholder="Description" value={f.description} onChange={set('description')} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} className="px-5 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium cursor-pointer">Save profile</button>
        {msg && <span className="text-[12px] text-emerald-800">{msg}</span>}
      </div>
    </div>
  );
};

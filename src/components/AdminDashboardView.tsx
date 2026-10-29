import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Listing, Donation, DropBoxLocation, User } from '../types';

interface AdminDashboardViewProps {
  onNavigate: (path: string) => void;
  onOpenImpactReport: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  onOpenImpactReport,
}) => {
  const { currentUser, allUsers, updateCurrentUserRole } = useAuth();
  const {
    listings,
    donations,
    dropBoxes,
    impactReport,
    updateListing,
    deleteListing,
    verifyDonation,
    updateDropBox,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'donations' | 'dropboxes' | 'users'>('overview');
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessNote(msg);
    setTimeout(() => setSuccessNote(null), 3000);
  };

  const handleToggleFeatured = (listing: Listing) => {
    updateListing(listing.id, { featured: !listing.featured });
    showNotification(`Listing "${listing.clothingItem?.title}" featured status updated.`);
  };

  const handleVerifyDonation = (donationId: string, currentWeight: number) => {
    verifyDonation(donationId, currentWeight);
    showNotification(`Donation verified and weight (${currentWeight} kg) audited for council report.`);
  };

  const handleEmptyBox = (boxId: string) => {
    updateDropBox(boxId, {
      currentFillPercent: 0,
      lastEmptiedDate: new Date().toISOString(),
    });
    showNotification('Drop box emptied and collection logged.');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E5EA]">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Role-Based Access Control • Council Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
            Student Sustainability Council Console
          </h1>
          <p className="mt-1.5 text-[14px] text-[#86868B] max-w-xl">
            Administrative governance over campus listings, 8 drop-off bins, donation verifications, and verified circular metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImpactReport}
            className="px-4 py-2 rounded-full border border-[#E5E5EA] text-[#161617] text-[12px] font-medium hover:bg-[#F5F5F7] cursor-pointer"
          >
            Audit Report Preview
          </button>
        </div>
      </div>

      {successNote && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[13px] font-medium animate-in fade-in">
          ✓ {successNote}
        </div>
      )}

      {/* Admin KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <span className="text-[11px] uppercase font-semibold text-[#86868B]">Diverted Textile</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {impactReport.textileWasteKgDiverted.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-[#86868B] mt-0.5">Semester Milestone</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <span className="text-[11px] uppercase font-semibold text-[#86868B]">Active Listings</span>
          <div className="text-2xl font-bold text-[#161617] mt-1">{listings.length}</div>
          <div className="text-[11px] text-[#86868B] mt-0.5">Campus Catalog</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <span className="text-[11px] uppercase font-semibold text-[#86868B]">Drop-Off Bins</span>
          <div className="text-2xl font-bold text-[#161617] mt-1">
            {dropBoxes.filter((b) => b.active).length}
          </div>
          <div className="text-[11px] text-[#86868B] mt-0.5">Campus-wide Sensors</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <span className="text-[11px] uppercase font-semibold text-[#86868B]">Registered Users</span>
          <div className="text-2xl font-bold text-[#161617] mt-1">{allUsers.length}</div>
          <div className="text-[11px] text-[#86868B] mt-0.5">Active Student Accounts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-[#E5E5EA] pb-3 text-[13px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Overview & Audit
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'listings'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Listing Moderation ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'donations'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Verify Donations ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('dropboxes')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'dropboxes'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Drop Bins Sensors ({dropBoxes.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          User Roles ({allUsers.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-8">
        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E5EA]">
              <h3 className="font-semibold text-lg text-[#161617] mb-2">
                Campus Circular Protocol Status
              </h3>
              <p className="text-[13px] text-[#414844] leading-relaxed max-w-2xl">
                The Student Sustainability Council audits clothing items to guarantee fabric hygiene, prevent commercial spam, and ensure fair campus exchange. Verified donations are routed directly to the Campus Student Clothing Bank and the Winter Coat Drive.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-[12px]">
                <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                  <span className="text-[#86868B] block">Sorting Frequency</span>
                  <span className="font-semibold text-[#161617]">Twice weekly (Tue / Thu)</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                  <span className="text-[#86868B] block">Keycard Monitored Bins</span>
                  <span className="font-semibold text-emerald-800">8 of 8 Active</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E5E5EA]">
                  <span className="text-[#86868B] block">Active Council Admin</span>
                  <span className="font-semibold text-[#161617]">{currentUser.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Listings Moderation */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#F5F5F7] text-[11px] uppercase font-semibold text-[#86868B] border-b border-[#E5E5EA]">
                  <tr>
                    <th className="px-5 py-3">Garment</th>
                    <th className="px-4 py-3">Brand & Size</th>
                    <th className="px-4 py-3">Type / Price</th>
                    <th className="px-4 py-3">Hub</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7]">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3 font-medium text-[#161617] flex items-center gap-3">
                        <img
                          src={l.clothingItem?.images[0]}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-[#F5F5F7]"
                        />
                        <div>
                          <div>{l.clothingItem?.title}</div>
                          <div className="text-[11px] text-[#86868B]">ID: {l.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#414844]">
                        {l.clothingItem?.brand} • {l.clothingItem?.size}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#161617]">
                        {l.listingType === 'buy' ? `$${l.price}` : l.listingType === 'swap' ? 'Swap' : 'Donation'}
                      </td>
                      <td className="px-4 py-3 text-[#86868B]">{l.campusHub}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleToggleFeatured(l)}
                          className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            l.featured ? 'bg-amber-100 text-amber-900' : 'bg-[#F5F5F7] text-[#161617]'
                          }`}
                        >
                          {l.featured ? 'Featured ★' : 'Feature'}
                        </button>
                        <button
                          onClick={() => deleteListing(l.id)}
                          className="px-3 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Verify Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {donations.map((don) => (
              <div
                key={don.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[12px] font-bold text-emerald-800">
                      {don.donationCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        don.status === 'verified_by_council'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {don.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[#161617] text-[14px]">
                    {don.clothingItem?.title} ({don.weightKg} kg)
                  </h4>
                  <p className="text-[12px] text-[#86868B] mt-0.5">
                    Drop-box: {don.dropBox?.name} • Charity Destination: {don.charity?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {don.status !== 'verified_by_council' ? (
                    <button
                      onClick={() => handleVerifyDonation(don.id, don.weightKg)}
                      className="px-4 py-2 rounded-full bg-emerald-800 text-white text-[12px] font-medium hover:bg-emerald-900 cursor-pointer"
                    >
                      Audit & Verify Weight
                    </button>
                  ) : (
                    <span className="text-[12px] text-emerald-800 font-medium">
                      ✓ Council Audited
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Drop Box Management */}
        {activeTab === 'dropboxes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dropBoxes.map((box) => (
              <div
                key={box.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#86868B] mb-1">
                    <span>{box.campusZone}</span>
                    <span className="font-bold text-[#161617]">{box.currentFillPercent}% Full</span>
                  </div>
                  <h4 className="font-semibold text-[#161617] text-[15px]">{box.name}</h4>
                  <p className="text-[11px] text-[#86868B] mt-0.5">{box.buildingName}</p>

                  <div className="mt-3 text-[12px] text-[#414844]">
                    Total Collected: <strong>{box.totalKgCollected} kg</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F2F2F7]">
                  <button
                    onClick={() => handleEmptyBox(box.id)}
                    className="w-full py-1.5 rounded-lg border border-[#E5E5EA] text-[12px] font-medium text-[#161617] hover:bg-[#F5F5F7] cursor-pointer"
                  >
                    Log Weekly Emptying (0%)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. User Roles */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F5F5F7] text-[11px] uppercase font-semibold text-[#86868B]">
                <tr>
                  <th className="px-5 py-3">Student / User</th>
                  <th className="px-4 py-3">Email & Dorm</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Eco Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF9F6]">
                    <td className="px-5 py-3 font-medium text-[#161617] flex items-center gap-3">
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-[#E5E5EA]"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#414844]">
                      {u.email} ({u.campusDorm})
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#161617] text-white">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-800">{u.ecoPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

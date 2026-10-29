import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Donation } from '../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBoxId?: string;
  preselectedCharityId?: string;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  preselectedBoxId,
  preselectedCharityId,
}) => {
  const { currentUser } = useAuth();
  const { dropBoxes, charities, createDonation, createListing } = useData();

  const [charityId, setCharityId] = useState(preselectedCharityId || charities[0]?.id || 'charity-1');
  const [boxId, setBoxId] = useState(preselectedBoxId || dropBoxes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('Size M');
  const [weightKg, setWeightKg] = useState(0.8);
  const [notes, setNotes] = useState('');
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create clothing item record
    const clothListing = await createListing(
      {
        ownerId: currentUser.id,
        title: title.trim() || 'Pre-loved Campus Donation',
        description: notes || 'Direct student donation to campus charity bin.',
        brand: brand.trim() || 'Quality Pre-Loved',
        categoryId: 'cat-outerwear',
        size,
        condition: 'Gently Used',
        material: 'Mixed Fabrics',
        color: 'Assorted',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBRXuRzD65I3op0H9v4akNpMD-pYCI8h_zH9xifpEGv8MKAEmk7k8XFkDM6QnHsQers000Wz28ovX-eC8Q7YQzLmVeL6Wq4Ux4BGoYmgVN2G3bG1poZkdhJq5bt1kzPFD5kE5PjGXnmxuuiV5teSWksjUB2P3fEETai9Jr-BKq_gbWT24xetP1Kiqjnk2QXSymNzgUKixj6SiwosDVhAiIJRAyLUu8A0v3uxWvmWJaDJn8jr_4qClgA'],
        estimatedRetailPrice: 65,
        weightKg: Number(weightKg) || 0.8,
      },
      {
        listingType: 'donate',
        price: 0,
        campusHub: dropBoxes.find((b) => b.id === boxId)?.name || 'Campus Box',
      }
    );

    const donation = await createDonation({
      clothingItemId: clothListing.clothingItemId,
      charityFoundationId: charityId,
      dropBoxId: boxId,
      weightKg: Number(weightKg) || 0.8,
      notes,
    });

    setCreatedDonation(donation);
  };

  const selectedBox = dropBoxes.find((b) => b.id === boxId);
  const selectedCharity = charities.find((c) => c.id === charityId);

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

        {!createdDonation ? (
          <div>
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Giving Back
              </div>
              <h2 className="text-2xl font-semibold text-[#161617] tracking-tight">
                Log a Drop-Off Donation
              </h2>
              <p className="text-[13px] text-[#86868B] mt-0.5">
                Drop your garments into any campus bin. Sorted weekly for student welfare.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
              {/* Select Charity Foundation */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Recipient Foundation
                </label>
                <select
                  value={charityId}
                  onChange={(e) => setCharityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white font-medium"
                >
                  {charities.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Drop-off Box */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Designated Campus Drop-Off Bin
                </label>
                <select
                  value={boxId}
                  onChange={(e) => setBoxId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white font-medium"
                >
                  {dropBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name} — {box.buildingName} ({box.campusZone})
                    </option>
                  ))}
                </select>
                {selectedBox && (
                  <div className="text-[11px] text-[#86868B] mt-1 pl-1">
                    Location: {selectedBox.floorLocation} • Access: {selectedBox.hours}
                  </div>
                )}
              </div>

              {/* Garment Title & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winter Parka, Denim"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Columbia, Gap..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                    required
                  />
                </div>
              </div>

              {/* Size & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                    Est. Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Donation Note / Details
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Freshly washed, no tears, heavy fleece lining..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                />
              </div>

              <div className="pt-3 border-t border-[#F2F2F7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-full border border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#1B4332] text-white hover:bg-[#123124] font-medium transition-all shadow-xs cursor-pointer"
                >
                  Log Drop-off Code
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[30px]">volunteer_activism</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#161617] tracking-tight">
              Donation Logged!
            </h3>
            <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-800 uppercase font-bold tracking-wider block">
                Official Drop-off Verification Code
              </span>
              <span className="font-mono text-xl font-extrabold text-emerald-950">
                {createdDonation.donationCode}
              </span>
            </div>

            <p className="text-[13px] text-[#414844] mt-3">
              Place the garment in <strong>{selectedBox?.name}</strong> at <strong>{selectedBox?.buildingName}</strong>.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-[#FAF9F6] text-[12px] text-left space-y-1">
              <div>Destination: {selectedCharity?.name}</div>
              <div>Estimated Weight: {createdDonation.weightKg} kg added to campus milestone</div>
              <div>Status: Registered with Student Sustainability Council</div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium hover:bg-black transition-all cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

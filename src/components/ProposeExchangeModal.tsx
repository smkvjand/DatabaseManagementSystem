import React, { useState } from 'react';
import { Listing, ClothingItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface ProposeExchangeModalProps {
  targetListing: Listing | null;
  onClose: () => void;
  onExchangeProposed: () => void;
}

export const ProposeExchangeModal: React.FC<ProposeExchangeModalProps> = ({
  targetListing,
  onClose,
  onExchangeProposed,
}) => {
  const { currentUser } = useAuth();
  const { proposeExchange, listings, createListing } = useData();

  // Find garments owned by current user
  const userListings = listings.filter((l) => l.sellerId === currentUser.id);

  const [selectedListingId, setSelectedListingId] = useState<string>(
    userListings[0]?.id || ''
  );
  // Quick offer inputs if user hasn't listed an item yet
  const [quickTitle, setQuickTitle] = useState('');
  const [quickBrand, setQuickBrand] = useState('');
  const [quickSize, setQuickSize] = useState('Size M');

  const [proposedLocation, setProposedLocation] = useState('Student Union 2nd Floor Coffee Bar');
  const [proposedDatetime, setProposedDatetime] = useState('Tomorrow at 1:15 PM');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!targetListing || !targetListing.clothingItem) return null;
  const targetCloth = targetListing.clothingItem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let offeredItemId = '';

    if (selectedListingId) {
      const found = userListings.find((l) => l.id === selectedListingId);
      if (found && found.clothingItemId) {
        offeredItemId = found.clothingItemId;
      }
    }

    // If user has no existing listings, quickly generate one
    if (!offeredItemId) {
      const newListing = await createListing(
        {
          ownerId: currentUser.id,
          title: quickTitle || 'Vintage Warm Layer',
          description: 'Offered for direct barter exchange.',
          brand: quickBrand || 'Second-hand',
          categoryId: 'cat-outerwear',
          size: quickSize || 'Size M',
          condition: 'Gently Used',
          material: 'Cotton / Wool Blend',
          color: 'Neutral',
          images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAz5YSq5NecD24QACVnPBbebh7gQ6qLoo4CINO_Uzm9960a0A6gDaWUDvKm-rCt4G_yQ3e3rEc96EeFxKL16RbqHAdzriCfBdxwGBt5DE9pMx2vIb5FzPWeggJNj0kC_YZ_HYGEhpxn2cuFrgijoB9tiwbW-dhsgk2Oc-iTeCnd1zknJpguNjeWSHPC-daVYt19QiTteCmAIxVUtPZcoflZCK6giigmfSkxrg6dmy6wSL_Eqr-Z4-Ao'],
          estimatedRetailPrice: 85,
          weightKg: 0.65,
        },
        {
          listingType: 'swap',
          price: 0,
          campusHub: targetListing.campusHub,
        }
      );
      offeredItemId = newListing.clothingItemId;
    }

    await proposeExchange({
      receiverId: targetListing.sellerId,
      requestedListingId: targetListing.id,
      offeredItemId,
      message: message.trim() || `Hi! I would love to trade for your ${targetCloth.title}. Let me know if my offer works for you!`,
      proposedLocation,
      proposedDatetime,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onExchangeProposed();
      onClose();
    }, 1800);
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

        {!submitted ? (
          <div>
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1B4332]">
                Zero-Cash Barter Protocol
              </div>
              <h2 className="text-2xl font-semibold text-[#161617] tracking-tight">
                Propose 1:1 Trade
              </h2>
              <p className="text-[13px] text-[#86868B] mt-0.5">
                Trade one of your pieces directly for <strong className="text-[#161617]">{targetCloth.title}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
              {/* Select Offered Garment */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Which piece from your wardrobe are you offering?
                </label>
                {userListings.length > 0 ? (
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
                  >
                    {userListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.clothingItem?.title} ({l.clothingItem?.brand} • {l.clothingItem?.size})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] space-y-2">
                    <span className="text-[11px] font-medium text-emerald-800 block">
                      Quickly enter the garment you are offering:
                    </span>
                    <input
                      type="text"
                      placeholder="Title: e.g. Vintage Denim Jacket"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E5EA] text-[12px]"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Brand: e.g. Levi's"
                        value={quickBrand}
                        onChange={(e) => setQuickBrand(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E5EA] text-[12px]"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Size: e.g. Size M"
                        value={quickSize}
                        onChange={(e) => setQuickSize(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E5EA] text-[12px]"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Proposed Location */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Proposed Meetup Spot
                </label>
                <input
                  type="text"
                  value={proposedLocation}
                  onChange={(e) => setProposedLocation(e.target.value)}
                  placeholder="e.g. Student Union Lounge"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                  required
                />
              </div>

              {/* Proposed Time */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Proposed Date & Time
                </label>
                <input
                  type="text"
                  value={proposedDatetime}
                  onChange={(e) => setProposedDatetime(e.target.value)}
                  placeholder="e.g. Tomorrow at 1:15 PM"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                  required
                />
              </div>

              {/* Personal Note */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Note to Seller
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! Would love to trade for your piece. Clean and ready to swap!"
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
                  className="px-6 py-2 rounded-full bg-[#1B4332] text-white hover:bg-[#123124] font-medium transition-all shadow-xs"
                >
                  Send Trade Proposal
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">handshake</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#161617]">Proposal Sent!</h3>
            <p className="text-[13px] text-[#86868B] mt-2 max-w-sm mx-auto">
              The owner has been notified. You can track this trade under your "Clothing Exchanges" tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

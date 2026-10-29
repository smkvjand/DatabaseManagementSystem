import React, { useState } from 'react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface ItemDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onOpenCheckout: (listing: Listing) => void;
  onOpenExchange: (listing: Listing) => void;
  onMessageOwner?: (ownerId?: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  listing,
  onClose,
  onOpenCheckout,
  onOpenExchange,
  onMessageOwner,
}) => {
  const { currentUser } = useAuth();
  const { isWishlisted, toggleWishlist, reviews, createDonation, dropBoxes, charities } = useData();
  const [claimedNotice, setClaimedNotice] = useState(false);

  if (!listing || !listing.clothingItem) return null;

  const cloth = listing.clothingItem;
  const seller = listing.seller || {
    id: 'unknown',
    name: 'Campus Student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    campusDorm: listing.campusHub,
    ecoPoints: 120,
  };

  const isOwner = currentUser.id === listing.sellerId;
  const wishlisted = isWishlisted(listing.id);

  // Calculate environmental equivalencies
  const waterSavedLiters = Math.round(cloth.weightKg * 3200);
  const co2AvoidedKg = Math.round(cloth.weightKg * 14 * 10) / 10;

  // Filter reviews for seller
  const sellerReviews = reviews.filter((r) => r.targetUserId === seller.id);
  const avgRating =
    sellerReviews.length > 0
      ? (sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length).toFixed(1)
      : '5.0';

  const handleClaimDonation = () => {
    setClaimedNotice(true);
    setTimeout(() => {
      setClaimedNotice(false);
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E5EA] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-[#E5E5EA] flex items-center justify-center text-[#161617] hover:bg-[#F5F5F7] transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image & Eco Badges */}
          <div className="p-6 md:p-8 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-[#E5E5EA] flex flex-col justify-between">
            <div>
              <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-white border border-[#E5E5EA]">
                <img
                  src={cloth.images[0]}
                  alt={cloth.title}
                  className="w-full h-full object-cover"
                />
                {listing.listingType === 'donate' && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[11px] font-semibold tracking-wide uppercase">
                    Campus Donation
                  </div>
                )}
              </div>

              {/* Garment Eco Provenance */}
              <div className="mt-5 p-4 rounded-xl bg-white border border-[#E5E5EA]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-2 flex items-center justify-between">
                  <span>Circularity Impact</span>
                  <span className="text-emerald-700">✓ Verified Pre-Loved</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-[#FAF9F6]">
                    <div className="text-[15px] font-semibold text-[#161617]">
                      {cloth.weightKg} kg
                    </div>
                    <div className="text-[10px] text-[#86868B]">Waste Diverted</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF9F6]">
                    <div className="text-[15px] font-semibold text-[#161617]">
                      {waterSavedLiters} L
                    </div>
                    <div className="text-[10px] text-[#86868B]">Water Conserved</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF9F6]">
                    <div className="text-[15px] font-semibold text-[#161617]">
                      {co2AvoidedKg} kg
                    </div>
                    <div className="text-[10px] text-[#86868B]">CO₂ Avoided</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meetup Pickup Spot */}
            <div className="mt-4 pt-4 border-t border-[#E5E5EA]/70 flex items-center justify-between text-[12px] text-[#86868B]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-800">
                  location_on
                </span>
                Pickup: {listing.campusHub}
              </span>
              <span>Between classes</span>
            </div>
          </div>

          {/* Right: Details & Purchase Module */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Brand & Size */}
              <div className="flex items-center justify-between text-[12px] uppercase tracking-wider font-semibold text-[#86868B]">
                <span>{cloth.brand}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] border border-[#E5E5EA]">
                  {cloth.size}
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-semibold text-[#161617] tracking-tight mt-1">
                {cloth.title}
              </h2>

              {/* Price / Type Display */}
              <div className="mt-3 flex items-baseline gap-3">
                {listing.listingType === 'donate' ? (
                  <span className="text-2xl font-bold text-emerald-800">Free Donation</span>
                ) : listing.listingType === 'swap' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#161617]">
                      {listing.price > 0 ? `Swap or $${listing.price}` : 'Exchange Only'}
                    </span>
                    <span className="text-[12px] text-[#86868B]">1:1 direct trade</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#161617]">${listing.price}</span>
                    {cloth.estimatedRetailPrice > 0 && (
                      <span className="text-[13px] text-[#86868B] line-through">
                        ${cloth.estimatedRetailPrice} retail
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-[14px] text-[#414844] leading-relaxed">
                {cloth.description}
              </p>

              {/* Swap Preference Note if applicable */}
              {listing.swapPreferences && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[12px] text-amber-950">
                  <div className="font-semibold mb-0.5">Trader Swap Preference:</div>
                  <div>{listing.swapPreferences}</div>
                </div>
              )}

              {/* Garment Specifications Table */}
              <div className="mt-6 border-t border-b border-[#E5E5EA] py-3 text-[13px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Condition</span>
                  <span className="font-medium text-[#161617]">{cloth.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Material</span>
                  <span className="font-medium text-[#161617]">{cloth.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Color</span>
                  <span className="font-medium text-[#161617]">{cloth.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Pickup Dormitory</span>
                  <span className="font-medium text-[#161617]">{listing.campusHub}</span>
                </div>
              </div>

              {/* Seller Profile Summary */}
              <div className="mt-6 flex items-center justify-between p-3.5 rounded-xl bg-[#F5F5F7]">
                <div className="flex items-center gap-3">
                  <img
                    src={seller.avatarUrl}
                    alt={seller.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E5E5EA]"
                  />
                  <div>
                    <div className="font-medium text-[13px] text-[#161617]">{seller.name}</div>
                    <div className="text-[11px] text-[#86868B]">{seller.campusDorm}</div>
                    {!isOwner && onMessageOwner && listing.sellerId && (
                      <button
                        onClick={() => onMessageOwner(listing.sellerId)}
                        className="mt-1.5 px-3 py-1 rounded-full bg-[#161617] text-white text-[11px] font-medium hover:bg-black cursor-pointer"
                      >
                        Message Owner
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[12px] font-semibold text-[#161617]">
                    <span className="text-amber-500">★</span> {avgRating}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium">
                    {seller.ecoPoints} Eco Points
                  </div>
                </div>
              </div>
            </div>

            {/* Actions / Purchase Module */}
            <div className="mt-8 space-y-3">
              {claimedNotice && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-[13px] text-center font-medium animate-in fade-in">
                  ✓ Claim registered! Ready for pickup at {listing.campusHub}.
                </div>
              )}

              <div className="flex items-center gap-3">
                {listing.listingType === 'buy' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckout(listing);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#161617] text-white text-[13px] font-medium tracking-tight hover:bg-black transition-all shadow-xs cursor-pointer"
                  >
                    Buy Pre-Loved (${listing.price})
                  </button>
                )}

                {listing.listingType === 'swap' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenExchange(listing);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#1B4332] text-white text-[13px] font-medium tracking-tight hover:bg-[#123124] transition-all shadow-xs cursor-pointer"
                  >
                    Propose 1:1 Trade
                  </button>
                )}

                {listing.listingType === 'donate' && (
                  <button
                    onClick={handleClaimDonation}
                    className="flex-1 py-3 rounded-full bg-emerald-800 text-white text-[13px] font-medium tracking-tight hover:bg-emerald-900 transition-all shadow-xs cursor-pointer"
                  >
                    Claim for Student Wardrobe
                  </button>
                )}

                {/* Secondary Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(listing.id)}
                  className={`p-3 rounded-full border border-[#E5E5EA] flex items-center justify-center transition-all cursor-pointer ${
                    wishlisted ? 'bg-red-50 text-red-600 border-red-200' : 'hover:bg-[#F5F5F7] text-[#161617]'
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {wishlisted ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              </div>

              <p className="text-[11px] text-center text-[#86868B]">
                Protected by ReWear campus honor protocol • No shipping emissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useData } from '../context/DataContext';
import { ProductCard } from './ProductCard';
import { Listing } from '../types';

interface WishlistViewProps {
  onNavigate: (path: string) => void;
  onSelectListing: (listing: Listing) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onNavigate, onSelectListing }) => {
  const { wishlist, toggleWishlist } = useData();

  const validWishlistListings = wishlist
    .map((w) => w.listing)
    .filter((l): l is Listing => Boolean(l));

  const totalValue = validWishlistListings.reduce((acc, l) => acc + (l.price || 0), 0);
  const totalWeight = validWishlistListings.reduce(
    (acc, l) => acc + (l.clothingItem?.weightKg || 0.6),
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E5EA]">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[#86868B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Saved Pieces</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
            My Campus Wishlist
          </h1>
          <p className="mt-1.5 text-[14px] text-[#86868B]">
            {validWishlistListings.length} garments saved for dorm trade or purchase.
          </p>
        </div>

        {validWishlistListings.length > 0 && (
          <div className="flex items-center gap-4 text-[12px] bg-white p-3 rounded-2xl border border-[#E5E5EA]">
            <div>
              <span className="text-[#86868B] block">Total Wardrobe Value</span>
              <span className="font-semibold text-[#161617] text-[14px]">${totalValue}</span>
            </div>
            <div className="h-7 w-[1px] bg-[#E5E5EA]" />
            <div>
              <span className="text-[#86868B] block">Potential Waste Diverted</span>
              <span className="font-semibold text-emerald-800 text-[14px]">
                {totalWeight.toFixed(1)} kg
              </span>
            </div>
          </div>
        )}
      </div>

      {validWishlistListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 pt-8">
          {validWishlistListings.map((listing) => (
            <div key={listing.id} className="relative group">
              <ProductCard listing={listing} onSelect={onSelectListing} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(listing.id);
                }}
                className="mt-2 w-full py-1.5 rounded-lg border border-[#E5E5EA] text-[11px] text-[#86868B] hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-colors"
              >
                Remove from wishlist
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto text-[#86868B] mb-3">
            <span className="material-symbols-outlined text-[24px]">favorite_border</span>
          </div>
          <h3 className="text-base font-semibold text-[#161617]">Your wishlist is empty</h3>
          <p className="text-[13px] text-[#86868B] mt-1 max-w-sm mx-auto">
            Browse the campus catalog and tap the heart icon on any piece you want to keep track of.
          </p>
          <button
            onClick={() => onNavigate('browse-clothes')}
            className="mt-4 px-5 py-2.5 rounded-full bg-[#161617] text-white text-[12px] font-medium tracking-tight hover:bg-black transition-all cursor-pointer"
          >
            Explore campus collection
          </button>
        </div>
      )}
    </div>
  );
};

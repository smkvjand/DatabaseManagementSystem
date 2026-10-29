import React from 'react';
import { Listing } from '../types';
import { useData } from '../context/DataContext';

interface ProductCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing, onSelect }) => {
  const { isWishlisted, toggleWishlist } = useData();
  const wishlisted = isWishlisted(listing.id);
  const cloth = listing.clothingItem;

  if (!cloth) return null;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(listing.id);
  };

  const getPriceLabel = () => {
    if (listing.listingType === 'donate') {
      return <span className="text-[13px] font-semibold text-emerald-700">Free Donation</span>;
    }
    if (listing.listingType === 'swap') {
      if (listing.price > 0) {
        return <span className="text-[14px] font-semibold text-[#161617]">Swap or ${listing.price}</span>;
      }
      return <span className="text-[14px] font-semibold text-[#161617]">Exchange only</span>;
    }
    return <span className="text-[14px] font-semibold text-[#161617]">${listing.price}</span>;
  };

  return (
    <article
      onClick={() => onSelect(listing)}
      className="group flex flex-col cursor-pointer text-left focus:outline-none"
    >
      <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA]/60 transition-all">
        <img
          src={cloth.images[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80'}
          alt={cloth.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {listing.listingType === 'donate' && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-700/90 backdrop-blur-md text-white text-[10px] font-medium tracking-wide uppercase shadow-xs">
            Charity
          </div>
        )}

        <button
          aria-label={wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center transition-colors shadow-xs ${
            wishlisted ? 'text-red-500 hover:text-red-600' : 'text-[#86868B] hover:text-[#161617]'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">
            {wishlisted ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>

      <div className="mt-3.5 flex flex-col">
        <div className="flex items-center justify-between text-[11px] text-[#86868B] uppercase tracking-wider font-medium">
          <span>{cloth.brand}</span>
          <span>{cloth.size}</span>
        </div>

        <h4 className="text-[14px] font-medium text-[#161617] tracking-tight mt-0.5 truncate group-hover:text-black">
          {cloth.title}
        </h4>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E5EA]/40">
          {getPriceLabel()}
          <span className="text-[12px] text-[#86868B]">{listing.campusHub}</span>
        </div>
      </div>
    </article>
  );
};

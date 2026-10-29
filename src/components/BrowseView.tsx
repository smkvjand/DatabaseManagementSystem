import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ProductCard } from './ProductCard';
import { Listing, ListingType } from '../types';

interface BrowseViewProps {
  onSelectListing: (listing: Listing) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  initialCategory?: string;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  onSelectListing,
  searchQuery,
  onSearchChange,
  initialCategory,
}) => {
  const { listings, categories } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');

  // Filter dropdown visibility
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const cloth = listing.clothingItem;
      if (!cloth) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const catObj = categories.find((c) => c.slug === selectedCategory);
        if (catObj && cloth.categoryId !== catObj.id) return false;
      }

      // Size filter
      if (selectedSize !== 'all') {
        if (!cloth.size.toLowerCase().includes(selectedSize.toLowerCase())) return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (listing.listingType !== selectedType) return false;
      }

      // Hub filter
      if (selectedHub !== 'all') {
        if (!listing.campusHub.toLowerCase().includes(selectedHub.toLowerCase())) return false;
      }

      // Price filter
      if (selectedPriceRange !== 'all') {
        if (selectedPriceRange === 'free') {
          if (listing.price > 0 && listing.listingType !== 'donate') return false;
        } else if (selectedPriceRange === 'under25') {
          if (listing.price >= 25) return false;
        } else if (selectedPriceRange === '25to50') {
          if (listing.price < 25 || listing.price > 50) return false;
        } else if (selectedPriceRange === 'over50') {
          if (listing.price <= 50) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cloth.title.toLowerCase().includes(q);
        const matchesBrand = cloth.brand.toLowerCase().includes(q);
        const matchesDesc = cloth.description.toLowerCase().includes(q);
        const matchesHub = listing.campusHub.toLowerCase().includes(q);
        const matchesMaterial = cloth.material.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesDesc && !matchesHub && !matchesMaterial) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.viewsCount - a.viewsCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listings, categories, selectedCategory, selectedSize, selectedType, selectedHub, selectedPriceRange, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedType('all');
    setSelectedHub('all');
    setSelectedPriceRange('all');
    onSearchChange('');
    setOpenDropdown(null);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSize !== 'all' ||
    selectedType !== 'all' ||
    selectedHub !== 'all' ||
    selectedPriceRange !== 'all' ||
    Boolean(searchQuery.trim());

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E5EA]/70">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[#86868B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Campus Circular Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
            Campus Collection
          </h1>
          <p className="mt-1.5 text-[14px] text-[#86868B] font-normal">
            {filteredListings.length} pre-loved pieces inspected and ready for campus pickup.
          </p>
        </div>

        {/* Sort Pill */}
        <div className="relative self-start md:self-end">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E5E5EA]/80 text-[12px] text-[#161617] shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#86868B]">
              swap_vert
            </span>
            <span className="font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#86868B] hover:text-[#161617] focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Pills & Category Bar */}
      <div className="py-5 flex flex-col gap-4 border-b border-[#E5E5EA]/60">
        {/* Primary Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-[12px]">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-medium cursor-pointer ${
                  isSelected
                    ? 'bg-[#161617] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#161617]'
                }`}
              >
                {cat.name} ({cat.itemCount})
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Size Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('size')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[#161617] transition-all cursor-pointer ${
                  selectedSize !== 'all'
                    ? 'bg-[#161617] text-white border-[#161617]'
                    : 'bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border-[#E5E5EA]/70'
                }`}
              >
                <span>{selectedSize === 'all' ? 'Size: Any' : `Size: ${selectedSize}`}</span>
                <span className="material-symbols-outlined text-[15px]">expand_more</span>
              </button>
              {openDropdown === 'size' && (
                <div className="absolute left-0 mt-2 w-44 rounded-xl bg-white border border-[#E5E5EA] shadow-lg p-2 z-30">
                  {['all', 'XS', 'S', 'M', 'L', 'XL', '30/32', '31'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedSize(sz);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#F5F5F7] text-[12px] flex items-center justify-between"
                    >
                      <span>{sz === 'all' ? 'Any size' : sz}</span>
                      {selectedSize === sz && <span className="text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('type')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[#161617] transition-all cursor-pointer ${
                  selectedType !== 'all'
                    ? 'bg-[#161617] text-white border-[#161617]'
                    : 'bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border-[#E5E5EA]/70'
                }`}
              >
                <span>
                  {selectedType === 'all'
                    ? 'Type (Buy, Swap, Donate)'
                    : selectedType === 'buy'
                    ? 'Buy Pre-Loved'
                    : selectedType === 'swap'
                    ? 'Zero-Cash Swap'
                    : 'Free Donation'}
                </span>
                <span className="material-symbols-outlined text-[15px]">expand_more</span>
              </button>
              {openDropdown === 'type' && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white border border-[#E5E5EA] shadow-lg p-2 z-30">
                  {[
                    { id: 'all', label: 'All types' },
                    { id: 'buy', label: 'Peer Thrift (Buy)' },
                    { id: 'swap', label: 'Zero-Cash Swap' },
                    { id: 'donate', label: 'Free Charity Donation' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedType(t.id);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#F5F5F7] text-[12px] flex items-center justify-between"
                    >
                      <span>{t.label}</span>
                      {selectedType === t.id && <span className="text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campus Hub Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('hub')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[#161617] transition-all cursor-pointer ${
                  selectedHub !== 'all'
                    ? 'bg-[#161617] text-white border-[#161617]'
                    : 'bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border-[#E5E5EA]/70'
                }`}
              >
                <span>{selectedHub === 'all' ? 'Campus Hub' : selectedHub}</span>
                <span className="material-symbols-outlined text-[15px]">expand_more</span>
              </button>
              {openDropdown === 'hub' && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white border border-[#E5E5EA] shadow-lg p-2 z-30 max-h-60 overflow-y-auto">
                  {[
                    'all',
                    'North Hall',
                    'Student Union',
                    'East Dorms',
                    'South Campus',
                    'West Quad',
                    'Central Library',
                    'Engineering Quad',
                  ].map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setSelectedHub(h);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#F5F5F7] text-[12px] flex items-center justify-between"
                    >
                      <span>{h === 'all' ? 'All Campus Hubs' : h}</span>
                      {selectedHub === h && <span className="text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('price')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[#161617] transition-all cursor-pointer ${
                  selectedPriceRange !== 'all'
                    ? 'bg-[#161617] text-white border-[#161617]'
                    : 'bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border-[#E5E5EA]/70'
                }`}
              >
                <span>
                  {selectedPriceRange === 'all'
                    ? 'Price Range'
                    : selectedPriceRange === 'free'
                    ? 'Free / Trade Only'
                    : selectedPriceRange === 'under25'
                    ? 'Under $25'
                    : selectedPriceRange === '25to50'
                    ? '$25 - $50'
                    : '$50+'}
                </span>
                <span className="material-symbols-outlined text-[15px]">expand_more</span>
              </button>
              {openDropdown === 'price' && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-[#E5E5EA] shadow-lg p-2 z-30">
                  {[
                    { id: 'all', label: 'Any price' },
                    { id: 'free', label: 'Free / Trade Only' },
                    { id: 'under25', label: 'Under $25' },
                    { id: '25to50', label: '$25 – $50' },
                    { id: 'over50', label: 'Over $50' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPriceRange(p.id);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#F5F5F7] text-[12px] flex items-center justify-between"
                    >
                      <span>{p.label}</span>
                      {selectedPriceRange === p.id && <span className="text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[12px] text-[#86868B] hover:text-[#161617] underline ml-1 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <span className="text-[12px] text-[#86868B] font-normal hidden sm:inline-block">
            Showing {filteredListings.length} of {listings.length} listings
          </span>
        </div>
      </div>

      {/* Product Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 pt-8">
          {filteredListings.map((listing) => (
            <ProductCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto text-[#86868B] mb-3">
            <span className="material-symbols-outlined text-[24px]">search_off</span>
          </div>
          <h3 className="text-lg font-semibold text-[#161617]">No matching garments found</h3>
          <p className="text-[13px] text-[#86868B] mt-1 max-w-sm mx-auto">
            Try adjusting your search query, dormitory filter, or selecting a broader category.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium hover:bg-black"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Quiet Apple Pagination */}
      <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-[13px] text-[#86868B] font-normal">
          Showing {filteredListings.length} of {listings.length} items
        </span>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-6 py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium tracking-tight hover:bg-black/90 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
        >
          Back to top
        </button>
      </div>
    </div>
  );
};

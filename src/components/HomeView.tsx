import React from 'react';
import { useData } from '../context/DataContext';
import { ProductCard } from './ProductCard';
import { Listing } from '../types';

interface HomeViewProps {
  onNavigate: (path: string) => void;
  onOpenListItem: () => void;
  onSelectListing: (listing: Listing) => void;
  onOpenImpactReport: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenListItem,
  onSelectListing,
  onOpenImpactReport,
}) => {
  const { listings, impactReport, dropBoxes } = useData();

  // Featured pieces for the showcase
  const featuredListings = listings.filter((l) => l.featured).slice(0, 4);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Subtitle Chip */}
          <div className="inline-flex items-center gap-2 mb-4 text-[12px] font-medium tracking-wide text-[#86868B] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Campus Circular Wardrobe</span>
          </div>

          {/* Striking Typographic Headline */}
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.035em] text-[#161617] leading-[1.08] text-balance">
            Good clothes deserve another life.
          </h1>

          {/* Short, Elegant Platform Explanation */}
          <p className="mt-5 text-base sm:text-lg text-[#86868B] font-normal leading-relaxed max-w-xl text-balance">
            A student marketplace to buy, swap, and donate pre-loved clothing across campus.
          </p>

          {/* Understated Action Buttons */}
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('browse-clothes')}
              className="px-5 py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium tracking-tight hover:bg-black/90 transition-all cursor-pointer"
            >
              Explore clothing
            </button>
            <button
              onClick={onOpenListItem}
              className="px-5 py-2.5 rounded-full bg-transparent border border-[#E5E5EA] text-[#161617] text-[13px] font-medium tracking-tight hover:bg-[#F5F5F7] transition-all cursor-pointer"
            >
              List an item
            </button>
          </div>
        </div>

        {/* Cinematic 16:9 Hero Lifestyle Photograph */}
        <div className="mt-14 sm:mt-16 relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#E5E5EA]/70 shadow-sm bg-[#F5F5F7]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHBwC1IeWAu1MAtkCdOAT_E7sJRGMjoNb1Up7EmUJm7VCdy_GI9b8XzEm5JDI6sSimqAZ3ZcFn8AnD-i9sP7K6kvrykSIxEetwKO2yZw9BHAGOHgrRwQpADYtujvRe8Qn7CPqemPe_KPJOYoHlTIcTgtd6NBESrgK2vst7NW1oFQY9QanJZ1VETDM78aAkOx_WNsPO9GPbUfKJMqKj7rXZsn2HW65wv4-YCTcwj6Vb7BMxmiXYaP7l"
            alt="Two students wearing timeless minimalist second-hand clothing conversing in natural soft light on campus"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/40 text-[12px] text-[#161617] font-medium shadow-xs">
            Campus Quad • Fall Collection
          </div>
        </div>
      </section>

      {/* Three Focused Core Pillars: Apple Less But Better */}
      <section className="border-y border-[#E5E5EA] bg-white/50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {/* Pillar: Buy */}
            <div
              onClick={() => onNavigate('browse-clothes')}
              className="flex flex-col cursor-pointer group"
            >
              <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868B] mb-2">
                01 / Peer thrift
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#161617] group-hover:text-black">
                Buy Pre-Loved
              </h3>
              <p className="mt-3 text-[14px] text-[#86868B] leading-relaxed font-normal">
                Curated student wardrobes at fair prices. No parcel delays or delivery emissions—simply walk up and collect between classes.
              </p>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA]/50 text-[13px] text-[#161617] font-medium flex items-center justify-between">
                <span>Avg. dorm savings</span>
                <span className="text-[#86868B] font-normal">$24 per piece</span>
              </div>
            </div>

            {/* Pillar: Exchange */}
            <div
              onClick={() => onNavigate('exchanges')}
              className="flex flex-col cursor-pointer group"
            >
              <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868B] mb-2">
                02 / Zero cash
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#161617] group-hover:text-black">
                Exchange Clothes
              </h3>
              <p className="mt-3 text-[14px] text-[#86868B] leading-relaxed font-normal">
                Direct closet-to-closet trades. Propose clean swaps for garments taking up space without opening your wallet.
              </p>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA]/50 text-[13px] text-[#161617] font-medium flex items-center justify-between">
                <span>Trade protocol</span>
                <span className="text-[#86868B] font-normal">Direct 1:1 barter</span>
              </div>
            </div>

            {/* Pillar: Donate */}
            <div
              onClick={() => onNavigate('charity')}
              className="flex flex-col cursor-pointer group"
            >
              <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868B] mb-2">
                03 / Giving back
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#161617] group-hover:text-black">
                Donate for Good
              </h3>
              <p className="mt-3 text-[14px] text-[#86868B] leading-relaxed font-normal">
                Streamlined drop-offs routed directly to verified university student clothing banks and local community shelters.
              </p>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA]/50 text-[13px] text-[#161617] font-medium flex items-center justify-between">
                <span>Drop locations</span>
                <span className="text-[#86868B] font-normal">{dropBoxes.filter(b => b.active).length} Campus bins active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Product Showcase (Featured Pre-Loved Pieces) */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[12px] font-medium tracking-wide uppercase text-[#86868B]">
              Campus Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#161617] mt-1">
              Featured pre-loved pieces.
            </h2>
          </div>
          <button
            onClick={() => onNavigate('browse-clothes')}
            className="text-[13px] text-[#161617] font-medium hover:text-[#86868B] transition-colors flex items-center gap-1 group focus:outline-none"
          >
            <span>View all listings</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* 4 Thoughtfully Spaced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {featuredListings.map((listing) => (
            <ProductCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      </section>

      {/* Campus Charity & Impact: Quiet Authoritative Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-[#161617] text-white p-8 sm:p-14 border border-black/10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-white/50">
              Semester Milestone
            </span>
            <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2">
              {impactReport.textileWasteKgDiverted.toLocaleString()} kg of textile waste diverted this semester.
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed font-normal mt-3">
              Garments donated directly through 8 verified campus dorm bins are sorted weekly by the Student Sustainability Council and given to local shelters and university coat drives.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-[13px] text-white/80">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                North Hall Box
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Union Lobby Box
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Library Atrium Box
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-start gap-3">
            <button
              onClick={() => onNavigate('charity')}
              className="px-5 py-2.5 rounded-full bg-white text-[#161617] text-[13px] font-medium tracking-tight hover:bg-white/90 transition-all text-center w-full sm:w-auto cursor-pointer"
            >
              Locate drop-off bins
            </button>
            <button
              onClick={onOpenImpactReport}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white text-[13px] font-medium tracking-tight hover:bg-white/10 transition-all text-center w-full sm:w-auto cursor-pointer"
            >
              Read impact report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenListItem: () => void;
  onOpenImpactReport: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenListItem,
  onOpenImpactReport,
}) => {
  return (
    <footer className="w-full border-t border-[#E5E5EA] bg-[#FAF9F6] py-12 text-[12px] text-[#86868B]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Row: Directory Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-10 border-b border-[#E5E5EA]/60">
          <div>
            <h5 className="text-[#161617] font-medium mb-3 text-[13px]">Explore</h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('browse-clothes')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  All Clothes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse-clothes?cat=outerwear')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Outerwear
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse-clothes?cat=knitwear')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Knitwear
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse-clothes?cat=denim')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Denim
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[#161617] font-medium mb-3 text-[13px]">Programs</h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('exchanges')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Dorm Swaps
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('charity')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Charity Bins
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('safety')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Meetup Safety
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[#161617] font-medium mb-3 text-[13px]">Student Council</h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenImpactReport}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Impact Reports
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('charity')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Team & Dorm Leads
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('charity')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Partner Hubs
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[#161617] font-medium mb-3 text-[13px]">Account</h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('my-wishlist')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenListItem}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  List an Item
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('profile')}
                  className="hover:text-[#161617] transition-colors focus:outline-none"
                >
                  Student Wardrobe
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Copyright & Guidelines */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#86868B]">
          <p>© 2025 ReWear Initiative. Less, but better fashion for campus life.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('safety')} className="hover:text-[#161617] transition-colors">
              Campus Guidelines
            </button>
            <button onClick={() => onNavigate('safety')} className="hover:text-[#161617] transition-colors">
              Privacy & Trust
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

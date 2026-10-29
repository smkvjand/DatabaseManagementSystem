import React from 'react';

interface SafetyViewProps {
  onNavigate: (path: string) => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E5EA]">
        <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Student Sustainability Council Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
          Campus Meetup & Safety Guidelines
        </h1>
        <p className="mt-1.5 text-[14px] text-[#86868B]">
          How reWear guarantees safe, dignified, and circular clothing exchanges between students.
        </p>
      </div>

      <div className="mt-8 space-y-8 text-[14px] text-[#414844] leading-relaxed">
        {/* Pillar 1 */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <h2 className="text-lg font-semibold text-[#161617] mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#161617] text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            Official Campus Meetup Hubs
          </h2>
          <p>
            Never agree to meet off-campus or in private dorm rooms with unfamiliar students. Always designate one of our 8 verified public campus locations:
          </p>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-[#161617]">
            <li className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              • Student Union East Atrium (by Eco Desk)
            </li>
            <li className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              • Central Library Circulation Desk
            </li>
            <li className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              • North Hall Main Lobby
            </li>
            <li className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              • Engineering Quad Café Lounge
            </li>
          </ul>
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <h2 className="text-lg font-semibold text-[#161617] mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#161617] text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            Garment Inspection & Hygiene Standard
          </h2>
          <p>
            All clothing listed on reWear must be freshly laundered or professionally cleaned before handoff. Take 60 seconds at pickup to check:
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              <strong className="block text-[#161617]">Seams & Zippers</strong>
              Ensure zippers glide smoothly and pocket linings are intact.
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              <strong className="block text-[#161617]">Fabric Care</strong>
              Verify material matches the listing condition report.
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E5E5EA]">
              <strong className="block text-[#161617]">Sizing Match</strong>
              Hold up garments to confirm sizing before finalizing.
            </div>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <h2 className="text-lg font-semibold text-[#161617] mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#161617] text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            Campus Honor Code & Zero-Tolerance Policy
          </h2>
          <p>
            reWear is backed by the student body honor code. Misrepresenting counterfeit goods, commercial scalping, or missed appointments may result in campus account suspension.
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => onNavigate('browse-clothes')}
          className="px-6 py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium hover:bg-black transition-all cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { useData } from '../context/DataContext';

interface ImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImpactReportModal: React.FC<ImpactReportModalProps> = ({ isOpen, onClose }) => {
  const { impactReport, dropBoxes } = useData();

  if (!isOpen) return null;

  const totalWaterSaved = Math.round(impactReport.textileWasteKgDiverted * 3200);
  const totalCo2Avoided = Math.round(impactReport.textileWasteKgDiverted * 14);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#E5E5EA] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#161617] hover:bg-[#E5E5EA] cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Student Sustainability Council • Official Audit
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#161617] tracking-tight">
            Campus Circularity Impact
          </h2>
          <p className="text-[13px] text-[#86868B] mt-0.5">
            Audit period: {impactReport.periodName} • Certified campus milestone
          </p>
        </div>

        {/* Big Number Banner */}
        <div className="p-6 rounded-2xl bg-[#161617] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] uppercase font-semibold text-white/50 tracking-wider">
              Total Diverted Weight
            </span>
            <div className="text-4xl font-extrabold tracking-tight text-white mt-1">
              {impactReport.textileWasteKgDiverted.toLocaleString()} kg
            </div>
            <p className="text-[12px] text-white/70 mt-1">
              Clean garments prevented from municipal landfill disposal.
            </p>
          </div>
          <div className="text-right sm:border-l sm:border-white/20 sm:pl-6">
            <div className="text-2xl font-bold text-emerald-400">
              {impactReport.totalItemsCirculated}
            </div>
            <span className="text-[11px] text-white/60">Pieces Re-Worn</span>
          </div>
        </div>

        {/* Environmental Equivalencies */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA]">
            <div className="text-xl font-bold text-[#161617]">
              {(totalWaterSaved / 1000).toFixed(1)}k L
            </div>
            <div className="text-[11px] text-[#86868B] mt-0.5">Clean Water Saved</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA]">
            <div className="text-xl font-bold text-[#161617]">
              {(totalCo2Avoided / 1000).toFixed(1)} T
            </div>
            <div className="text-[11px] text-[#86868B] mt-0.5">CO₂e Avoided</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA]">
            <div className="text-xl font-bold text-[#161617]">
              {impactReport.totalSwapsCompleted}
            </div>
            <div className="text-[11px] text-[#86868B] mt-0.5">1:1 Barter Swaps</div>
          </div>
        </div>

        {/* Dorm Leaderboard */}
        <div className="mb-6">
          <h4 className="font-semibold text-[14px] text-[#161617] mb-3">
            Dormitory Diversion Leaderboard
          </h4>
          <div className="space-y-2">
            {impactReport.featuredStories.map((story, i) => (
              <div
                key={story.dorm}
                className="p-3 rounded-xl bg-[#F5F5F7] flex items-center justify-between text-[13px]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#161617] text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-[#161617]">{story.dorm}</span>
                    <p className="text-[11px] text-[#86868B]">{story.highlight}</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-800 text-sm whitespace-nowrap">
                  {story.kgDiverted} kg
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Council Verification Signature */}
        <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] flex items-center justify-between text-[11px] text-[#86868B]">
          <div>
            <div>Audited by Student Sustainability Council</div>
            <div className="text-[#161617] font-medium">Jordan Chen, Lead Coordinator</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
            Council Verified
          </span>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium hover:bg-black transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ExchangeRequest, ExchangeStatus } from '../types';

interface ExchangeViewProps {
  onNavigate: (path: string) => void;
  onOpenListItem: () => void;
}

export const ExchangeView: React.FC<ExchangeViewProps> = ({ onNavigate, onOpenListItem }) => {
  const { currentUser } = useAuth();
  const { exchanges, updateExchangeStatus, listings } = useData();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'completed'>('incoming');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Incoming proposals where receiver is current user
  const incomingExchanges = exchanges.filter(
    (e) => e.receiverId === currentUser.id && e.status === 'pending'
  );

  // Outgoing proposals initiated by current user
  const outgoingExchanges = exchanges.filter(
    (e) => e.requesterId === currentUser.id && e.status === 'pending'
  );

  // Completed or accepted exchanges involving current user
  const completedExchanges = exchanges.filter(
    (e) =>
      (e.requesterId === currentUser.id || e.receiverId === currentUser.id) &&
      (e.status === 'completed' || e.status === 'accepted' || e.status === 'declined')
  );

  const handleAction = (id: string, status: ExchangeStatus, label: string) => {
    updateExchangeStatus(id, status);
    setStatusMessage(`Trade request ${label.toLowerCase()} successfully.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E5EA]">
        <div className="inline-flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[#86868B]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Zero-Cash Campus Barter</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#161617]">
              Clothing Exchanges
            </h1>
            <p className="mt-1.5 text-[14px] text-[#86868B] max-w-xl">
              Direct 1:1 closet trades. Swap pieces you no longer wear for garments from other student dorms without spending money.
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse-clothes')}
            className="px-5 py-2.5 rounded-full bg-[#161617] text-white text-[12px] font-medium tracking-tight hover:bg-black transition-all self-start md:self-end"
          >
            Find pieces to swap
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[13px] font-medium">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-[#E5E5EA] pb-3 text-[13px]">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Incoming Proposals ({incomingExchanges.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            activeTab === 'outgoing'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          My Trade Offers ({outgoingExchanges.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          History & Accepted ({completedExchanges.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {activeTab === 'incoming' && (
          <div className="space-y-6">
            {incomingExchanges.length > 0 ? (
              incomingExchanges.map((ex) => {
                const requestedItem = ex.requestedListing?.clothingItem;
                const offeredItem = ex.offeredItem;
                const sender = ex.requester;

                return (
                  <div
                    key={ex.id}
                    className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F2F2F7]">
                      {/* Left: Requester Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                          alt={sender?.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-[#E5E5EA]"
                        />
                        <div>
                          <div className="font-semibold text-[#161617] text-[14px]">
                            {sender?.name} proposed a 1:1 trade
                          </div>
                          <div className="text-[12px] text-[#86868B]">
                            {sender?.campusDorm} • Proposed meetup: {ex.proposedLocation} ({ex.proposedDatetime})
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAction(ex.id, 'accepted', 'Accepted')}
                          className="px-4 py-2 rounded-full bg-emerald-800 text-white text-[12px] font-medium hover:bg-emerald-900 transition-colors cursor-pointer"
                        >
                          Accept Trade
                        </button>
                        <button
                          onClick={() => handleAction(ex.id, 'declined', 'Declined')}
                          className="px-4 py-2 rounded-full border border-[#E5E5EA] text-[#161617] text-[12px] font-medium hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>

                    {/* Trade Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Offered Item */}
                      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 mb-2 block">
                          You Receive
                        </span>
                        <div className="flex gap-4">
                          <img
                            src={offeredItem?.images[0]}
                            alt={offeredItem?.title}
                            className="w-20 h-24 rounded-lg object-cover bg-white"
                          />
                          <div>
                            <div className="text-[11px] text-[#86868B] uppercase font-medium">
                              {offeredItem?.brand} • {offeredItem?.size}
                            </div>
                            <h4 className="font-semibold text-[#161617] text-[14px] mt-0.5">
                              {offeredItem?.title}
                            </h4>
                            <div className="text-[12px] text-[#86868B] mt-1">
                              Condition: {offeredItem?.condition}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Requested Item */}
                      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-2 block">
                          From Your Wardrobe
                        </span>
                        <div className="flex gap-4">
                          <img
                            src={requestedItem?.images[0]}
                            alt={requestedItem?.title}
                            className="w-20 h-24 rounded-lg object-cover bg-white"
                          />
                          <div>
                            <div className="text-[11px] text-[#86868B] uppercase font-medium">
                              {requestedItem?.brand} • {requestedItem?.size}
                            </div>
                            <h4 className="font-semibold text-[#161617] text-[14px] mt-0.5">
                              {requestedItem?.title}
                            </h4>
                            <div className="text-[12px] text-[#86868B] mt-1">
                              Condition: {requestedItem?.condition}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Message */}
                    {ex.message && (
                      <div className="mt-4 p-3 rounded-lg bg-[#F5F5F7] text-[13px] text-[#414844]">
                        <span className="font-semibold text-[#161617]">Note:</span> "{ex.message}"
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E5E5EA]">
                <span className="material-symbols-outlined text-[32px] text-[#86868B]">
                  swap_horizontal_circle
                </span>
                <h3 className="text-base font-semibold text-[#161617] mt-2">
                  No incoming trade requests right now
                </h3>
                <p className="text-[13px] text-[#86868B] mt-1">
                  List items with "Zero-Cash Swap" enabled to receive offers from classmates.
                </p>
                <button
                  onClick={onOpenListItem}
                  className="mt-4 px-4 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium"
                >
                  List a garment for swap
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="space-y-6">
            {outgoingExchanges.length > 0 ? (
              outgoingExchanges.map((ex) => (
                <div
                  key={ex.id}
                  className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#F2F2F7]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                        Pending Partner Acceptance
                      </span>
                      <span className="text-[12px] text-[#86868B]">
                        Proposed to {ex.receiver?.name}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#86868B]">
                      {new Date(ex.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-[#F5F5F7]">
                      <span className="text-[11px] text-[#86868B] uppercase">You Offered</span>
                      <div className="font-medium text-[#161617] text-[13px]">
                        {ex.offeredItem?.title} ({ex.offeredItem?.brand})
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F5F7]">
                      <span className="text-[11px] text-[#86868B] uppercase">In Exchange For</span>
                      <div className="font-medium text-[#161617] text-[13px]">
                        {ex.requestedListing?.clothingItem?.title}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[12px] text-[#86868B]">
                    Proposed Location: {ex.proposedLocation} • {ex.proposedDatetime}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E5E5EA]">
                <h3 className="text-base font-semibold text-[#161617]">
                  You have not proposed any active trades
                </h3>
                <p className="text-[13px] text-[#86868B] mt-1">
                  Browse the catalog and tap "Propose 1:1 Trade" on any item!
                </p>
                <button
                  onClick={() => onNavigate('browse-clothes')}
                  className="mt-4 px-4 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium"
                >
                  Browse Campus Catalog
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedExchanges.length > 0 ? (
              completedExchanges.map((ex) => (
                <div
                  key={ex.id}
                  className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          ex.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : ex.status === 'accepted'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ex.status.toUpperCase()}
                      </span>
                      <span className="text-[12px] text-[#86868B]">
                        Partner: {ex.requesterId === currentUser.id ? ex.receiver?.name : ex.requester?.name}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-[#161617]">
                      {ex.offeredItem?.title} ⇄ {ex.requestedListing?.clothingItem?.title}
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">
                      Meetup: {ex.proposedLocation}
                    </div>
                  </div>

                  {ex.status === 'accepted' && (
                    <button
                      onClick={() => handleAction(ex.id, 'completed', 'Completed')}
                      className="px-4 py-1.5 rounded-full bg-emerald-800 text-white text-[12px] font-medium hover:bg-emerald-900"
                    >
                      Confirm Trade Hand-off
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-[#86868B] text-[13px]">
                No completed trades yet. Start swapping to earn circular fashion points!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety & Honor Guidelines */}
      <div className="mt-16 p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA]">
        <h3 className="font-semibold text-[#161617] text-[15px] mb-2">
          Campus 1:1 Barter Protocol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] text-[#414844] mt-4">
          <div>
            <div className="font-medium text-[#161617] mb-1">1. Inspection First</div>
            Meet in person and inspect garment fabric, zippers, and cleanliness before confirming trade.
          </div>
          <div>
            <div className="font-medium text-[#161617] mb-1">2. Campus Hub Meetups</div>
            Prefer campus dining halls, student union lounges, or library foyers for safe exchanges.
          </div>
          <div>
            <div className="font-medium text-[#161617] mb-1">3. Eco Points Award</div>
            Both swappers receive 50 eco points and log 1.5 kg of avoided textile production.
          </div>
        </div>
      </div>
    </div>
  );
};

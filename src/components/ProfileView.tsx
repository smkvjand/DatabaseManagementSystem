import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Listing, Order, OrderStatus } from '../types';

interface ProfileViewProps {
  onOpenListItem: () => void;
  onOpenReviewModal: (orderId: string, targetUserId: string) => void;
  onOpenPreferences: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenListItem,
  onOpenReviewModal,
  onOpenPreferences,
}) => {
  const { currentUser, updateProfile } = useAuth();
  const { listings, orders, exchanges, donations, reviews, deleteListing, updateOrderStatus } = useData();

  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'swaps' | 'donations' | 'reviews'>('listings');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editDorm, setEditDorm] = useState(currentUser.campusDorm);

  // My listings
  const myListings = listings.filter((l) => l.sellerId === currentUser.id);

  // My orders (as buyer)
  const myOrders = orders.filter((o) => o.buyerId === currentUser.id);

  // My sales (as seller)
  const mySales = orders.filter((o) => o.listing?.sellerId === currentUser.id);

  // My swaps
  const mySwaps = exchanges.filter(
    (e) => e.requesterId === currentUser.id || e.receiverId === currentUser.id
  );

  // My donations
  const myDonations = donations.filter((d) => d.donorId === currentUser.id);

  // My received reviews
  const myReviews = reviews.filter((r) => r.targetUserId === currentUser.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      bio: editBio,
      campusDorm: editDorm,
    });
    setEditingProfile(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-[#E5E5EA]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-[#161617] tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#161617] text-white font-medium capitalize">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[13px] text-[#86868B] mt-0.5">
                {currentUser.campusDorm} • Student ID: {currentUser.studentId}
              </p>
              <p className="text-[13px] text-[#414844] mt-2 max-w-lg">
                {currentUser.bio || 'Active participant in campus circular fashion.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] text-center min-w-[130px]">
              <div className="text-xl font-bold text-emerald-800">{currentUser.ecoPoints}</div>
              <div className="text-[10px] text-[#86868B] uppercase font-semibold">Eco Points Earned</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] text-[#161617] text-[12px] font-medium hover:bg-[#F5F5F7] transition-all cursor-pointer"
              >
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
              <button
                onClick={onOpenPreferences}
                className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] text-[#161617] text-[12px] font-medium hover:bg-[#E5E5EA] transition-all cursor-pointer"
              >
                Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Inline Profile Editor */}
        {editingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-[#F2F2F7] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E5E5EA]"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Campus Dorm / Residence
                </label>
                <input
                  type="text"
                  value={editDorm}
                  onChange={(e) => setEditDorm(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E5E5EA]"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Short Bio
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E5E5EA]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-1.5 text-[12px] rounded-full text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-[12px] rounded-full bg-[#161617] text-white font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-[#E5E5EA] pb-3 text-[13px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'listings'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          My Wardrobe ({myListings.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'orders'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Orders & Pickups ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'swaps'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Swap History ({mySwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'donations'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Donations ({myDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-[#161617] text-white'
              : 'text-[#86868B] hover:text-[#161617] hover:bg-[#F5F5F7]'
          }`}
        >
          Reviews ({myReviews.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-8">
        {/* 1. Wardrobe & Listings */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-[#161617]">Garments You've Listed</h3>
              <button
                onClick={onOpenListItem}
                className="px-4 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium hover:bg-black"
              >
                + Add New Piece
              </button>
            </div>

            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => {
                  const cloth = listing.clothingItem;
                  if (!cloth) return null;

                  return (
                    <div
                      key={listing.id}
                      className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-3 bg-[#F5F5F7]">
                          <img
                            src={cloth.images[0]}
                            alt={cloth.title}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-2 right-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                              listing.status === 'active'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {listing.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#86868B] uppercase font-medium">
                          {cloth.brand} • {cloth.size}
                        </div>
                        <h4 className="font-medium text-[#161617] text-[14px] mt-0.5">
                          {cloth.title}
                        </h4>
                        <div className="text-[13px] font-semibold text-[#161617] mt-1">
                          {listing.listingType === 'buy' ? `$${listing.price}` : listing.listingType === 'swap' ? 'Swap' : 'Free Donation'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F2F2F7] flex items-center justify-between text-[11px]">
                        <span className="text-[#86868B]">{listing.campusHub}</span>
                        <button
                          onClick={() => deleteListing(listing.id)}
                          className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E5E5EA]">
                <h4 className="font-semibold text-[#161617]">Your wardrobe is currently empty</h4>
                <p className="text-[13px] text-[#86868B] mt-1">
                  List items taking up space in your dorm closet for cash or swaps!
                </p>
                <button
                  onClick={onOpenListItem}
                  className="mt-4 px-5 py-2 rounded-full bg-[#161617] text-white text-[12px] font-medium"
                >
                  List your first garment
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Orders & Pickups */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {myOrders.length > 0 ? (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={order.listing?.clothingItem?.images[0]}
                      alt="Order item"
                      className="w-16 h-20 rounded-xl object-cover bg-[#F5F5F7]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#86868B] font-semibold">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-medium">
                          {order.orderStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#161617] text-[15px] mt-0.5">
                        {order.listing?.clothingItem?.title}
                      </h4>
                      <p className="text-[12px] text-[#86868B] mt-1">
                        Meetup Location: {order.pickupHub} • {order.meetingTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-[14px] font-bold text-[#161617]">${order.totalAmount}</div>
                    <div className="flex items-center gap-2">
                      {order.orderStatus !== 'completed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-800 text-white text-[11px] font-medium hover:bg-emerald-900 cursor-pointer"
                        >
                          Confirm Pickup Done
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onOpenReviewModal(order.id, order.listing?.sellerId || 'unknown')
                        }
                        className="px-3 py-1.5 rounded-full border border-[#E5E5EA] text-[#161617] text-[11px] font-medium hover:bg-[#F5F5F7] cursor-pointer"
                      >
                        Leave Review
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-[#86868B] text-[13px]">
                No orders yet. Discover items in the catalog to schedule your first campus pickup!
              </div>
            )}
          </div>
        )}

        {/* 3. Swaps */}
        {activeTab === 'swaps' && (
          <div className="space-y-4">
            {mySwaps.map((ex) => (
              <div
                key={ex.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase text-emerald-800">
                    {ex.status.toUpperCase()}
                  </div>
                  <div className="font-medium text-[#161617] text-[14px] mt-0.5">
                    {ex.offeredItem?.title} ⇄ {ex.requestedListing?.clothingItem?.title}
                  </div>
                  <div className="text-[12px] text-[#86868B]">
                    Meetup: {ex.proposedLocation}
                  </div>
                </div>
                <div className="text-[12px] text-[#86868B]">
                  {new Date(ex.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {myDonations.length > 0 ? (
              myDonations.map((don) => (
                <div
                  key={don.id}
                  className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold text-emerald-800">
                        {don.donationCode}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-semibold">
                        {don.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="font-medium text-[#161617] text-[14px] mt-1">
                      {don.clothingItem?.title || 'Garment Donation'}
                    </div>
                    <div className="text-[12px] text-[#86868B]">
                      Bin: {don.dropBox?.name || 'Campus Box'} • Charity: {don.charity?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-800 text-[15px]">{don.weightKg} kg</div>
                    <div className="text-[10px] text-[#86868B]">Diverted Textile</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-[#86868B] text-[13px]">
                No donation receipts yet. Use any of the 8 campus drop boxes to donate!
              </div>
            )}
          </div>
        )}

        {/* 5. Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {myReviews.length > 0 ? (
              myReviews.map((rev) => (
                <div key={rev.id} className="p-5 rounded-2xl bg-white border border-[#E5E5EA]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[#161617]">
                        {rev.author?.name || 'Classmate'}
                      </span>
                      <span className="text-amber-500 text-[12px]">
                        {'★'.repeat(rev.rating)}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#86868B]">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#414844]">"{rev.comment}"</p>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-[#86868B] text-[13px]">
                No reviews yet. Complete purchases and swaps to build campus trust!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

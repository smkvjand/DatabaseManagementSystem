import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { BrowseView } from './components/BrowseView';
import { ExchangeView } from './components/ExchangeView';
import { CharityView } from './components/CharityView';
import { WishlistView } from './components/WishlistView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SafetyView } from './components/SafetyView';
import { MessagesView } from './components/MessagesView';

import { ItemDetailModal } from './components/ItemDetailModal';
import { ListItemModal } from './components/ListItemModal';
import { OrdersCheckoutModal } from './components/OrdersCheckoutModal';
import { ProposeExchangeModal } from './components/ProposeExchangeModal';
import { DonationModal } from './components/DonationModal';
import { UserPreferencesModal } from './components/UserPreferencesModal';
import { ImpactReportModal } from './components/ImpactReportModal';
import { ReviewModal } from './components/ReviewModal';
import { AuthModal } from './components/AuthModal';

import { Listing } from './types';

function MainApp() {
  const [currentPath, setCurrentPath] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [checkoutListing, setCheckoutListing] = useState<Listing | null>(null);
  const [exchangeListing, setExchangeListing] = useState<Listing | null>(null);
  const [isListItemOpen, setIsListItemOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isImpactReportOpen, setIsImpactReportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [donationModalState, setDonationModalState] = useState<{
    isOpen: boolean;
    boxId?: string;
    charityId?: string;
  }>({ isOpen: false });
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    orderId: string;
    targetUserId: string;
  }>({ isOpen: false, orderId: '', targetUserId: '' });

  // Handle URL hash changes or smooth navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1D1D1F] min-h-screen flex flex-col justify-between selection:bg-[#1D1D1F] selection:text-white">
      {/* Apple-Style Navigation Bar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onOpenListItem={() => setIsListItemOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Views */}
      <main className="w-full pt-16 flex-1">
        {currentPath === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenListItem={() => setIsListItemOpen(true)}
            onSelectListing={(listing) => setSelectedListing(listing)}
            onOpenImpactReport={() => setIsImpactReportOpen(true)}
          />
        )}

        {currentPath.startsWith('browse-clothes') && (
          <BrowseView
            onSelectListing={(listing) => setSelectedListing(listing)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            initialCategory={
              currentPath.includes('cat=outerwear')
                ? 'outerwear'
                : currentPath.includes('cat=knitwear')
                ? 'knitwear'
                : currentPath.includes('cat=denim')
                ? 'denim'
                : 'all'
            }
          />
        )}

        {currentPath === 'exchanges' && (
          <ExchangeView
            onNavigate={handleNavigate}
            onOpenListItem={() => setIsListItemOpen(true)}
          />
        )}

        {currentPath === 'charity' && (
          <CharityView
            onOpenDonationModal={(boxId, charityId) =>
              setDonationModalState({ isOpen: true, boxId, charityId })
            }
            onOpenImpactReport={() => setIsImpactReportOpen(true)}
          />
        )}

        {currentPath === 'my-wishlist' && (
          <WishlistView
            onNavigate={handleNavigate}
            onSelectListing={(listing) => setSelectedListing(listing)}
          />
        )}

        {currentPath === 'profile' && (
          <ProfileView
            onOpenListItem={() => setIsListItemOpen(true)}
            onOpenReviewModal={(orderId, targetUserId) =>
              setReviewModalState({ isOpen: true, orderId, targetUserId })
            }
            onOpenPreferences={() => setIsPreferencesOpen(true)}
          />
        )}

        {currentPath === 'admin' && (
          <AdminDashboardView
            onNavigate={handleNavigate}
            onOpenImpactReport={() => setIsImpactReportOpen(true)}
          />
        )}

        {currentPath === 'safety' && <SafetyView onNavigate={handleNavigate} />}

        {currentPath === 'messages' && <MessagesView />}
      </main>

      {/* Apple-Style Minimal Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenListItem={() => setIsListItemOpen(true)}
        onOpenImpactReport={() => setIsImpactReportOpen(true)}
      />

      {/* All Functional Modals */}
      <ItemDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onOpenCheckout={(listing) => setCheckoutListing(listing)}
        onOpenExchange={(listing) => setExchangeListing(listing)}
      />

      <ListItemModal
        isOpen={isListItemOpen}
        onClose={() => setIsListItemOpen(false)}
        onListingCreated={() => handleNavigate('browse-clothes')}
      />

      <OrdersCheckoutModal
        listing={checkoutListing}
        onClose={() => setCheckoutListing(null)}
        onOrderSuccess={() => {}}
      />

      <ProposeExchangeModal
        targetListing={exchangeListing}
        onClose={() => setExchangeListing(null)}
        onExchangeProposed={() => handleNavigate('exchanges')}
      />

      <DonationModal
        isOpen={donationModalState.isOpen}
        onClose={() => setDonationModalState({ isOpen: false })}
        preselectedBoxId={donationModalState.boxId}
        preselectedCharityId={donationModalState.charityId}
      />

      <UserPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      <ImpactReportModal
        isOpen={isImpactReportOpen}
        onClose={() => setIsImpactReportOpen(false)}
      />

      <ReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState({ isOpen: false, orderId: '', targetUserId: '' })}
        orderId={reviewModalState.orderId}
        targetUserId={reviewModalState.targetUserId}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}

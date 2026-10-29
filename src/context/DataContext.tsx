import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Listing,
  Category,
  Order,
  ExchangeRequest,
  CharityFoundation,
  DropBoxLocation,
  Donation,
  Review,
  WishlistItem,
  Notification,
  ImpactReport,
  ClothingItem,
  ListingType,
  OrderStatus,
  ExchangeStatus
} from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from './AuthContext';

interface DataContextType {
  listings: Listing[];
  categories: Category[];
  orders: Order[];
  exchanges: ExchangeRequest[];
  charities: CharityFoundation[];
  dropBoxes: DropBoxLocation[];
  donations: Donation[];
  reviews: Review[];
  wishlist: WishlistItem[];
  notifications: Notification[];
  impactReport: ImpactReport;
  wishlistCount: number;
  refreshData: () => void;
  createListing: (
    itemData: Omit<ClothingItem, 'id' | 'createdAt'>,
    listingData: {
      listingType: ListingType;
      price: number;
      swapPreferences?: string;
      campusHub: string;
    }
  ) => Promise<Listing>;
  uploadListingImages: (listingId: string, files: File[]) => Promise<any>;
  deleteListingImage: (listingId: string, imageId: string) => Promise<any>;
  updateListing: (id: string, updates: Partial<Listing>) => Listing;
  deleteListing: (id: string) => void;
  toggleWishlist: (listingId: string) => boolean;
  isWishlisted: (listingId: string) => boolean;
  createOrder: (data: {
    listingId: string;
    pickupHub: string;
    meetingTime: string;
    paymentMethod: 'campus_card' | 'cash_on_pickup' | 'student_wallet';
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  proposeExchange: (data: {
    receiverId: string;
    requestedListingId: string;
    offeredItemId: string;
    message: string;
    proposedLocation: string;
    proposedDatetime: string;
  }) => Promise<ExchangeRequest>;
  updateExchangeStatus: (id: string, status: ExchangeStatus) => void;
  createDonation: (data: {
    clothingItemId: string;
    charityFoundationId: string;
    dropBoxId: string;
    weightKg: number;
    notes?: string;
  }) => Promise<Donation>;
  verifyDonation: (donationId: string, actualWeightKg?: number) => void;
  updateDropBox: (id: string, updates: Partial<DropBoxLocation>) => void;
  createReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<Review>;
  markNotificationRead: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [charities, setCharities] = useState<CharityFoundation[]>([]);
  const [dropBoxes, setDropBoxes] = useState<DropBoxLocation[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [impactReport, setImpactReport] = useState<ImpactReport>(StorageService.getImpactReport());

  const refreshData = useCallback(() => {
    setListings(StorageService.getListings());
    setCategories(StorageService.getCategories());
    setOrders(StorageService.getOrders());
    setExchanges(StorageService.getExchanges());
    setCharities(StorageService.getCharities());
    setDropBoxes(StorageService.getDropBoxes());
    setDonations(StorageService.getDonations());
    setReviews(StorageService.getReviews());
    setWishlist(StorageService.getWishlist(currentUser.id));
    setNotifications(StorageService.getNotifications(currentUser.id));
    setImpactReport(StorageService.getImpactReport());
  }, [currentUser.id]);

  useEffect(() => {
    refreshData();
    return StorageService.subscribe(refreshData);
  }, [refreshData]);

  const createListing = async (
    itemData: Omit<ClothingItem, 'id' | 'createdAt'>,
    listingData: {
      listingType: ListingType;
      price: number;
      swapPreferences?: string;
      campusHub: string;
    }
  ) => {
    const newListing = await StorageService.createListing(itemData, listingData);
    refreshData();
    return newListing;
  };

  const uploadListingImages = async (listingId: string, files: File[]) => {
    const r = await StorageService.uploadListingImages(listingId, files);
    refreshData();
    return r;
  };

  const deleteListingImage = async (listingId: string, imageId: string) => {
    const r = await StorageService.deleteListingImage(listingId, imageId);
    refreshData();
    return r;
  };

  const updateListing = (id: string, updates: Partial<Listing>) => {
    const updated = StorageService.updateListing(id, updates);
    refreshData();
    return updated;
  };

  const deleteListing = (id: string) => {
    StorageService.deleteListing(id);
    refreshData();
  };

  const toggleWishlist = (listingId: string) => {
    const isAdded = StorageService.toggleWishlist(currentUser.id, listingId);
    refreshData();
    return isAdded;
  };

  const isWishlisted = (listingId: string) => {
    return StorageService.isWishlisted(currentUser.id, listingId);
  };

  const createOrder = async (data: {
    listingId: string;
    pickupHub: string;
    meetingTime: string;
    paymentMethod: 'campus_card' | 'cash_on_pickup' | 'student_wallet';
  }) => {
    const order = await StorageService.createOrder({
      buyerId: currentUser.id,
      ...data,
    });
    refreshData();
    return order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    StorageService.updateOrderStatus(orderId, status);
    refreshData();
  };

  const proposeExchange = async (data: {
    receiverId: string;
    requestedListingId: string;
    offeredItemId: string;
    message: string;
    proposedLocation: string;
    proposedDatetime: string;
  }) => {
    const exchange = await StorageService.createExchange({
      requesterId: currentUser.id,
      ...data,
    });
    refreshData();
    return exchange;
  };

  const updateExchangeStatus = (id: string, status: ExchangeStatus) => {
    StorageService.updateExchangeStatus(id, status);
    refreshData();
  };

  const createDonation = async (data: {
    clothingItemId: string;
    charityFoundationId: string;
    dropBoxId: string;
    weightKg: number;
    notes?: string;
  }) => {
    const donation = await StorageService.createDonation({
      donorId: currentUser.id,
      ...data,
    });
    refreshData();
    return donation;
  };

  const verifyDonation = (donationId: string, actualWeightKg?: number) => {
    StorageService.verifyDonation(donationId, currentUser.id, actualWeightKg);
    refreshData();
  };

  const updateDropBox = (id: string, updates: Partial<DropBoxLocation>) => {
    StorageService.updateDropBox(id, updates);
    refreshData();
  };

  const createReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
    const rev = await StorageService.createReview(review);
    refreshData();
    return rev;
  };

  const markNotificationRead = (id: string) => {
    StorageService.markNotificationRead(id);
    refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        listings,
        categories,
        orders,
        exchanges,
        charities,
        dropBoxes,
        donations,
        reviews,
        wishlist,
        notifications,
        impactReport,
        wishlistCount: wishlist.length,
        refreshData,
        createListing,
        uploadListingImages,
        deleteListingImage,
        updateListing,
        deleteListing,
        toggleWishlist,
        isWishlisted,
        createOrder,
        updateOrderStatus,
        proposeExchange,
        updateExchangeStatus,
        createDonation,
        verifyDonation,
        updateDropBox,
        createReview,
        markNotificationRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

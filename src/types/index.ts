export type UserRole = 'student' | 'donor' | 'charity' | 'admin';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  itemId?: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  campusDorm: string;
  studentId: string;
  avatarUrl: string;
  phone?: string;
  bio?: string;
  ecoPoints: number;
  createdAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  preferredSizes: string[];
  preferredCategories: string[];
  preferredHubs: string[];
  notificationEmail: boolean;
  notificationTrades: boolean;
  ecoGoalKg: number;
  budgetMax: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
}

export type GarmentCondition = 'Brand New' | 'Like New' | 'Gently Used' | 'Well Worn';
export type ListingType = 'buy' | 'swap' | 'donate';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'exchanged' | 'donated' | 'archived';

export interface ClothingItemImage {
  id: string;
  url: string;
  publicId: string | null; // null for older rows that point at external URLs
  position: number;
  isPrimary: boolean;
}

export interface ClothingItem {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  size: string;
  condition: GarmentCondition;
  material: string;
  color: string;
  images: string[];
  imageDetails?: ClothingItemImage[]; // same images with DB id / Cloudinary public ID / order / cover flag
  estimatedRetailPrice: number;
  weightKg: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  clothingItemId: string;
  sellerId: string;
  listingType: ListingType;
  price: number;
  swapPreferences?: string;
  campusHub: string;
  status: ListingStatus;
  viewsCount: number;
  featured: boolean;
  createdAt: string;
  clothingItem?: ClothingItem;
  seller?: User;
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  listingId: string;
  totalAmount: number;
  pickupHub: string;
  meetingTime: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'campus_card' | 'cash_on_pickup' | 'student_wallet';
  createdAt: string;
  listing?: Listing;
  buyer?: User;
}

export type ExchangeStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  requestedListingId: string;
  offeredItemId: string;
  message: string;
  proposedLocation: string;
  proposedDatetime: string;
  status: ExchangeStatus;
  createdAt: string;
  completedAt?: string;
  requestedListing?: Listing;
  offeredItem?: ClothingItem;
  requester?: User;
  receiver?: User;
}

export interface CharityFoundation {
  id: string;
  name: string;
  tagline: string;
  description: string;
  mission: string;
  category: string;
  contactEmail: string;
  phone: string;
  verified: boolean;
  logoUrl: string;
  totalKgReceived: number;
  activeCampaign: string;
  location?: string;
  hostUserId?: string; // user id of the charity host account (used for messaging)
}

export type DonationStatus = 'scheduled' | 'dropped_off' | 'verified_by_council' | 'distributed';

export interface Donation {
  id: string;
  donationCode: string;
  donorId: string;
  clothingItemId: string;
  charityFoundationId: string;
  dropBoxId: string;
  weightKg: number;
  status: DonationStatus;
  dropOffDate: string;
  notes?: string;
  verifiedByAdminId?: string;
  clothingItem?: ClothingItem;
  charity?: CharityFoundation;
  dropBox?: DropBoxLocation;
  donor?: User;
}

export interface DropBoxLocation {
  id: string;
  name: string;
  campusZone: string;
  buildingName: string;
  floorLocation: string;
  hours: string;
  currentFillPercent: number;
  active: boolean;
  lastEmptiedDate: string;
  totalKgCollected: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
  addedAt: string;
  notes?: string;
  listing?: Listing;
}

export interface Review {
  id: string;
  authorId: string;
  targetUserId: string;
  transactionType: 'purchase' | 'swap' | 'donation';
  referenceId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  author?: User;
}

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: 'campus_card' | 'cash_on_pickup' | 'student_wallet';
  status: 'authorized' | 'completed' | 'refunded';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'swap_offer' | 'order_update' | 'donation_status' | 'wishlist_alert' | 'review_received';
  title: string;
  message: string;
  linkPath: string;
  isRead: boolean;
  createdAt: string;
}

export interface ImpactReport {
  id: string;
  periodName: string;
  semester: string;
  textileWasteKgDiverted: number;
  totalItemsCirculated: number;
  totalSwapsCompleted: number;
  totalDonationsKg: number;
  activeStudentsCount: number;
  featuredStories: {
    dorm: string;
    kgDiverted: number;
    highlight: string;
  }[];
  generatedAt: string;
}

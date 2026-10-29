// Client data layer. Reads are synchronous from an in-memory cache hydrated from /api/bootstrap
// (which is read from MySQL/TiDB). Writes go to the API; after each write the cache is reloaded.
import {
  User, UserPreference, Category, ClothingItem, Listing, Order, ExchangeRequest, CharityFoundation, Donation,
  DropBoxLocation, WishlistItem, Review, Notification, ImpactReport, ListingType, OrderStatus, ExchangeStatus, Message,
} from '../types';

const LS = (k: string) => 'rewear_' + k;
const lsGet = <T,>(k: string, f: T): T => { try { const r = ls?.getItem(LS(k)); return r ? (JSON.parse(r) as T) : f; } catch { return f; } };
const lsSet = (k: string, v: any) => { try { ls?.setItem(LS(k), JSON.stringify(v)); } catch { /* ignore */ } };

const ls = typeof window !== 'undefined' ? window.localStorage : null;
let token: string | null = ls ? ls.getItem(LS('token')) : null;
let cache: any = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function call<T = any>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

// run an API write in the background (optimistic UI), then re-sync from the DB
function bg(p: Promise<any>) {
  p.then(() => StorageService.load()).catch((e) => { window.alert(e.message); return StorageService.load(); }).then(notify);
}
// run an API write that the caller needs the result of
async function wait<T>(fn: () => Promise<T>): Promise<T> {
  try { const r = await fn(); await StorageService.load(); notify(); return r; }
  catch (e: any) { window.alert(e.message); throw e; }
}

export class StorageService {
  // ---- session ----
  static get token() { return token; }
  static setToken(t: string | null) { token = t; t ? ls?.setItem(LS('token'), t) : ls?.removeItem(LS('token')); if (!t) cache = null; }
  static async auth(mode: 'login' | 'register' | 'register-charity', body: any) {
    const r = await call<{ token: string }>('POST', `/auth/${mode}`, body);
    this.setToken(r.token); await this.load();
  }
  static async load() { cache = await call('GET', '/bootstrap'); }
  // ---- charity hosting (only usable from a Charity Login session; enforced by the API) ----
  static get isCharitySession(): boolean { return !!cache?.charitySession; }
  static async updateCharity(updates: Partial<{ name: string; description: string; category: string; location: string; contactEmail: string; website: string }>) {
    return wait(() => call('PATCH', '/charity/me', updates));
  }
  // public (no sign-in) charity list for the landing page
  static async fetchPublicCharities(): Promise<CharityFoundation[]> {
    const res = await fetch('/api/public/charities');
    if (!res.ok) throw new Error('Could not load charities');
    return res.json();
  }
  static get meId(): string { return cache?.me; }
  static subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

  // ---- users ----
  static getUsers(): User[] {
    const extras = lsGet<Record<string, Partial<User>>>('extras', {});
    return (cache?.users || []).map((u: User) => ({ ...u, ...(extras[u.id] || {}) }));
  }
  static getUserById(id: string) { return this.getUsers().find((u) => u.id === id); }
  static updateUser(updated: Partial<User> & { id: string }): User {
    const { id, name, campusDorm, ...rest } = updated;
    const extras = lsGet<Record<string, Partial<User>>>('extras', {});
    extras[id] = { ...(extras[id] || {}), phone: rest.phone ?? extras[id]?.phone, bio: rest.bio ?? extras[id]?.bio };
    lsSet('extras', extras);
    const u = cache.users.find((x: User) => x.id === id);
    if (name) u.name = name; if (campusDorm) u.campusDorm = campusDorm;
    if (name || campusDorm) bg(call('PATCH', '/me', { name, campusDorm }));
    return this.getUserById(id)!;
  }

  // ---- preferences (sizes + categories in user_preference; the rest is local UI state) ----
  static getPreference(userId: string): UserPreference {
    const local = lsGet<Partial<UserPreference>>('prefs_' + userId, {});
    return {
      id: 'pref-' + userId, userId, preferredSizes: cache.preferences.sizes.length ? cache.preferences.sizes : ['M'],
      preferredCategories: cache.preferences.categories.length ? cache.preferences.categories : ['Outerwear'],
      preferredHubs: ['Student Union'], notificationEmail: true, notificationTrades: true, ecoGoalKg: 15, budgetMax: 50, ...local,
    } as UserPreference;
  }
  static updatePreference(userId: string, data: Partial<UserPreference>): UserPreference {
    const { preferredSizes, preferredCategories, ...local } = data;
    lsSet('prefs_' + userId, { ...lsGet('prefs_' + userId, {}), ...local });
    if (preferredSizes) cache.preferences.sizes = preferredSizes;
    if (preferredCategories) cache.preferences.categories = preferredCategories;
    bg(call('PUT', '/preferences', { sizes: this.getPreference(userId).preferredSizes, categories: this.getPreference(userId).preferredCategories }));
    return this.getPreference(userId);
  }

  // ---- categories / items / listings ----
  static getCategories(): Category[] {
    const total = (cache?.listings || []).filter((l: Listing) => l.status === 'active').length;
    return [{ id: 'cat-all', name: 'All', slug: 'all', description: 'Complete campus circular catalog', itemCount: total }, ...(cache?.categories || [])];
  }
  static getClothingItems(): ClothingItem[] { return cache?.clothingItems || []; }
  static getClothingItemById(id: string) { return this.getClothingItems().find((c) => c.id === id); }

  static getListings(): Listing[] {
    const featured = lsGet<string[]>('featured', []);
    const users = this.getUsers(); const items = this.getClothingItems();
    return (cache?.listings || []).map((l: Listing) => ({
      ...l, featured: featured.includes(l.id) || l.featured,
      clothingItem: items.find((c) => c.id === l.clothingItemId), seller: users.find((u) => u.id === l.sellerId),
    }));
  }
  static getListingById(id: string) { return this.getListings().find((l) => l.id === id); }

  static async createListing(
    itemData: Omit<ClothingItem, 'id' | 'createdAt'>,
    listingData: { listingType: ListingType; price: number; swapPreferences?: string; campusHub: string }
  ): Promise<Listing> {
    const { id } = await wait(() => call<{ id: string }>('POST', '/listings', {
      item: { title: itemData.title, categoryId: itemData.categoryId, size: itemData.size, condition: itemData.condition, images: itemData.images },
      listing: listingData,
    }));
    return this.getListingById(id)!;
  }
  // Real image files -> Cloudinary (server) -> clothing_item_image. Errors are thrown to the caller (no alert).
  static async uploadListingImages(listingId: string, files: File[]) {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const res = await fetch(`/api/listings/${listingId}/images`, { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `Upload failed (${res.status})`), { status: res.status });
    await StorageService.load(); notify();
    return data;
  }
  static async deleteListingImage(listingId: string, imageId: string) {
    const r = await call('DELETE', `/listings/${listingId}/images/${imageId}`);
    await StorageService.load(); notify();
    return r;
  }
  static updateListing(id: string, updates: Partial<Listing>): Listing {
    const l = cache.listings.find((x: Listing) => x.id === id);
    if ('featured' in updates) {
      const f = new Set(lsGet<string[]>('featured', []));
      updates.featured ? f.add(id) : f.delete(id); lsSet('featured', [...f]);
    }
    if (l) Object.assign(l, updates);
    if (updates.status || updates.price !== undefined) bg(call('PATCH', `/listings/${id}`, { status: updates.status, price: updates.price }));
    return this.getListingById(id)!;
  }
  static deleteListing(id: string) {
    cache.listings = cache.listings.filter((l: Listing) => l.id !== id);
    bg(call('DELETE', `/listings/${id}`));
  }

  // ---- orders ----
  static getOrders(): Order[] {
    const listings = this.getListings(); const users = this.getUsers();
    return (cache?.orders || []).map((o: Order) => ({ ...o, listing: listings.find((l) => l.id === o.listingId), buyer: users.find((u) => u.id === o.buyerId) }));
  }
  static async createOrder(data: { buyerId: string; listingId: string; pickupHub: string; meetingTime: string; paymentMethod: any }): Promise<Order> {
    const { id } = await wait(() => call<{ id: string }>('POST', '/orders', { listingId: data.listingId }));
    const o = this.getOrders().find((x) => x.id === id)!;
    return { ...o, pickupHub: data.pickupHub, meetingTime: data.meetingTime, paymentMethod: data.paymentMethod };
  }
  static updateOrderStatus(orderId: string, status: OrderStatus) {
    const o = cache.orders.find((x: Order) => x.id === orderId); if (o) o.orderStatus = status;
    bg(call('PATCH', `/orders/${orderId}`, { status }));
    return this.getOrders().find((x) => x.id === orderId)!;
  }

  // ---- exchanges ----
  static getExchanges(): ExchangeRequest[] {
    const listings = this.getListings(); const items = this.getClothingItems(); const users = this.getUsers();
    return (cache?.exchanges || []).map((e: ExchangeRequest) => ({
      ...e, requestedListing: listings.find((l) => l.id === e.requestedListingId), offeredItem: items.find((i) => i.id === e.offeredItemId),
      requester: users.find((u) => u.id === e.requesterId), receiver: users.find((u) => u.id === e.receiverId),
    }));
  }
  static async createExchange(data: { requesterId: string; receiverId: string; requestedListingId: string; offeredItemId: string; message: string; proposedLocation: string; proposedDatetime: string }): Promise<ExchangeRequest> {
    const { id } = await wait(() => call<{ id: string }>('POST', '/exchanges', { requestedListingId: data.requestedListingId, offeredItemId: data.offeredItemId }));
    return this.getExchanges().find((e) => e.id === id)!;
  }
  static updateExchangeStatus(id: string, status: ExchangeStatus) {
    const e = cache.exchanges.find((x: ExchangeRequest) => x.id === id); if (e) e.status = status;
    bg(call('PATCH', `/exchanges/${id}`, { status }));
    return this.getExchanges().find((x) => x.id === id)!;
  }

  // ---- charities & donations (drop boxes are a UI concept only; stored in collection_method) ----
  static getCharities(): CharityFoundation[] { return cache?.charities || []; }
  static getDropBoxes(): DropBoxLocation[] { return cache?.dropBoxes || []; }
  static updateDropBox(id: string, updates: Partial<DropBoxLocation>): DropBoxLocation {
    const b = this.getDropBoxes().find((x) => x.id === id)!;
    Object.assign(b, updates);
    bg(call('PATCH', `/dropoffs/${id}`, { currentFillPercent: updates.currentFillPercent, active: updates.active, lastEmptiedDate: updates.lastEmptiedDate }));
    return b;
  }

  // ---- messages (DB table: message) ----
  static getMessages(): Message[] { return cache?.messages || []; }
  static sendMessage(recipientId: string, body: string, itemId?: string) { return wait(() => call('POST', '/messages', { recipientId, body, itemId })); }
  static markMessagesRead(ids: string[]) {
    const now = new Date().toISOString();
    (cache?.messages || []).forEach((m: Message) => { if (ids.includes(m.id)) m.readAt = now; });
    bg(Promise.all(ids.map((id) => call('POST', `/messages/${id}/read`, {}))));
  }
  static getDonations(): Donation[] {
    const items = this.getClothingItems(); const ch = this.getCharities(); const boxes = this.getDropBoxes(); const users = this.getUsers();
    return (cache?.donations || []).map((d: Donation) => ({
      ...d, clothingItem: items.find((i) => i.id === d.clothingItemId), charity: ch.find((c) => c.id === d.charityFoundationId),
      dropBox: boxes.find((b) => b.id === d.dropBoxId), donor: users.find((u) => u.id === d.donorId),
    }));
  }
  static async createDonation(data: { donorId: string; clothingItemId: string; charityFoundationId: string; dropBoxId: string; weightKg: number; notes?: string }): Promise<Donation> {
    const { id } = await wait(() => call<{ id: string }>('POST', '/donations', data));
    notify();
    return this.getDonations().find((d) => d.id === id)!;
  }
  static verifyDonation(donationId: string, _adminId: string, _w?: number): Donation {
    const d = cache.donations.find((x: Donation) => x.id === donationId); if (d) d.status = 'verified_by_council';
    bg(call('POST', `/donations/${donationId}/verify`, {}));
    return this.getDonations().find((x) => x.id === donationId)!;
  }

  // ---- wishlist ----
  static getWishlist(_userId: string): WishlistItem[] {
    const listings = this.getListings();
    return (cache?.wishlist || []).map((w: WishlistItem) => ({ ...w, listing: listings.find((l) => l.id === w.listingId) }));
  }
  static isWishlisted(_u: string, listingId: string) { return (cache?.wishlist || []).some((w: WishlistItem) => w.listingId === listingId); }
  static toggleWishlist(userId: string, listingId: string): boolean {
    const had = this.isWishlisted(userId, listingId);
    cache.wishlist = had ? cache.wishlist.filter((w: WishlistItem) => w.listingId !== listingId)
      : [...cache.wishlist, { id: 'tmp-' + listingId, userId, listingId, addedAt: new Date().toISOString() }];
    bg(call('POST', '/wishlist/toggle', { listingId }));
    return !had;
  }

  // ---- reviews ----
  static getReviews(): Review[] { const u = this.getUsers(); return (cache?.reviews || []).map((r: Review) => ({ ...r, author: u.find((x) => x.id === r.authorId) })); }
  static async createReview(r: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const { id } = await wait(() => call<{ id: string }>('POST', '/reviews', r));
    return this.getReviews().find((x) => x.id === id)!;
  }

  // ---- notifications (derived on the server from exchange / order rows) ----
  static getNotifications(_userId: string): Notification[] {
    const read = lsGet<string[]>('read', []);
    return (cache?.notifications || []).map((n: Notification) => ({ ...n, isRead: read.includes(n.id) }));
  }
  static markNotificationRead(id: string) { lsSet('read', [...lsGet<string[]>('read', []), id]); }

  // ---- impact ----
  static getImpactReport(): ImpactReport { return cache.impact; }
}

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { GarmentCondition, ListingType } from '../types';

interface ListItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated?: (listingId: string) => void;
}

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const PRESET_IMAGES = [
  { label: 'Denim Jeans', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6LWc-9CSgBIhsDsu6aBeM9fibvsQDYUUmqZr58MPZQ7H6BwIpRStA8Pktc3j7I_fl_afzP7Z0Y-htIdiV6ZZwz8savgYh7X4X4561KmOPakTwAARdmsgD9p1AYHKJfdFpn-zFvgtyZ4N4q6aa1OL8L52MBu-IleT5WSergJVd3T7CfsuokFL8yp31d-hd1XzHbU_EcMAXDGsGriB2yNdQbpbndumPjxm4-eifSfkn-zykpSu6XyM7' },
  { label: 'Fleece Pullover', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeRBX5y_V_47L2GsQEBNM4V9BSs4p6aUbGxLEZqks576Rx3b8ivAZ-2fC8cfGwL6QvX9ZMrVqOAw5CEwWFbWquCVclO82PHsKwPnT7oFO3bnhPHwVm4sHaj2UdQB7bvxk9bvL8BW4BD8Uu_LBf_6k7jwSz_WJW0CRILoQNQc1AI7tGDvQrWv2JwpO8JQSxO9j4QiB5KHbXkzwT9htp7IbqajO6MsFGYn-PrNdMIXGkhKuM-wl8hknv' },
  { label: 'Wool Knit', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAz5YSq5NecD24QACVnPBbebh7gQ6qLoo4CINO_Uzm9960a0A6gDaWUDvKm-rCt4G_yQ3e3rEc96EeFxKL16RbqHAdzriCfBdxwGBt5DE9pMx2vIb5FzPWeggJNj0kC_YZ_HYGEhpxn2cuFrgijoB9tiwbW-dhsgk2Oc-iTeCnd1zknJpguNjeWSHPC-daVYt19QiTteCmAIxVUtPZcoflZCK6giigmfSkxrg6dmy6wSL_Eqr-Z4-Ao' },
  { label: 'Canvas Jacket', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRXuRzD65I3op0H9v4akNpMD-pYCI8h_zH9xifpEGv8MKAEmk7k8XFkDM6QnHsQers000Wz28ovX-eC8Q7YQzLmVeL6Wq4Ux4BGoYmgVN2G3bG1poZkdhJq5bt1kzPFD5kE5PjGXnmxuuiV5teSWksjUB2P3fEETai9Jr-BKq_gbWT24xetP1Kiqjnk2QXSymNzgUKixj6SiwosDVhAiIJRAyLUu8A0v3uxWvmWJaDJn8jr_4qClgA' },
];

export const ListItemModal: React.FC<ListItemModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
}) => {
  const { currentUser } = useAuth();
  const { createListing, uploadListingImages, categories } = useData();

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('cat-outerwear');
  const [size, setSize] = useState('Size M');
  const [condition, setCondition] = useState<GarmentCondition>('Gently Used');
  const [material, setMaterial] = useState('100% Cotton');
  const [color, setColor] = useState('Vintage Wash');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [listingType, setListingType] = useState<ListingType>('buy');
  const [price, setPrice] = useState(25);
  const [swapPreferences, setSwapPreferences] = useState('');
  const [campusHub, setCampusHub] = useState('Student Union');
  const [weightKg, setWeightKg] = useState(0.7);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null); // set once the listing exists, so a failed photo upload can be retried without duplicating it
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  if (!isOpen) return null;

  const pickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (!ALLOWED.includes(f.type)) { setError(`${f.name}: only JPG, PNG or WebP images.`); continue; }
      if (f.size === 0 || f.size > MAX_BYTES) { setError(`${f.name}: must be between 1 byte and 5 MB.`); continue; }
      if (next.length >= MAX_FILES) { setError(`You can add up to ${MAX_FILES} photos.`); break; }
      next.push(f); setError(null);
    }
    setFiles(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brand.trim()) {
      setError('Please provide garment title and brand.');
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      let listingId = createdId;
      if (!listingId) {
        const newListing = await createListing(
        {
          ownerId: currentUser.id,
          title: title.trim(),
          description: description.trim() || 'Clean pre-loved piece in excellent condition.',
          brand: brand.trim(),
          categoryId,
          size,
          condition,
          material,
          color,
          images: files.length ? [] : [imageUrl], // real files are uploaded right after the listing is created
          estimatedRetailPrice: price > 0 ? price * 3 : 95,
          weightKg: Number(weightKg) || 0.7,
        },
        {
          listingType,
          price: listingType === 'donate' ? 0 : Number(price) || 0,
          swapPreferences: listingType === 'swap' ? swapPreferences : undefined,
          campusHub,
        }
        );
        listingId = newListing.id;
        setCreatedId(listingId);
      }

      if (files.length) {
        try { await uploadListingImages(listingId, files); }
        catch (err: any) { setError(`Listing published, but photos failed: ${err.message}. Press Publish to retry the upload.`); return; }
      }

      if (onListingCreated) onListingCreated(listingId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish listing');
    } finally {
      setBusy(false);
    }
  };

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

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Circular Wardrobe
          </div>
          <h2 className="text-2xl font-semibold text-[#161617] tracking-tight">
            List an Item from Your Dorm
          </h2>
          <p className="text-[13px] text-[#86868B] mt-0.5">
            Give a pre-loved garment another life. Sell to peers, swap 1:1, or donate.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[13px] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
          {/* Listing Type Selector */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1.5">
              Listing Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setListingType('buy')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  listingType === 'buy'
                    ? 'bg-[#161617] text-white border-[#161617]'
                    : 'bg-[#FAF9F6] border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7]'
                }`}
              >
                Peer Thrift (Sell)
              </button>
              <button
                type="button"
                onClick={() => setListingType('swap')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  listingType === 'swap'
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-[#FAF9F6] border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7]'
                }`}
              >
                Zero-Cash Swap
              </button>
              <button
                type="button"
                onClick={() => setListingType('donate')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  listingType === 'donate'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-[#FAF9F6] border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7]'
                }`}
              >
                Charity Donation
              </button>
            </div>
          </div>

          {/* Real photo upload (stored in Cloudinary) */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1.5">
              Upload Photos (JPG, PNG, WebP · up to {MAX_FILES} · 5 MB each)
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={!!createdId}
              onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }}
              className="block w-full text-[12px] text-[#161617] file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-[#F5F5F7] file:text-[#161617] file:cursor-pointer"
            />
            {files.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5E5EA]">
                    <img src={src} alt={files[i].name} className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">Cover</span>}
                    {!createdId && (
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[11px] leading-none cursor-pointer"
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Preset Selector (used only when no photo is uploaded) */}
          <div className={files.length ? 'opacity-40 pointer-events-none' : ''}>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1.5">
              Garment Photography Preset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    imageUrl === img.url ? 'border-[#161617] ring-1 ring-[#161617]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Garment Title
              </label>
              <input
                type="text"
                placeholder="e.g. Ribbed Knit Sweater"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] focus:outline-none focus:border-[#161617]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Patagonia, Levi's, Everlane"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] focus:outline-none focus:border-[#161617]"
                required
              />
            </div>
          </div>

          {/* Category, Size, Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
              >
                {categories.filter(c => c.slug !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Size M, 30/32..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
              >
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Gently Used">Gently Used</option>
                <option value="Well Worn">Well Worn</option>
              </select>
            </div>
          </div>

          {/* Price & Campus Pickup Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listingType !== 'donate' ? (
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Donation Target
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                  Free Student Clothing Bank
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                Campus Meetup Hub
              </label>
              <select
                value={campusHub}
                onChange={(e) => setCampusHub(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
              >
                <option value="Student Union">Student Union (Central)</option>
                <option value="North Hall">North Hall Lobby</option>
                <option value="East Dorms">East Dorms Hub</option>
                <option value="South Campus">South Campus Station</option>
                <option value="Central Library">Central Library Quad</option>
                <option value="Engineering Quad">Engineering Quad</option>
                <option value="West Quad">West Quad Lounge</option>
              </select>
            </div>
          </div>

          {listingType === 'swap' && (
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                What are you looking to trade for?
              </label>
              <input
                type="text"
                placeholder="e.g. Looking for heavy fleece in Size L, or vintage workwear"
                value={swapPreferences}
                onChange={(e) => setSwapPreferences(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
              Garment Notes & Fit
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell other students about the fabric, how often it was worn, and how it fits..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#F2F2F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-full bg-[#161617] text-white hover:bg-black font-medium transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Publishing…' : 'Publish to Campus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

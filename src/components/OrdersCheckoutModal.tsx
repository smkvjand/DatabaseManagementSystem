import React, { useState } from 'react';
import { Listing, Order } from '../types';
import { useData } from '../context/DataContext';

interface OrdersCheckoutModalProps {
  listing: Listing | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const OrdersCheckoutModal: React.FC<OrdersCheckoutModalProps> = ({
  listing,
  onClose,
  onOrderSuccess,
}) => {
  const { createOrder } = useData();

  const [pickupHub, setPickupHub] = useState(listing?.campusHub || 'Student Union');
  const [meetingTime, setMeetingTime] = useState('Today at 4:30 PM between classes');
  const [paymentMethod, setPaymentMethod] = useState<'campus_card' | 'cash_on_pickup' | 'student_wallet'>('campus_card');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!listing || !listing.clothingItem) return null;
  const cloth = listing.clothingItem;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await createOrder({
      listingId: listing.id,
      pickupHub,
      meetingTime,
      paymentMethod,
    });
    setConfirmedOrder(order);
    onOrderSuccess(order);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#E5E5EA] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#161617] hover:bg-[#E5E5EA] cursor-pointer"
        >
          ✕
        </button>

        {!confirmedOrder ? (
          <div>
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Direct Campus Thrift
              </div>
              <h2 className="text-2xl font-semibold text-[#161617] tracking-tight">
                Order & Campus Pickup
              </h2>
              <p className="text-[13px] text-[#86868B] mt-0.5">
                Collect directly between classes. Zero packaging waste, zero courier emissions.
              </p>
            </div>

            {/* Order Item Summary */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] flex gap-4 mb-5">
              <img
                src={cloth.images[0]}
                alt={cloth.title}
                className="w-16 h-20 rounded-lg object-cover bg-white"
              />
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-wider text-[#86868B] font-medium">
                  {cloth.brand} • {cloth.size}
                </div>
                <h4 className="font-semibold text-[#161617] text-[14px] mt-0.5">{cloth.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-[#161617]">${listing.price}</span>
                  <span className="text-[11px] text-[#86868B]">Condition: {cloth.condition}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-4 text-[13px]">
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Designated Campus Meetup Hub
                </label>
                <select
                  value={pickupHub}
                  onChange={(e) => setPickupHub(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617] bg-white"
                >
                  <option value="North Hall Lobby">North Hall Residence Lobby</option>
                  <option value="Student Union Lobby">Student Union East Atrium</option>
                  <option value="Central Library Atrium">Central Library Circulation Exit</option>
                  <option value="East Dorms Commons">East Dorms Student Commons</option>
                  <option value="South Campus Quad">South Campus Quad Breezeway</option>
                  <option value="Engineering Quad Café">Engineering Quad Café</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Proposed Time Window
                </label>
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="e.g. Today at 4:30 PM between classes"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[#161617]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'campus_card', label: 'Campus Card' },
                    { id: 'cash_on_pickup', label: 'Cash On Hand' },
                    { id: 'student_wallet', label: 'ReWear Wallet' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentMethod(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        paymentMethod === p.id
                          ? 'bg-[#161617] text-white border-[#161617]'
                          : 'bg-white border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <div className="text-[12px]">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus Meetup Safety Reminder */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] text-[12px] text-[#414844] space-y-1">
                <div className="font-semibold text-[#161617]">Campus Safety Honor Protocol:</div>
                <div>Meet inside designated university buildings during daylight hours. Inspect garment quality before handing over payment.</div>
              </div>

              <div className="pt-3 border-t border-[#F2F2F7] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#86868B] block">Total Due</span>
                  <span className="text-xl font-bold text-[#161617]">${listing.price}</span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#161617] text-white hover:bg-black font-medium transition-all shadow-xs cursor-pointer"
                >
                  Confirm & Schedule Pickup
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[30px]">check</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#161617] tracking-tight">
              Pickup Scheduled!
            </h3>
            <p className="font-mono text-sm font-bold text-emerald-800 mt-1">
              Order #{confirmedOrder.orderNumber}
            </p>
            <p className="text-[13px] text-[#86868B] mt-2 max-w-sm mx-auto">
              Your meetup with the seller is set for <strong className="text-[#161617]">{confirmedOrder.meetingTime}</strong> at <strong className="text-[#161617]">{confirmedOrder.pickupHub}</strong>.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E5EA] text-left text-[12px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#86868B]">Garment:</span>
                <span className="font-medium text-[#161617]">{cloth.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Amount:</span>
                <span className="font-medium text-[#161617]">${confirmedOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Payment:</span>
                <span className="font-medium text-[#161617] capitalize">
                  {confirmedOrder.paymentMethod.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Textile Diverted:</span>
                <span className="font-semibold text-emerald-800">
                  {cloth.weightKg} kg added to university council tally
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-full bg-[#161617] text-white text-[13px] font-medium hover:bg-black transition-all cursor-pointer"
            >
              Done & Return to Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

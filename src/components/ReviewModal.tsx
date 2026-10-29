import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  targetUserId: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  targetUserId,
}) => {
  const { currentUser } = useAuth();
  const { createReview } = useData();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReview({
      authorId: currentUser.id,
      targetUserId,
      transactionType: 'purchase',
      referenceId: orderId,
      rating,
      comment: comment.trim() || 'Great campus meetup! Item was in excellent condition.',
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-[#E5E5EA] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#161617] hover:bg-[#E5E5EA] cursor-pointer"
        >
          ✕
        </button>

        {!submitted ? (
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Community Trust
              </span>
              <h2 className="text-xl font-semibold text-[#161617] tracking-tight">
                Rate Campus Exchange
              </h2>
              <p className="text-[13px] text-[#86868B] mt-0.5">
                Help classmates build their trusted circular fashion rating.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                        star <= rating ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-sm font-semibold text-[#161617] ml-2">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-[#86868B] block mb-1">
                  Your Feedback
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the garment condition? Was the dorm meetup smooth?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[#161617]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#F2F2F7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#E5E5EA] text-[#161617] hover:bg-[#F5F5F7] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#161617] text-white hover:bg-black font-medium transition-all shadow-xs"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <h3 className="text-xl font-semibold text-[#161617]">Thank you!</h3>
            <p className="text-[13px] text-[#86868B] mt-1">
              Your feedback has been published to the student's campus profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

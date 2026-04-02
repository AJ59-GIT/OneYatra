
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Star, Camera, Send, CheckCircle2, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '../components/Button';
import { getUserBookings } from '../services/bookingService';
import { Booking } from '../types';

export const ReviewSubmissionPage = ({ onBack }: { onBack: () => void }) => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const bookings = getUserBookings();
      const found = bookings.find(b => b.id === bookingId);
      if (found) {
        setBooking(found);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Thank You for Your Feedback!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Your review helps us improve the travel experience for everyone. We've added 50 loyalty points to your account as a token of appreciation.</p>
        <Button onClick={onBack} size="lg">Back to My Trips</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!booking && bookingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
        <Button onClick={onBack}>Back to My Trips</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Rate Your Journey</h1>
        <p className="text-gray-600 dark:text-gray-400">
          How was your trip {booking ? `from ${booking.origin?.split(',')[0]} to ${booking.destination?.split(',')[0]} with ${booking.option.provider}` : 'with us'}?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Rating */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Overall Experience</h3>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={`h-12 w-12 ${
                    (hoverRating || rating) >= star 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-200 dark:text-slate-700'
                  }`} 
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-gray-500">
            {rating === 1 && "Disappointing"}
            {rating === 2 && "Could be better"}
            {rating === 3 && "Good"}
            {rating === 4 && "Great"}
            {rating === 5 && "Excellent!"}
          </p>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-600" /> Tell us more
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What did you like or dislike?</label>
              <textarea 
                rows={4}
                placeholder="Share your experience (cleanliness, punctuality, staff behavior...)"
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Add Photos (Optional)</label>
              <div className="flex flex-wrap gap-4">
                <button type="button" className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-all">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specific Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Punctuality', key: 'punctuality' },
            { label: 'Cleanliness', key: 'cleanliness' },
            { label: 'Staff Behavior', key: 'staff' },
            { label: 'Value for Money', key: 'value' }
          ].map((item) => (
            <div key={item.key} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
              <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 text-gray-200 dark:text-slate-700" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" size="lg" className="w-full py-4 text-lg shadow-xl shadow-brand-500/20" disabled={rating === 0}>
          <Send className="h-5 w-5 mr-2" /> Submit Review
        </Button>
      </form>
    </div>
  );
};

export default ReviewSubmissionPage;

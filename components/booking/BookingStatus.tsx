import React from 'react';
import { CheckCircle, XCircle, Loader2, Printer, Download, Mail, ExternalLink, Ticket, QrCode, Calendar, MapPin, Users, CreditCard, ShieldCheck, ArrowRight, Share2, Building2 } from 'lucide-react';
import { Booking } from '../../types';
import { Button } from '../Button';

interface BookingStatusProps {
  step: 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'PENDING_APPROVAL';
  booking: Booking | null;
  processingStatus: string;
  onComplete: () => void;
}

export const BookingStatus: React.FC<BookingStatusProps> = ({ step, booking, processingStatus, onComplete }) => {
  if (step === 'PROCESSING') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95">
        <div className="relative mb-8">
            <Loader2 className="h-20 w-20 text-brand-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Ticket className="h-8 w-8 text-brand-400 opacity-50" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Your Booking</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">{processingStatus}</p>
        
        <div className="mt-12 w-full max-w-sm bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Secure Transaction</span>
            </div>
            <div className="space-y-2">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 animate-progress-slow"></div>
                </div>
                <p className="text-[10px] text-gray-400 text-center italic">Please do not refresh or close this window</p>
            </div>
        </div>
      </div>
    );
  }

  if (step === 'CONFIRMED' && booking) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 relative">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm">
                <div className="bg-green-500 w-4 h-4 rounded-full animate-ping"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 dark:text-gray-400">Your trip has been successfully booked. Reference: <span className="font-mono font-bold text-gray-900 dark:text-white select-all">{booking.id}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-brand-600" />
                    Trip Details
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{booking.origin} <ArrowRight className="inline h-3 w-3 mx-1" /> {booking.destination}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Date & Time</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{booking.travelDate} at {booking.option.departureTime}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{booking.passengers.length} Traveler(s)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl mb-4">
                    <QrCode className="h-24 w-24 text-gray-900 dark:text-white opacity-80" />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Digital Ticket QR</p>
                <p className="text-[10px] text-gray-400 mt-1">Scan at terminal for entry</p>
            </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                <Download className="h-4 w-4" /> E-Ticket
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                <Mail className="h-4 w-4" /> Email
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                <Printer className="h-4 w-4" /> Print
            </button>
            <button className="flex items-center justify-center p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors">
                <Share2 className="h-4 w-4" />
            </button>
        </div>

        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-6 border border-brand-100 dark:border-brand-800 mb-10">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                    <ExternalLink className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300">Need a place to stay?</h4>
                    <p className="text-xs text-brand-700 dark:text-brand-400 mt-1">Get up to 20% off on hotel bookings near your destination.</p>
                    <button className="mt-3 text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline">
                        Explore Hotels <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>

        <Button onClick={onComplete} className="w-full py-4 text-lg shadow-lg shadow-brand-500/20">Go to My Trips</Button>
      </div>
    );
  }

  if (step === 'FAILED') {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in-95">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6 relative">
          <XCircle className="h-12 w-12 text-red-600" />
          <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm">
              <div className="bg-red-500 w-4 h-4 rounded-full"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Failed</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">We couldn't process your payment. This could be due to insufficient funds, network issues, or bank rejection.</p>
        
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <Button onClick={() => window.location.reload()} className="w-full py-4">Try Again</Button>
            <Button variant="outline" onClick={onComplete} className="w-full">View Other Options</Button>
        </div>

        <p className="mt-8 text-xs text-gray-400">If money was deducted, it will be refunded within 5-7 business days.</p>
      </div>
    );
  }

  if (step === 'PENDING_APPROVAL') {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in-95">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 relative">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-400 opacity-50" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Approval</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Your booking has been submitted for corporate approval. You'll be notified once your manager reviews the request.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 mb-8 max-w-sm mx-auto text-left">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Approver</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">John Doe (Manager)</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">SLA</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">~4 hours</span>
            </div>
        </div>

        <Button onClick={onComplete} className="w-full max-w-sm py-4">Go to My Trips</Button>
      </div>
    );
  }

  return null;
};

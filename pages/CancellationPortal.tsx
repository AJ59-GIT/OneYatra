
import React, { useState } from 'react';
import { ArrowLeft, Search, RefreshCw, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Button } from '../components/Button';

export const CancellationPortal = ({ onBack }: { onBack: () => void }) => {
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('IDLE');

  const handleSearch = () => {
    if (!bookingId) return;
    setStatus('SEARCHING');
    setTimeout(() => {
      if (bookingId.length > 5) setStatus('FOUND');
      else setStatus('NOT_FOUND');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cancellation & Refund Portal</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your cancellations and track refund status in one place.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Track Refund or Initiate Cancellation</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value.toUpperCase())}
              placeholder="Enter Booking ID (e.g. OY-123456)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
          <Button onClick={handleSearch} disabled={status === 'SEARCHING'}>
            {status === 'SEARCHING' ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Search Booking'}
          </Button>
        </div>
      </div>

      {status === 'FOUND' && (
        <div className="space-y-6 animate-in slide-in-from-top-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-2 inline-block">Confirmed</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">OY-{bookingId}</h3>
                <p className="text-sm text-gray-500">Mumbai to Delhi • 28 Mar 2026</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Paid</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹4,500</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">Cancellation Policy</h4>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    You are eligible for a <strong>₹4,200 refund</strong> if cancelled now. ₹300 cancellation fee applies.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">Cancel Booking</Button>
              <Button className="flex-1">Keep Booking</Button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Refund Requests</h3>
            <div className="space-y-4">
              {[
                { id: 'REF-9921', date: '15 Mar', amount: '₹1,200', status: 'Processed' },
                { id: 'REF-8812', date: '10 Mar', amount: '₹2,500', status: 'Pending' }
              ].map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{ref.id}</p>
                      <p className="text-xs text-gray-500">{ref.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{ref.amount}</p>
                    <p className={`text-[10px] font-bold ${ref.status === 'Processed' ? 'text-green-600' : 'text-yellow-600'}`}>{ref.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'NOT_FOUND' && (
        <div className="text-center py-12 animate-in fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Booking Not Found</h3>
          <p className="text-gray-500 text-sm mt-2">We couldn't find any booking with ID "{bookingId}". Please check and try again.</p>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4">
          <CheckCircle2 className="h-8 w-8 text-brand-500 mx-auto mb-3" />
          <h4 className="font-bold text-sm mb-1">Instant Refunds</h4>
          <p className="text-xs text-gray-500">Refunds to OneYatra Wallet are processed instantly.</p>
        </div>
        <div className="text-center p-4">
          <Clock className="h-8 w-8 text-brand-500 mx-auto mb-3" />
          <h4 className="font-bold text-sm mb-1">24/7 Tracking</h4>
          <p className="text-xs text-gray-500">Track your refund status anytime through this portal.</p>
        </div>
        <div className="text-center p-4">
          <RefreshCw className="h-8 w-8 text-brand-500 mx-auto mb-3" />
          <h4 className="font-bold text-sm mb-1">Easy Process</h4>
          <p className="text-xs text-gray-500">Cancel your trips with just a few clicks.</p>
        </div>
      </div>
    </div>
  );
};

export default CancellationPortal;

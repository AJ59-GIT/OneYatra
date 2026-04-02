
import React from 'react';
import { ArrowLeft, Gift, Share2, Users, Trophy, Copy, Check } from 'lucide-react';
import { Button } from '../components/Button';

export const ReferAndEarnPage = ({ onBack }: { onBack: () => void }) => {
  const [copied, setCopied] = React.useState(false);
  const referralCode = "YATRA500";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-8 text-white mb-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4">Refer & Earn ₹500</h1>
            <p className="text-brand-100 text-lg mb-6">Invite your friends to OneYatra and earn rewards for every successful booking they make.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-200">Your Referral Code</p>
                  <p className="text-2xl font-mono font-bold">{referralCode}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-white text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <Button variant="outline" className="bg-white text-brand-600 border-white hover:bg-brand-50 py-4 px-8">
                <Share2 className="h-5 w-5 mr-2" /> Share Now
              </Button>
            </div>
          </div>
          <div className="w-48 h-48 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-inner">
            <Gift className="h-24 w-24 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Share2, title: 'Share Link', desc: 'Send your unique referral link to friends and family.' },
          { icon: Users, title: 'Friend Joins', desc: 'They sign up and complete their first trip using your code.' },
          { icon: Trophy, title: 'Get Rewards', desc: 'You get ₹500 in your OneYatra Wallet instantly.' }
        ].map((step, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <step.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Leaderboard</h2>
        <div className="space-y-4">
          {[
            { name: 'Rahul S.', referrals: 42, earned: '₹21,000' },
            { name: 'Priya M.', referrals: 38, earned: '₹19,000' },
            { name: 'Amit K.', referrals: 25, earned: '₹12,500' }
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-bold text-brand-600">
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.referrals} successful referrals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-600">{user.earned}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Earned</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferAndEarnPage;

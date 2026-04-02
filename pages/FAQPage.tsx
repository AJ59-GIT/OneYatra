
import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';

const FAQS = [
  {
    category: "Booking & Payments",
    questions: [
      { q: "How do I book a ticket on OneYatra?", a: "Simply enter your origin, destination, and travel date on the home page. Choose your preferred travel option, enter passenger details, and complete the payment." },
      { q: "What payment methods are supported?", a: "We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and OneYatra Wallet." },
      { q: "Can I book for a group?", a: "Yes, you can book for up to 10 passengers at once. For larger groups, please use our Group Booking portal." }
    ]
  },
  {
    category: "Cancellations & Refunds",
    questions: [
      { q: "How do I cancel my booking?", a: "Go to 'My Trips', select the booking you want to cancel, and click on 'Cancel Booking'. You can also use our Cancellation Portal." },
      { q: "When will I receive my refund?", a: "Refunds to OneYatra Wallet are instant. For other methods, it usually takes 5-7 business days depending on your bank." }
    ]
  },
  {
    category: "Account & Security",
    questions: [
      { q: "How do I secure my account?", a: "We recommend using a strong password and enabling Two-Factor Authentication (2FA) in your profile settings." },
      { q: "What is the Document Vault?", a: "The Document Vault is a secure space to store your IDs (Aadhaar, Passport, etc.) for quick autofill during booking." }
    ]
  }
];

export const FAQPage = ({ onBack }: { onBack: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How can we help you?</h1>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for questions, topics..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg text-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our support team instantly.' },
          { icon: Phone, title: 'Call Us', desc: 'Available 24/7 at +91 1800-YATRA' },
          { icon: Mail, title: 'Email Support', desc: 'Email us at support@oneyatra.com' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 text-center shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <item.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-12">
        {FAQS.map((cat, catIdx) => (
          <div key={catIdx}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-600" /> {cat.category}
            </h2>
            <div className="space-y-4">
              {cat.questions.map((faq, qIdx) => {
                const id = `${catIdx}-${qIdx}`;
                const isExpanded = expandedIndex === id;
                return (
                  <div key={qIdx} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden transition-all">
                    <button 
                      onClick={() => toggleExpand(id)}
                      className="w-full p-6 flex justify-between items-center text-left focus:outline-none"
                    >
                      <span className="font-bold text-gray-800 dark:text-gray-200">{faq.q}</span>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 bg-brand-50 dark:bg-brand-900/20 rounded-3xl p-10 text-center border border-brand-100 dark:border-brand-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Still have questions?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">If you couldn't find the answer you were looking for, please get in touch with our team.</p>
        <Button size="lg" className="px-10">Contact Support</Button>
      </div>
    </div>
  );
};

export default FAQPage;

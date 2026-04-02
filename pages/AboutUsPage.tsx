
import React from 'react';
import { ArrowLeft, Target, Heart, Users, ShieldCheck, Globe, Award } from 'lucide-react';

export const AboutUsPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Redefining Mobility in India</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          OneYatra is on a mission to make travel seamless, sustainable, and accessible for everyone across the Indian subcontinent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src="https://picsum.photos/seed/travel/800/600" 
            alt="Travel" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <p className="text-white font-bold text-lg italic">"Connecting billions, one journey at a time."</p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Story</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            Founded in 2024, OneYatra started with a simple observation: traveling between cities in India was often a fragmented and stressful experience. From booking multiple tickets to navigating last-mile connectivity, the journey was harder than it needed to be.
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We built OneYatra to be the "One Stop" for all your travel needs. Whether it's a local train in Mumbai, a flight to Bangalore, or a cab in Varanasi, we bring everything together in one unified platform.
          </p>
        </div>
      </div>

      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Heart, title: 'User First', desc: 'Every feature we build starts with the question: "How does this make travel better for our users?"' },
            { icon: Target, title: 'Precision', desc: 'We leverage real-time data and AI to provide the most accurate routes and timings.' },
            { icon: Globe, title: 'Sustainability', desc: 'We are committed to reducing the carbon footprint of travel through eco-friendly options.' }
          ].map((value, i) => (
            <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mb-6">
                <value.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-600 rounded-3xl p-12 text-white text-center mb-20 shadow-xl">
        <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
        <p className="text-brand-100 mb-8 max-w-xl mx-auto">We're always looking for passionate individuals to join our team and help shape the future of mobility.</p>
        <div className="flex justify-center gap-4">
          <button className="bg-white text-brand-600 px-8 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors">View Careers</button>
          <button className="bg-brand-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors">Contact Us</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <p className="text-4xl font-bold text-brand-600 mb-1">10M+</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Happy Travelers</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-brand-600 mb-1">500+</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Cities Covered</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-brand-600 mb-1">50k+</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Partners</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-brand-600 mb-1">4.8/5</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">App Rating</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;

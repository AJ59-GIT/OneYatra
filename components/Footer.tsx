
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const Footer = () => {
  const navigate = useNavigate();
  const { t } = useSettings();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Blog', path: '/blog' },
        { label: 'Careers', path: '/about' },
        { label: 'Press', path: '/about' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center (FAQ)', path: '/faq' },
        { label: 'Travel Rules & MaaS', path: '/travel-rules' },
        { label: 'Cancellation Portal', path: '/cancellation' },
        { label: 'Contact Us', path: '/support' }
      ]
    },
    {
      title: 'Partners',
      links: [
        { label: 'Vendor Onboarding', path: '/vendor-onboarding' },
        { label: 'Corporate Travel', path: '/corporate' },
        { label: 'Affiliate Program', path: '/refer-earn' },
        { label: 'Agent Login', path: '/vendor-onboarding' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Cookie Policy', path: '/privacy' },
        { label: 'Security', path: '/privacy' }
      ]
    }
  ];

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-brand-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t('app_name')}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              India's most trusted unified mobility platform. Connecting billions, one journey at a time.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <button key={i} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 text-gray-400 hover:text-brand-500 hover:border-brand-500 transition-all">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <button 
                      onClick={() => navigate(link.path)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-xs text-gray-400">
            <p>© {currentYear} OneYatra Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> support@oneyatra.com</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> 1800-YATRA-HELP</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" alt="Play Store" className="h-8 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-8 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  );
};

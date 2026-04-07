
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const Footer = () => {
  const navigate = useNavigate();
  const { t } = useSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-app-card border-t border-app-border py-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-xs text-app-text opacity-40">
            <p>© {currentYear} OneYatra Technologies Pvt. Ltd. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/company-info')}
              className="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-2"
            >
              Company Info & Support
            </button>
            <div className="hidden md:flex items-center gap-4">
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" alt="Play Store" className="h-6 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-6 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

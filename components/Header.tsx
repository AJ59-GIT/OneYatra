
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, Zap, Server, LogOut, Trash2, Heart, Settings, Crown, Briefcase, Wallet, LifeBuoy, Bell, AlertTriangle, Moon, Sun, Globe, Building2, Layout, ChevronRight, Search, MapPin, Calendar as CalendarIcon, Clock, X, ArrowRight } from 'lucide-react';
import { clearAuthData, getCurrentUser } from '../services/authService';
import { AppView, UserProfile, SearchParams } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../contexts/SettingsContext';
import { LocationAutocomplete } from './LocationAutocomplete';

interface HeaderProps {
  onLogout?: () => void;
  onSearch?: (params: SearchParams) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showArch, setShowArch] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, isB2BMode, toggleB2BMode, t, dir } = useSettings();

  // Quick Edit Form State
  const [origin, setOrigin] = useState('Delhi');
  const [destination, setDestination] = useState('Mumbai');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    
    const archPref = localStorage.getItem('oneyatra_show_arch');
    if (archPref === 'true') setShowArch(true);
  }, []);

  const toggleArch = () => {
    const newVal = !showArch;
    setShowArch(newVal);
    localStorage.setItem('oneyatra_show_arch', String(newVal));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all user data? This will log you out and clear the local database.")) {
      clearAuthData();
      window.location.reload();
    }
  };

  const onNavigate = (view: AppView) => {
    const pathMap: Record<AppView, string> = {
      HOME: '/',
      LOGIN: '/login',
      RESULTS: '/results',
      BOOKING: '/booking',
      SAVED_TRIPS: '/saved-trips',
      MY_TRIPS: '/my-trips',
      WALLET: '/wallet',
      PROFILE: '/profile',
      LOYALTY: '/loyalty',
      SUPPORT: '/support',
      ALERTS: '/alerts',
      ARCHITECTURE: '/architecture',
      IMPACT: '/impact',
      DOCUMENTS: '/documents',
      ITINERARY: '/itinerary',
      CORPORATE: '/corporate',
      GROUP_BOOKING: '/group-booking',
      GIFT_CARDS: '/gift-cards',
      PRIVACY: '/privacy',
      TERMS: '/terms'
    };
    navigate(pathMap[view] || '/');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        origin,
        destination,
        date,
        time: '09:00',
        passengers: 1,
        tripType: 'ONE_WAY',
        segments: [],
        isFlexible: false
      });
      setIsQuickEditOpen(false);
    }
  };

  const getProgress = () => {
    const path = location.pathname;
    if (path === '/') return 1;
    if (path === '/results') return 2;
    if (path === '/booking') return 3;
    return 0;
  };

  const progress = getProgress();

  return (
    <header className={`sticky top-2 z-50 mx-4 rounded-2xl backdrop-blur-xl border shadow-lg transition-all duration-300 ${isB2BMode ? 'bg-slate-900/80 text-white border-slate-800' : 'bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-800/50'}`} dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        {progress > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t-2xl">
            <div 
              className="h-full bg-brand-500 transition-all duration-500 ease-out" 
              style={{ width: `${(progress / 3) * 100}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => onNavigate(isB2BMode ? 'CORPORATE' : 'HOME')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(isB2BMode ? 'CORPORATE' : 'HOME')}
              aria-label="Go to Home"
            >
              <div className={`p-1.5 rounded-lg mr-2 transition-transform group-hover:scale-110 ${isB2BMode ? 'bg-blue-600' : 'bg-brand-500'}`}>
                {isB2BMode ? <Building2 className="h-5 w-5 text-white"/> : <Zap className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true" />}
              </div>
              <span className={`text-xl font-bold bg-clip-text text-transparent ${isB2BMode ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 'bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-600'}`}>
                {t('app_name')}
              </span>
            </div>

            {/* Breadcrumbs / Progress */}
            {progress > 0 && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className={progress >= 1 ? 'text-brand-500' : ''}>Search</span>
                <ChevronRight className="h-3 w-3" />
                <span className={progress >= 2 ? 'text-brand-500' : ''}>Results</span>
                <ChevronRight className="h-3 w-3" />
                <span className={progress >= 3 ? 'text-brand-500' : ''}>Booking</span>
              </div>
            )}
          </div>
          
          <nav className="hidden md:flex space-x-6 items-center rtl:space-x-reverse" aria-label="Desktop Navigation">
            {location.pathname === '/results' && (
              <button 
                onClick={() => setIsQuickEditOpen(!isQuickEditOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 transition-all border border-brand-100 dark:border-brand-800"
              >
                <Search className="h-3.5 w-3.5" />
                Quick Edit
              </button>
            )}

            {!isB2BMode && (
                <>
                    <button onClick={() => onNavigate('HOME')} className="text-sm font-medium hover:text-brand-600 transition-colors">{t('nav_plan')}</button>
                    <button onClick={() => onNavigate('MY_TRIPS')} className="text-sm font-medium hover:text-brand-600 transition-colors">{t('nav_trips')}</button>
                </>
            )}
          </nav>

          <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
            {/* Live Trip Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 animate-pulse cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate('MY_TRIPS')}>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live Trip: Mumbai</span>
            </div>

            {/* Wallet Balance */}
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onNavigate('LOYALTY')}
            >
              <Crown className="h-4 w-4 text-amber-500" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Yatra Points</span>
                <span className="text-xs font-black text-gray-800 dark:text-white">2,450</span>
              </div>
            </div>

             {/* Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
               aria-label="Toggle Theme"
             >
               {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
             </button>

            {/* Notification Center */}
            <div className="hidden md:block">
                <NotificationCenter />
            </div>
            
            {/* User Dropdown Trigger */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('PROFILE')}
                className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-gray-200 group rtl:pl-1 rtl:pr-2"
              >
                <div className={`p-1.5 rounded-full ${isB2BMode ? 'bg-blue-800 text-blue-200' : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}`}>
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Edit Panel */}
      {isQuickEditOpen && (
        <div className="absolute top-full left-0 w-full p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Quick Edit Search</h3>
              <button onClick={() => setIsQuickEditOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleQuickSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <LocationAutocomplete 
                  value={origin} 
                  onChange={setOrigin} 
                  placeholder="From" 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500" />
                <LocationAutocomplete 
                  value={destination} 
                  onChange={setDestination} 
                  placeholder="To" 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold"
                />
              </div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold"
                />
              </div>
              <button type="submit" className="bg-brand-500 text-white rounded-xl font-black text-sm hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 py-2">
                Update <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Content (Simplified) */}
      {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm font-medium">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 text-xs font-bold"
                  >
                    {theme === 'dark' ? <><Sun className="h-4 w-4" /> Light Mode</> : <><Moon className="h-4 w-4" /> Dark Mode</>}
                  </button>
              </div>
              <button onClick={() => {onNavigate('ITINERARY'); setIsMenuOpen(false);}} className="flex items-center gap-2 p-3">
                  <Layout className="h-5 w-5"/> Trip Planner
              </button>
              <button onClick={onLogout} className="flex items-center gap-2 p-3 text-red-500">
                  <LogOut className="h-5 w-5"/> {t('logout')}
              </button>
          </div>
      )}
    </header>
  );
};

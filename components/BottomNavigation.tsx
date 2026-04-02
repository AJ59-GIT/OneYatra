
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, Ticket, Sparkles, Server } from 'lucide-react';
import { AppView } from '../types';
import { useVibration } from '../hooks/useVibration';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavigationProps {
  currentView: AppView;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { vibrateTap } = useVibration();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show if scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Hide if scrolling down and not at top
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: 'HOME', icon: Home, label: 'Home', path: '/' },
    { id: 'RESULTS', icon: Search, label: 'Search', path: '/results' },
    { id: 'MY_TRIPS', icon: Ticket, label: 'Trips', path: '/my-trips' },
    ...(isAdmin ? [{ id: 'ADMIN', icon: Server, label: 'Admin', path: '/admin' }] : []),
    { id: 'PROFILE', icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleNavClick = (path: string) => {
    vibrateTap();
    navigate(path);
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe z-50 transition-transform duration-300 md:hidden ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-500 dark:text-slate-400'}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <item.icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

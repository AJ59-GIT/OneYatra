
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { SMSNotification } from './components/SMSNotification';
import { BottomNavigation } from './components/BottomNavigation';
import { SearchParams, AppView, TravelOption, TripSegment, Booking } from './types';
import { requestPushPermission } from './services/notificationService';
import { logoutUser, initAuthListener } from './services/authService';
import { useVibration } from './hooks/useVibration';
import { ChatWidget } from './components/ChatWidget';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { CookieConsent } from './components/CookieConsent';
import { SOSButton } from './components/SOSButton';
import { Loader2 } from 'lucide-react';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy Load Pages
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const SavedTripsPage = lazy(() => import('./pages/SavedTripsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const ImpactDashboardPage = lazy(() => import('./pages/ImpactDashboardPage'));
const DocumentsVaultPage = lazy(() => import('./pages/DocumentsVaultPage'));
const ItineraryBuilderPage = lazy(() => import('./pages/ItineraryBuilderPage'));
const CorporateDashboardPage = lazy(() => import('./pages/CorporateDashboardPage'));
const GroupBookingPage = lazy(() => import('./pages/GroupBookingPage'));
const GiftCardsPage = lazy(() => import('./pages/GiftCardsPage'));
const RoutePlannerPage = lazy(() => import('./pages/RoutePlannerPage'));
const LocationSearchPage = lazy(() => import('./pages/LocationSearchPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, loading, logout } = useAuth();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedOption, setSelectedOption] = useState<TravelOption | null>(null);
  const [bookingContext, setBookingContext] = useState<{origin: string, destination: string} | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (isLoggedIn) {
        requestPushPermission();
        if(!localStorage.getItem('oneyatra_onboarding_seen')) {
            setShowOnboarding(true);
        }
      } else {
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    }
  }, [isLoggedIn, loading, location.pathname, navigate]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    if (mainContentRef.current) mainContentRef.current.focus();
  }, [location.pathname]);

  const handleLoginSuccess = () => {
    navigate('/');
    if(!localStorage.getItem('oneyatra_onboarding_seen')) setShowOnboarding(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  }

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    navigate('/results');
  };

  const handleInitiateBooking = (option: TravelOption, context?: {origin: string, destination: string}) => {
    setSelectedOption(option);
    if (context) setBookingContext(context);
    else if (searchParams) setBookingContext({ origin: searchParams.origin, destination: searchParams.destination });
    navigate('/booking');
  };

  const handleBookAgain = (booking: Booking) => {
    const params: SearchParams = {
        origin: booking.origin || 'Origin',
        destination: booking.destination || 'Destination',
        date: new Date().toISOString().split('T')[0], 
        time: '09:00',
        passengers: booking.passengers.length,
        tripType: 'ONE_WAY',
        segments: [],
        isFlexible: false
    };
    setSearchParams(params);
    navigate('/results');
  };

  const handleBackToHome = () => navigate('/');

  const currentView = location.pathname.substring(1).toUpperCase().replace(/-/g, '_') || 'HOME';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <OfflineBanner />
      <SMSNotification />
      
      {location.pathname !== '/login' && <Header onLogout={handleLogout} onSearch={handleSearch} />}
      
      <main 
        id="main-content" 
        ref={mainContentRef}
        className={`flex-grow ${location.pathname !== '/login' ? 'pb-16 md:pb-0' : ''} outline-none`} 
        tabIndex={-1}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
              
              {/* Protected Routes */}
              <Route path="/" element={isLoggedIn ? <HomePage onSearch={handleSearch} /> : <Navigate to="/login" />} />
              <Route path="/results" element={isLoggedIn && searchParams ? <ResultsPage searchParams={searchParams} onBack={handleBackToHome} onBookOption={handleInitiateBooking} /> : <Navigate to="/" />} />
              <Route path="/booking" element={isLoggedIn && selectedOption ? (
                <BookingPage 
                  option={selectedOption}
                  origin={bookingContext?.origin || ''}
                  destination={bookingContext?.destination || ''}
                  passengersCount={searchParams?.passengers || 1}
                  onBack={() => navigate('/results')}
                  onComplete={() => navigate('/my-trips')}
                />
              ) : <Navigate to="/" />} />
              
              <Route path="/saved-trips" element={isLoggedIn ? <SavedTripsPage onBack={handleBackToHome} onBookOption={handleInitiateBooking} /> : <Navigate to="/login" />} />
              <Route path="/my-trips" element={isLoggedIn ? <MyTripsPage onBack={handleBackToHome} onBookAgain={handleBookAgain} /> : <Navigate to="/login" />} />
              <Route path="/wallet" element={isLoggedIn ? <WalletPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isLoggedIn ? <ProfilePage onBack={handleBackToHome} onLogout={handleLogout} /> : <Navigate to="/login" />} />
              <Route path="/loyalty" element={isLoggedIn ? <LoyaltyPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/support" element={isLoggedIn ? <SupportPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/alerts" element={isLoggedIn ? <AlertsPage /> : <Navigate to="/login" />} />
              <Route path="/architecture" element={isLoggedIn ? <ArchitecturePage /> : <Navigate to="/login" />} />
              <Route path="/impact" element={isLoggedIn ? <ImpactDashboardPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/documents" element={isLoggedIn ? <DocumentsVaultPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/itinerary" element={isLoggedIn ? <ItineraryBuilderPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/corporate" element={isLoggedIn ? <CorporateDashboardPage /> : <Navigate to="/login" />} />
              <Route path="/group-booking" element={isLoggedIn ? <GroupBookingPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/gift-cards" element={isLoggedIn ? <GiftCardsPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/route-planner" element={isLoggedIn ? <RoutePlannerPage /> : <Navigate to="/login" />} />
              <Route path="/location-search" element={isLoggedIn ? <LocationSearchPage /> : <Navigate to="/login" />} />
              <Route path="/complete-profile" element={isLoggedIn ? <CompleteProfilePage /> : <Navigate to="/login" />} />
              <Route path="/privacy" element={isLoggedIn ? <PrivacyPolicyPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              <Route path="/terms" element={isLoggedIn ? <TermsPage onBack={handleBackToHome} /> : <Navigate to="/login" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {location.pathname !== '/login' && <BottomNavigation currentView={currentView as AppView} />}
      {showOnboarding && <OnboardingGuide onComplete={() => setShowOnboarding(false)} />}
      <CookieConsent />
      <SOSButton />
      <ChatWidget />
    </div>
  );
};

const App = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;

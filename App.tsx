
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { SMSNotification } from './components/SMSNotification';
import { BottomNavigation } from './components/BottomNavigation';
import { Footer } from './components/Footer';
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
import { Loader2, XCircle } from 'lucide-react';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './components/PageTransition';

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
const CancellationPortal = lazy(() => import('./pages/CancellationPortal'));
const ReferAndEarnPage = lazy(() => import('./pages/ReferAndEarnPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ReviewSubmissionPage = lazy(() => import('./pages/ReviewSubmissionPage'));
const VendorOnboardingPage = lazy(() => import('./pages/VendorOnboardingPage'));
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage'));
const TravelRulesPage = lazy(() => import('./pages/TravelRulesPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
import { AdminRoute } from './components/AdminRoute';

const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, loading, isAuthReady, user, logout, firebaseUser } = useAuth();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedOption, setSelectedOption] = useState<TravelOption | null>(null);
  const [bookingContext, setBookingContext] = useState<{origin: string, destination: string} | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthReady && !loading) {
      if (isLoggedIn) {
        requestPushPermission();
        if(!localStorage.getItem('oneyatra_onboarding_seen')) {
            setShowOnboarding(true);
        }
        
        // Check if profile is complete
        const isProfileComplete = !!(user?.name && user?.phone && user?.dob && user?.gender);
        
        // Removed mandatory profile completion redirect to unblock user
        /*
        if (!isProfileComplete && location.pathname !== '/complete-profile') {
          navigate('/complete-profile');
          return;
        }
        */

        // Redirect away from login if already logged in
        if (location.pathname === '/login') {
          navigate('/');
          return;
        }
        
        // Redirect away from complete-profile if profile is already complete
        if (isProfileComplete && location.pathname === '/complete-profile') {
          navigate('/');
          return;
        }
      } else {
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    }
  }, [isLoggedIn, loading, isAuthReady, location.pathname, navigate, user]);

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
  
  if (isAuthReady && firebaseUser && user?.isActive === false) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-center transition-colors">
        <div className="max-w-md w-full bg-app-card border border-app-border p-8 shadow-2xl rounded-3xl">
          <XCircle className="h-16 w-16 text-red-600 dark:text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-serif italic font-bold mb-4 text-app-text">Account Deactivated</h1>
          <p className="text-sm font-mono opacity-70 mb-8 uppercase tracking-tight text-app-text">
            Your access to the OneYatra platform has been suspended by the system administrator.
          </p>
          <Button onClick={handleLogout} className="w-full border-slate-900 dark:border-slate-700">
            LOGOUT_FROM_SYSTEM
          </Button>
        </div>
      </div>
    );
  }

  const currentView = location.pathname.substring(1).toUpperCase().replace(/-/g, '_') || 'HOME';

  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-text flex flex-col transition-colors duration-300">
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
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<PageTransition><LoginPage onLoginSuccess={handleLoginSuccess} /></PageTransition>} />
                
                {/* Protected Routes */}
                <Route path="/" element={isLoggedIn ? <PageTransition><HomePage onSearch={handleSearch} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/results" element={isLoggedIn && searchParams ? (
                  <PageTransition>
                    <ResultsPage searchParams={searchParams} onBack={handleBackToHome} onBookOption={handleInitiateBooking} />
                  </PageTransition>
                ) : <Navigate to="/" />} />
                <Route path="/booking" element={isLoggedIn && selectedOption ? (
                  <PageTransition>
                    <BookingPage 
                      option={selectedOption}
                      origin={bookingContext?.origin || ''}
                      destination={bookingContext?.destination || ''}
                      passengersCount={searchParams?.passengers || 1}
                      travelDate={searchParams?.date}
                      onBack={() => navigate('/results')}
                      onComplete={(bookingId?: string) => navigate(bookingId ? `/booking-success/${bookingId}` : '/my-trips')}
                    />
                  </PageTransition>
                ) : <Navigate to="/" />} />
                
                <Route path="/saved-trips" element={isLoggedIn ? <PageTransition><SavedTripsPage onBack={handleBackToHome} onBookOption={handleInitiateBooking} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/my-trips" element={isLoggedIn ? <PageTransition><MyTripsPage onBack={handleBackToHome} onBookAgain={handleBookAgain} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/wallet" element={isLoggedIn ? <PageTransition><WalletPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/profile" element={isLoggedIn ? <PageTransition><ProfilePage onBack={handleBackToHome} onLogout={handleLogout} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/loyalty" element={isLoggedIn ? <PageTransition><LoyaltyPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/support" element={isLoggedIn ? <PageTransition><SupportPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/alerts" element={isLoggedIn ? <PageTransition><AlertsPage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/architecture" element={isLoggedIn ? <PageTransition><ArchitecturePage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/impact" element={isLoggedIn ? <PageTransition><ImpactDashboardPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/documents" element={isLoggedIn ? <PageTransition><DocumentsVaultPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/itinerary" element={isLoggedIn ? <PageTransition><ItineraryBuilderPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/corporate" element={isLoggedIn ? <PageTransition><CorporateDashboardPage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/group-booking" element={isLoggedIn ? <PageTransition><GroupBookingPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/gift-cards" element={isLoggedIn ? <PageTransition><GiftCardsPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/route-planner" element={isLoggedIn ? <PageTransition><RoutePlannerPage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/location-search" element={isLoggedIn ? <PageTransition><LocationSearchPage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/complete-profile" element={isLoggedIn ? <PageTransition><CompleteProfilePage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/privacy" element={isLoggedIn ? <PageTransition><PrivacyPolicyPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/terms" element={isLoggedIn ? <PageTransition><TermsPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/cancellation" element={isLoggedIn ? <PageTransition><CancellationPortal onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/refer-earn" element={isLoggedIn ? <PageTransition><ReferAndEarnPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/about" element={isLoggedIn ? <PageTransition><AboutUsPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/blog" element={isLoggedIn ? <PageTransition><BlogPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/faq" element={isLoggedIn ? <PageTransition><FAQPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/review/:bookingId" element={isLoggedIn ? <PageTransition><ReviewSubmissionPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/vendor-onboarding" element={isLoggedIn ? <PageTransition><VendorOnboardingPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/booking-success/:bookingId" element={isLoggedIn ? <PageTransition><BookingSuccessPage /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/travel-rules" element={isLoggedIn ? <PageTransition><TravelRulesPage onBack={handleBackToHome} /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <PageTransition>
                      <AdminDashboardPage onBack={handleBackToHome} />
                    </PageTransition>
                  </AdminRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>

      {location.pathname !== '/login' && <BottomNavigation currentView={currentView as AppView} />}
      {location.pathname !== '/login' && <Footer />}
      {showOnboarding && <OnboardingGuide onComplete={() => setShowOnboarding(false)} />}
      <CookieConsent />
      {location.pathname !== '/login' && <SOSButton />}
      {location.pathname !== '/login' && <ChatWidget />}
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

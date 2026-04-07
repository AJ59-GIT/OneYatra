
import { useEffect, useState, useMemo } from 'react';
import { Sparkles, ArrowLeft, Filter, AlertCircle, Repeat, Share2, Copy, Check, Twitter, Mail, X, ExternalLink, ArrowUpDown } from 'lucide-react';
import { RouteResponse, SearchParams, TravelOption, FilterState } from '../types';
import { fetchTravelOptions } from '../services/geminiService';
import { trackDeepLinkClick } from '../services/deepLinkService';
import { TravelCard } from '../components/TravelCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { Button } from '../components/Button';
import { parseDurationToMins, calculateCabPrice } from '../services/pricingService';
import { isTripSaved, saveTrip, removeTrip } from '../services/savedTripsService';
import { RealTimeBookingToast } from '../components/RealTimeBookingToast';
import { EmptyState } from '../components/EmptyState';
import { TravelCardSkeleton } from '../components/TravelCardSkeleton';
import { WeatherWidget } from '../components/WeatherWidget';
import { useSettings } from '../contexts/SettingsContext';
import { getRoadDistance, searchLocations, RouteData } from '../services/locationService';

interface ResultsPageProps {
  searchParams: SearchParams;
  onBack: () => void;
  onBookOption?: (option: TravelOption) => void;
}

export const ResultsPage = ({ searchParams, onBack, onBookOption }: ResultsPageProps) => {
  const { t, formatPrice, formatDate } = useSettings();
  const [data, setData] = useState<RouteResponse | null>(null);
  const [realRoute, setRealRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSort, setActiveSort] = useState<'ALL' | 'CHEAPEST' | 'FASTEST' | 'ECO'>('ALL');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeepLinkModalOpen, setIsDeepLinkModalOpen] = useState(false);
  const [pendingDeepLinkOption, setPendingDeepLinkOption] = useState<TravelOption | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Saved items state for re-rendering updates
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    departureTime: [],
    arrivalMaxHour: 24,
    priceRange: [0, 100000],
    providers: [],
    amenities: [],
    stops: [],
    maxDuration: 24 * 60, // 24 hours in mins
    minRating: 0,
    moods: []
  });

  // Derived Constraints for Filters
  const [filterConstraints, setFilterConstraints] = useState({
    minPrice: 0,
    maxPrice: 10000,
    maxDuration: 1200,
    providers: [] as string[]
  });
  
  // Round Trip State
  const [roundTripTab, setRoundTripTab] = useState<'OUTBOUND' | 'RETURN'>('OUTBOUND');
  const [selectedOutbound, setSelectedOutbound] = useState<TravelOption | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<TravelOption | null>(null);

  const isRoundTrip = searchParams.tripType === 'ROUND_TRIP';

  const updateSavedIds = (options: TravelOption[]) => {
    const newSet = new Set<string>();
    options.forEach(opt => {
      if (isTripSaved(opt.id)) newSet.add(opt.id);
    });
    setSavedIds(newSet);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Resolve coordinates for origin and destination
        const [originResults, destResults] = await Promise.all([
          searchLocations(searchParams.origin),
          searchLocations(searchParams.destination)
        ]);

        if (originResults.length === 0 || destResults.length === 0) {
          throw new Error('Could not find coordinates for origin or destination.');
        }

        const origin = originResults[0];
        const dest = destResults[0];

        // 2. Parallel Execution: Gemini AI Search and OSRM Routing
        // We trigger both but handle them as they arrive for Optimistic UI
        const aiPromise = fetchTravelOptions(searchParams);
        const osrmPromise = getRoadDistance({ lat: origin.lat, lng: origin.lng }, { lat: dest.lat, lng: dest.lng });

        // Handle AI results first for speed
        aiPromise.then(aiResult => {
          setData(aiResult);
          
          // Calculate filter bounds from initial AI data
          const allOptions = [...(aiResult.options || []), ...(aiResult.returnOptions || [])];
          if (allOptions.length > 0) {
              updateSavedIds(allOptions);
              const prices = allOptions.map(o => o.price);
              const durations = allOptions.map(o => parseDurationToMins(o.duration));
              const providers = Array.from(new Set(allOptions.map(o => o.provider.split(' ')[0]))).sort();
              
              const minP = Math.floor(Math.min(...prices) * 0.9);
              const maxP = Math.ceil(Math.max(...prices) * 1.1);
              const maxD = Math.ceil(Math.max(...durations) * 1.5); // Add 50% buffer for real-time updates
              
              setFilterConstraints({
                  minPrice: minP,
                  maxPrice: maxP,
                  maxDuration: Math.max(maxD, 60),
                  providers: providers
              });
              
              setFilters(prev => ({
                  ...prev,
                  priceRange: [minP, maxP],
                  maxDuration: Math.max(maxD, 60)
              }));
          }
          setLoading(false);
        }).catch(err => {
          setError(err.message || 'Failed to fetch travel options.');
          setLoading(false);
        });

        // Handle OSRM results when they arrive to refine the UI
        osrmPromise.then(osrmResult => {
          setRealRoute(osrmResult);
        }).catch(err => {
          console.error("OSRM failed, using AI estimates:", err);
        });

      } catch (err: any) {
        setError(err.message || 'Failed to fetch travel options. Please try again.');
        setLoading(false);
      }
    };
    loadData();
  }, [searchParams]);

  // Distance-Aware Filtering & Optimistic UI Logic
  const processedOptions = useMemo(() => {
    if (!data) return [];
    
    const rawOptions = isRoundTrip && roundTripTab === 'RETURN' && data.returnOptions 
      ? data.returnOptions 
      : data.options;

    const distance = realRoute?.distance || 100; // Default to 100km if OSRM hasn't arrived yet

    // 1. Distance-Aware Filtering
    let filtered = rawOptions.filter(opt => {
      // If distance is very short, include cabs but prioritize local modes
      if (distance <= 3) {
        return ['CAB', 'SCOOTER', 'BICYCLE', 'WALK', 'AUTO', 'BIKE_TAXI'].includes(opt.mode);
      }
      if (distance <= 25) {
        // Cabs, Autos, and Public Transport are all valid for city travel
        return ['CAB', 'BIKE_TAXI', 'AUTO', 'METRO', 'BUS', 'SUBURBAN_RAIL', 'SCOOTER'].includes(opt.mode);
      }
      if (distance <= 120) {
        // Exclude flights for short inter-city distances, but allow everything else
        return opt.mode !== 'FLIGHT';
      }
      return true; // For > 120km, all modes (including Flights and Trains) are allowed
    });

    // 2. Optimistic UI: Update with real OSRM data and corrected prices
    filtered = filtered.map(opt => {
      if (!realRoute) return opt;

      let updated = { ...opt, distance: `${realRoute.distance} km` };

      // Correct prices for road-based modes based on real distance
      if (['CAB', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO'].includes(opt.mode)) {
        const corrected = calculateCabPrice(realRoute.distance, realRoute.duration, data.origin, searchParams.time, opt.mode, searchParams.passengers);
        updated.price = corrected.price;
        // Update duration too
        const h = Math.floor(realRoute.duration / 60);
        const m = realRoute.duration % 60;
        updated.duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }

      return updated;
    });

    // 3. Apply User Filters
    filtered = filtered.filter(opt => {
      if (opt.price < filters.priceRange[0] || opt.price > filters.priceRange[1]) return false;
      const dur = parseDurationToMins(opt.duration);
      if (dur > filters.maxDuration) return false;
      if (filters.minRating > 0 && (opt.rating || 0) < filters.minRating) return false;
      if (filters.providers.length > 0) {
          const simpleName = opt.provider.split(' ')[0];
          if (!filters.providers.includes(simpleName)) return false;
      }
      return true;
    });

    // 4. Sorting
    if (activeSort === 'CHEAPEST') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'FASTEST') {
      filtered.sort((a, b) => parseDurationToMins(a.duration) - parseDurationToMins(b.duration));
    } else if (activeSort === 'ECO') {
      filtered.sort((a, b) => b.ecoScore - a.ecoScore);
    }

    return filtered;
  }, [data, realRoute, filters, activeSort, isRoundTrip, roundTripTab, searchParams.time, searchParams.passengers]);

  // -- Share Functionality --
  const generateShareData = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    params.set('origin', searchParams.origin);
    params.set('destination', searchParams.destination);
    params.set('date', searchParams.date);
    params.set('tripType', searchParams.tripType);
    params.set('passengers', searchParams.passengers.toString());
    params.set('time', searchParams.time);
    if(searchParams.isFlexible) params.set('isFlexible', 'true');
    if(searchParams.returnDate) params.set('returnDate', searchParams.returnDate);
    if(searchParams.returnTime) params.set('returnTime', searchParams.returnTime);
    if(searchParams.segments && searchParams.segments.length > 0) {
      params.set('segments', encodeURIComponent(JSON.stringify(searchParams.segments)));
    }

    const url = `${baseUrl}?${params.toString()}`;
    const text = `Check out this trip on OneYatra: ${searchParams.origin} to ${searchParams.destination} on ${new Date(searchParams.date).toLocaleDateString()}. Compare flights, trains & cabs!`;

    return { url, text, title: 'OneYatra Trip Search' };
  };

  const handleShare = async () => {
    const { url, text, title } = generateShareData();
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        console.log('Native share cancelled or failed', e);
      }
    }
    setIsShareModalOpen(true);
  };

  const copyToClipboard = async () => {
    const { url } = generateShareData();
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleBook = (option: TravelOption) => {
    if (isRoundTrip) {
      if (roundTripTab === 'OUTBOUND') {
        setSelectedOutbound(option);
        setRoundTripTab('RETURN'); 
      } else {
        setSelectedReturn(option);
      }
      return;
    }
    handleBookingProcess(option);
  };

  const handleToggleSave = (option: TravelOption) => {
    if (savedIds.has(option.id)) {
      removeTrip(option.id);
      const newSet = new Set(savedIds);
      newSet.delete(option.id);
      setSavedIds(newSet);
    } else {
      if (!data) return;
      const origin = isRoundTrip && roundTripTab === 'RETURN' ? data.destination : data.origin;
      const destination = isRoundTrip && roundTripTab === 'RETURN' ? data.origin : data.destination;
      const date = isRoundTrip && roundTripTab === 'RETURN' ? (data.returnDate || data.date) : data.date;
      
      saveTrip(option, origin, destination, date);
      const newSet = new Set(savedIds);
      newSet.add(option.id);
      setSavedIds(newSet);
    }
  };

  const handleBookingProcess = (option: TravelOption) => {
    if (option.mode === 'CAB') {
        handleDeepLink(option);
    } else {
        if (onBookOption) {
            onBookOption(option);
        } else {
            console.error("Internal booking handler missing");
        }
    }
  };

  const handleRoundTripCheckout = () => {
    if (!selectedOutbound || !selectedReturn) return;
    const combinedOption: TravelOption = {
      id: `rt-${Date.now()}`,
      mode: 'MIXED',
      provider: 'Round Trip Bundle',
      departureTime: selectedOutbound.departureTime,
      arrivalTime: selectedReturn.arrivalTime, 
      duration: 'Combined',
      price: (selectedOutbound.price + selectedReturn.price) * 0.95,
      currency: 'INR',
      features: ['Round Trip Discount Applied'],
      ecoScore: Math.floor((selectedOutbound.ecoScore + selectedReturn.ecoScore) / 2),
      legs: [selectedOutbound, selectedReturn],
      tag: 'Round Trip'
    };
    handleBookingProcess(combinedOption);
  };

  const handleDeepLink = (option: TravelOption) => {
    trackDeepLinkClick(option.provider, 'attempted');
    setPendingDeepLinkOption(option);
    setIsDeepLinkModalOpen(true);
  };

  const confirmDeepLink = () => {
    if (!pendingDeepLinkOption) return;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const targetUrl = (isAndroid && pendingDeepLinkOption.androidIntent) ? pendingDeepLinkOption.androidIntent : pendingDeepLinkOption.deepLink;
    
    if (targetUrl) {
      const isUniversal = targetUrl.startsWith('http');
      window.location.href = targetUrl;
      
      if (!isUniversal && !targetUrl.startsWith('intent://') && pendingDeepLinkOption.deepLinkFallback) {
        setTimeout(() => {
           if (!document.hidden) {
             trackDeepLinkClick(pendingDeepLinkOption.provider, 'fallback');
             window.open(pendingDeepLinkOption.deepLinkFallback, '_blank');
           }
        }, 2500);
      }
    }
    setIsDeepLinkModalOpen(false);
    setPendingDeepLinkOption(null);
  };

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-app-bg">
         <div className="bg-app-card border-b border-app-border px-4 py-4 z-30">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                    <div className="h-6 w-48 bg-app-bg rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-app-bg/50 rounded animate-pulse"></div>
                </div>
            </div>
         </div>
         <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-6">
             <div className="hidden lg:block w-72 shrink-0 space-y-4">
                 <div className="h-full bg-app-card rounded-xl border border-app-border p-4">
                    <div className="h-6 w-24 bg-app-bg rounded mb-6 animate-pulse"></div>
                    {[1,2,3,4].map(i => <div key={i} className="h-16 w-full bg-app-bg/50 rounded mb-4 animate-pulse"></div>)}
                 </div>
             </div>
             <div className="flex-1 space-y-4">
                 {[1, 2, 3, 4].map(i => <TravelCardSkeleton key={i} />)}
             </div>
         </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState 
        icon={AlertCircle}
        title="Oops! Something went wrong."
        description={error}
        actionLabel="Try Again"
        onAction={onBack}
        className="min-h-[60vh]"
      />
    );
  }

  const shareData = generateShareData();
  const destinationCity = isRoundTrip && roundTripTab === 'RETURN' ? data.origin : data.destination;
  const travelDate = isRoundTrip && roundTripTab === 'RETURN' ? (data.returnDate || data.date) : data.date;
  const totalPrice = (selectedOutbound?.price || 0) + (selectedReturn?.price || 0);
  const discountedPrice = totalPrice * 0.95;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden bg-app-bg">
      <RealTimeBookingToast />
      <div className="bg-app-card/90 backdrop-blur-xl border-b border-app-border px-3 sm:px-6 lg:px-8 py-2 sm:py-4 shadow-premium z-30 shrink-0">
         <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-1 sm:gap-2">
                 <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-app-bg text-app-text opacity-60 rtl:-mr-1.5 rtl:ml-0 transition-colors active:scale-90" aria-label="Go back"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 rtl:rotate-180"/></button>
                 <h1 className="text-sm sm:text-base md:text-lg font-bold text-app-text flex items-center truncate">
                    {isRoundTrip ? (
                       <span className="flex items-center truncate">
                        <span className="truncate max-w-[80px] sm:max-w-none">{data.origin}</span>
                        <Repeat className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 text-brand-500 shrink-0"/>
                        <span className="truncate max-w-[80px] sm:max-w-none">{data.destination}</span>
                       </span>
                    ) : (
                       searchParams.tripType === 'MULTI_CITY' ? 'Multi-City Trip' : <span className="truncate">{data.origin} {t('label_to')} {data.destination}</span>
                    )}
                 </h1>
               </div>
               <div className="text-[10px] sm:text-xs text-app-text opacity-50 mt-0.5 ml-7 sm:ml-9 rtl:mr-7 sm:rtl:mr-9 rtl:ml-0 flex items-center gap-1.5 sm:gap-2">
                  <span className="whitespace-nowrap">{formatDate(data.date)}</span>
                  <span className="opacity-30">•</span>
                  <span className="whitespace-nowrap">{searchParams.passengers} {t('label_passengers')}</span>
               </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
               <button onClick={handleShare} className="p-1.5 sm:p-2.5 rounded-xl bg-app-card text-app-text hover:bg-app-card/80 transition-all border border-app-border shadow-sm active:scale-95" aria-label="Share trip"><Share2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
               <button onClick={() => setShowMobileFilters(true)} className="lg:hidden p-1.5 sm:p-2.5 rounded-xl bg-app-card text-app-text relative border border-app-border shadow-sm active:scale-95" aria-label="Filters"><Filter className="h-4 w-4 sm:h-5 sm:w-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full border border-app-card"></span></button>
            </div>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative max-w-7xl mx-auto w-full">
         <div className="hidden lg:block w-72 shrink-0 h-full border-r border-app-border overflow-y-auto custom-scrollbar rtl:border-l rtl:border-r-0">
            <div className="p-4 border-b border-app-border">
               <WeatherWidget city={destinationCity} date={travelDate} />
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} minPrice={filterConstraints.minPrice} maxPrice={filterConstraints.maxPrice} maxDurationLimit={filterConstraints.maxDuration} availableProviders={filterConstraints.providers} onClose={() => {}} resultsCount={processedOptions.length} />
         </div>

         {showMobileFilters && (
            <div className="absolute inset-0 z-50 lg:hidden flex">
               <div className="w-full h-full bg-app-card animate-in slide-in-from-right duration-300 overflow-y-auto">
                  <div className="p-4 border-b border-app-border">
                     <h3 className="font-bold text-lg mb-4 text-app-text">Destination Info</h3>
                     <WeatherWidget city={destinationCity} date={travelDate} />
                  </div>
                  <FilterSidebar filters={filters} onChange={setFilters} minPrice={filterConstraints.minPrice} maxPrice={filterConstraints.maxPrice} maxDurationLimit={filterConstraints.maxDuration} availableProviders={filterConstraints.providers} onClose={() => setShowMobileFilters(false)} resultsCount={processedOptions.length} />
               </div>
            </div>
         )}

         <div className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg p-3 sm:p-6 lg:p-8 pb-32">
            {isRoundTrip && (
               <div className="flex items-center justify-center mb-4 sm:mb-6 bg-app-card border border-app-border p-1 rounded-xl max-w-lg mx-auto shadow-sm sticky top-0 z-20">
                  <button onClick={() => setRoundTripTab('OUTBOUND')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${roundTripTab === 'OUTBOUND' ? 'bg-brand-500/10 text-brand-500 shadow-sm' : 'text-app-text opacity-50 hover:opacity-100'}`}>{t('label_from')} {data.origin}</button>
                  <button onClick={() => setRoundTripTab('RETURN')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${roundTripTab === 'RETURN' ? 'bg-brand-500/10 text-brand-500 shadow-sm' : 'text-app-text opacity-50 hover:opacity-100'}`}>{t('label_return')}</button>
               </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-3 sm:pb-4 no-scrollbar mb-2 sm:mb-4">
              {['ALL', 'CHEAPEST', 'FASTEST', 'ECO'].map(f => (
                <button key={f} onClick={() => setActiveSort(f as any)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all capitalize border ${activeSort === f ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20' : 'bg-app-card text-app-text opacity-70 border-app-border hover:border-brand-500/50'}`}>{t(f.toLowerCase())}</button>
              ))}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 sm:p-3 rounded-xl flex gap-2.5 sm:gap-3 mb-4 sm:mb-6 items-start">
               <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
               <p className="text-xs text-app-text opacity-80 leading-relaxed">{data.aiInsight}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
               {processedOptions.length === 0 ? (
                  <EmptyState icon={Filter} title="No results found" description="Try adjusting your filters to see more options." actionLabel="Reset Filters" onAction={() => setFilters({ departureTime: [], arrivalMaxHour: 24, priceRange: [filterConstraints.minPrice, filterConstraints.maxPrice], providers: [], amenities: [], stops: [], maxDuration: filterConstraints.maxDuration, minRating: 0, moods: [] })} />
               ) : (
                  processedOptions.map((option, index) => (
                     <div key={option.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                        <TravelCard option={option} onBook={handleBook} isSelected={(isRoundTrip && ((roundTripTab === 'OUTBOUND' && selectedOutbound?.id === option.id) || (roundTripTab === 'RETURN' && selectedReturn?.id === option.id))) || false} actionLabel={isRoundTrip ? t('select') : t('book_now')} isSaved={savedIds.has(option.id)} onToggleSave={() => handleToggleSave(option)} />
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>

      {isRoundTrip && (selectedOutbound || selectedReturn) && (
        <div className="bg-app-card border-t border-app-border shadow-2xl p-4 z-40 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
             <div className="flex-1 w-full md:w-auto flex justify-between md:justify-start gap-8">
               <div className={selectedOutbound ? 'text-app-text' : 'text-app-text opacity-40'}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-app-text opacity-50">{t('tab_one_way')}</div>
                  <div className="font-bold text-sm">{selectedOutbound ? formatPrice(selectedOutbound.price) : 'Select option'}</div>
               </div>
               <div className="text-app-border hidden md:block">|</div>
               <div className={selectedReturn ? 'text-app-text' : 'text-app-text opacity-40'}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-app-text opacity-50">{t('label_return')}</div>
                  <div className="font-bold text-sm">{selectedReturn ? formatPrice(selectedReturn.price) : 'Select option'}</div>
               </div>
             </div>
             <div className="flex items-center gap-6 w-full md:w-auto">
                {selectedOutbound && selectedReturn && (
                  <div className="text-right">
                    <div className="text-[10px] text-brand-500 font-bold bg-brand-500/10 px-2 rounded inline-block">5% Discount Applied</div>
                    <div className="text-lg font-bold text-app-text">{formatPrice(Math.round(discountedPrice))}</div>
                  </div>
                )}
                <Button disabled={!selectedOutbound || !selectedReturn} onClick={handleRoundTripCheckout} className="w-full md:w-auto">Book Trip</Button>
             </div>
          </div>
        </div>
      )}

      {isDeepLinkModalOpen && pendingDeepLinkOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-sm p-8 transform scale-100 animate-in zoom-in-95 duration-200 text-center border border-app-border">
            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><ExternalLink className="h-8 w-8 text-brand-500" /></div>
            <h3 className="text-xl font-bold text-app-text mb-2">Redirecting to {pendingDeepLinkOption.provider}</h3>
            <p className="text-sm text-app-text opacity-60 mb-8">We are taking you to the {pendingDeepLinkOption.provider} app to complete your booking. If the app isn't installed, we'll use their secure website.</p>
            <div className="flex gap-3">
               <button onClick={() => { setIsDeepLinkModalOpen(false); setPendingDeepLinkOption(null); }} className="flex-1 py-3 text-sm font-bold text-app-text opacity-50 hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
               <Button onClick={confirmDeepLink} className="flex-[2] rounded-xl shadow-lg shadow-brand-500/30">Continue</Button>
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-card rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-app-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-app-text">Share Trip</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-app-text opacity-50 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-app-text opacity-70 mb-4 bg-app-bg p-3 rounded-lg border border-app-border">{shareData.text}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <a href={`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 transition-colors"><div className="font-bold text-sm">WhatsApp</div></a>
               <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"><Twitter className="h-5 w-5 mb-1" /><span className="text-xs font-bold">Twitter</span></a>
               <a href={`mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`} className="flex flex-col items-center justify-center p-3 rounded-lg bg-app-bg text-app-text opacity-70 hover:opacity-100 border border-app-border transition-colors"><Mail className="h-5 w-5 mb-1" /><span className="text-xs font-bold">Email</span></a>
               <button onClick={copyToClipboard} className="flex flex-col items-center justify-center p-3 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 border border-brand-500/20 transition-colors relative">{linkCopied ? <Check className="h-5 w-5 mb-1" /> : <Copy className="h-5 w-5 mb-1" />}<span className="text-xs font-bold">{linkCopied ? 'Copied' : 'Copy Link'}</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;

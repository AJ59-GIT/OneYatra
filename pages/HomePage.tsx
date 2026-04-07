
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, ArrowRight, Repeat, Building, X, Heart, Plus, Users, Clock, Locate, Loader2, Bookmark, ChevronDown, ChevronUp, Star, Trash2, Globe, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { SearchParams, SavedSearch, TripSegment, AppView } from '../types';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { getCityFromCoordinates } from '../services/locationService';
import { getCurrentUser } from '../services/authService';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useSettings } from '../contexts/SettingsContext';

interface HomePageProps {
  onSearch: (params: SearchParams) => void;
}

export const HomePage = ({ onSearch }: HomePageProps) => {
  const navigate = useNavigate();
  const { t, formatDate } = useSettings();
  
  // Form State
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY'>('ONE_WAY');
  
  // Single/Round Trip State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [time, setTime] = useState('');
  
  // Multi City State
  const [segments, setSegments] = useState<TripSegment[]>([
    { id: '1', origin: '', destination: '', date: '', time: '' },
    { id: '2', origin: '', destination: '', date: '', time: '' }
  ]);

  // Common State
  const [isFlexible, setIsFlexible] = useState(false);
  const [passengers, setPassengers] = useState<number | ''>('');
  const [isLocating, setIsLocating] = useState(false);
  
  // History State
  const [searchHistory, setSearchHistory] = useState<SearchParams[]>([]);
  
  // Saved Search State
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSavedSectionOpen, setIsSavedSectionOpen] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [routeToSaveName, setRouteToSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveModalRef = useFocusTrap(isSaveModalOpen, () => setIsSaveModalOpen(false));

  const currentUser = getCurrentUser();
  const isProfileIncomplete = currentUser && (!currentUser.phone || !currentUser.dob);

  // Load data from localStorage on mount
  useEffect(() => {
    const historyStored = localStorage.getItem('oneyatra_search_history');
    if (historyStored) {
      try {
        setSearchHistory(JSON.parse(historyStored));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }

    const savedStored = localStorage.getItem('oneyatra_saved_searches');
    if (savedStored) {
      try {
        setSavedSearches(JSON.parse(savedStored));
      } catch (e) {
        console.error("Failed to parse saved searches", e);
      }
    }
  }, []);

  // Ensure return date is not before start date
  useEffect(() => {
    if (tripType === 'ROUND_TRIP' && returnDate < date) {
      setReturnDate(date);
    }
  }, [date, tripType]);

  // --- Multi City Logic ---
  const addSegment = () => {
    if (segments.length >= 5) return;
    const lastSegment = segments[segments.length - 1];
    const newSegment: TripSegment = {
      id: Date.now().toString(),
      origin: lastSegment.destination, // Chain origin from prev destination
      destination: '',
      date: lastSegment.date,
      time: ''
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    const newSegments = segments.filter((_, i) => i !== index);
    
    // Fix chaining if middle segment removed
    for (let i = 1; i < newSegments.length; i++) {
        newSegments[i].origin = newSegments[i-1].destination;
    }
    setSegments(newSegments);
  };

  const updateSegment = (index: number, field: keyof TripSegment, value: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    
    // Auto-update next segment origin if destination changed
    if (field === 'destination' && index < newSegments.length - 1) {
        newSegments[index + 1].origin = value;
    }
    
    setSegments(newSegments);
  };

  // --- History Logic ---
  const addToHistory = (params: SearchParams) => {
    const newHistory = [params, ...searchHistory].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('oneyatra_search_history', JSON.stringify(newHistory));
  };

  const handleApplySearch = (item: SearchParams) => {
    setTripType(item.tripType);
    setPassengers(item.passengers);
    if (item.isFlexible !== undefined) setIsFlexible(item.isFlexible);
    
    if (item.tripType === 'MULTI_CITY') {
        setSegments(item.segments);
    } else {
        setOrigin(item.origin);
        setDestination(item.destination);
        setDate(item.date);
        setTime(item.time);
        if (item.tripType === 'ROUND_TRIP' && item.returnDate) {
            setReturnDate(item.returnDate);
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Geolocation Logic ---
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
            const city = await getCityFromCoordinates(latitude, longitude);
            if (city) {
                if (tripType !== 'MULTI_CITY') setOrigin(city);
                else updateSegment(0, 'origin', city);
            } else {
                alert("Could not automatically detect city name. Please enter manually.");
            }
        } catch (e) {
             console.error("Reverse geocoding failed", e);
             alert("Failed to fetch location details.");
        } finally {
            setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === 1) msg = "Location permission denied.";
        else if (error.code === 2) msg = "Location unavailable.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- Saved Search Logic ---
  const openSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tripType === 'MULTI_CITY' ? `Multi-City Trip (${segments.length} stops)` : `${origin} to ${destination}`;
    setRouteToSaveName(name);
    setEditingId(null);
    setIsSaveModalOpen(true);
  };

  const confirmSaveSearch = () => {
    if (!routeToSaveName.trim()) return;

    let params: SearchParams;
    if (tripType === 'MULTI_CITY') {
        params = { 
          origin: segments[0].origin, 
          destination: segments[segments.length-1].destination, 
          date: segments[0].date || new Date().toISOString().split('T')[0], 
          time: segments[0].time || '08:00', 
          passengers: passengers === '' ? 1 : passengers, 
          isFlexible, 
          tripType: 'MULTI_CITY', 
          segments 
        };
    } else {
        params = { 
          origin, 
          destination, 
          date: date || new Date().toISOString().split('T')[0], 
          time: time || '08:00', 
          passengers: passengers === '' ? 1 : passengers, 
          isFlexible, 
          tripType, 
          segments: [], 
          returnDate: tripType === 'ROUND_TRIP' ? (returnDate || date) : undefined 
        };
    }

    let updated: SavedSearch[];
    if (editingId) {
      updated = savedSearches.map(s => s.id === editingId ? { ...s, name: routeToSaveName } : s);
    } else {
      const newSearch: SavedSearch = {
        id: `save-${Date.now()}`,
        name: routeToSaveName,
        createdAt: Date.now(),
        ...params
      };
      updated = [newSearch, ...savedSearches];
    }
    
    setSavedSearches(updated);
    localStorage.setItem('oneyatra_saved_searches', JSON.stringify(updated));
    setIsSaveModalOpen(false);
    setIsSavedSectionOpen(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleEditSaved = (search: SavedSearch, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setRouteToSaveName(search.name);
    setEditingId(search.id);
    setIsSaveModalOpen(true);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if(window.confirm("Remove this saved search?")) {
        const updated = savedSearches.filter(s => s.id !== id);
        setSavedSearches(updated);
        localStorage.setItem('oneyatra_saved_searches', JSON.stringify(updated));
    }
  };

  // --- Main Search Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let params: SearchParams;

    if (tripType === 'MULTI_CITY') {
        params = { 
            origin: segments[0].origin, 
            destination: segments[segments.length - 1].destination, 
            date: segments[0].date || new Date().toISOString().split('T')[0], 
            time: segments[0].time || '08:00', 
            passengers: passengers === '' ? 1 : passengers, 
            isFlexible, 
            tripType: 'MULTI_CITY', 
            segments 
        };
    } else {
        params = { 
            origin, 
            destination, 
            date: date || new Date().toISOString().split('T')[0], 
            time: time || '08:00', 
            passengers: passengers === '' ? 1 : passengers, 
            isFlexible, 
            tripType, 
            segments: [],
            returnDate: tripType === 'ROUND_TRIP' ? (returnDate || date) : undefined
        };
    }
    addToHistory(params);
    onSearch(params);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-app-bg">
      {/* Cinematic Background with Overlay and Glow */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* Background Image with Slow Zoom */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity animate-slow-zoom"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2000")' }}
        />
        
        {/* Deep Navy Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-app-bg via-app-bg/90 to-app-bg/80" />
        
        {/* Warm Orange Radial Glow (Top-Left) */}
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none dark:block hidden" />
        
        {/* Subtle Purple Glow (Bottom-Right) */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none dark:block hidden" />

        {/* Animated Blobs for Dynamic Depth */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-400/5 rounded-full blur-[80px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {isProfileIncomplete && (
          <div className="mb-8 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="bg-brand-100 dark:bg-brand-900/40 p-2 rounded-full">
                <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Complete your profile</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Add your phone number and details for a better experience.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/complete-profile')}
              className="whitespace-nowrap"
            >
              Complete Now
            </Button>
          </div>
        )}

        <section className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 drop-shadow-sm">
            <span className="hero-gradient bg-clip-text text-transparent">
              Smart Mobility for India
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 font-medium max-w-2xl mx-auto">
            {t('hero_desc')}
          </p>
        </section>

        {/* Transport Modes Cards */}
        <section className="max-w-5xl mx-auto mb-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: <Zap className="h-6 w-6" />, label: 'Cabs', color: 'bg-amber-500/10 text-amber-400' },
            { icon: <Building className="h-6 w-6" />, label: 'Trains', color: 'bg-blue-500/10 text-blue-400' },
            { icon: <Users className="h-6 w-6" />, label: 'Buses', color: 'bg-emerald-500/10 text-emerald-400' },
            { icon: <Globe className="h-6 w-6" />, label: 'Flights', color: 'bg-indigo-500/10 text-indigo-400' },
            { icon: <Locate className="h-6 w-6" />, label: 'Metro', color: 'bg-purple-500/10 text-purple-400' },
            { icon: <Plus className="h-6 w-6" />, label: 'More', color: 'bg-slate-500/10 text-slate-400' },
          ].map((mode, idx) => (
            <div key={idx} className="flex flex-col items-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all cursor-pointer group">
              <div className={`p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform ${mode.color} border border-app-border/10`}>
                {mode.icon}
              </div>
              <span className="text-xs font-bold text-app-text opacity-80">{mode.label}</span>
            </div>
          ))}
        </section>

        {/* Search Widget */}
        <section className="bg-app-card/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-4 sm:p-8 max-w-5xl mx-auto border border-app-border/50 relative z-20 transition-all duration-500" aria-label="Search Form">
          
          {/* Trip Type Tabs */}
          <div role="tablist" className="flex gap-4 mb-6 border-b border-app-border/50 pb-2 overflow-x-auto no-scrollbar">
            {['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY'].map((type) => (
                <button 
                    key={type}
                    role="tab"
                    aria-selected={tripType === type}
                    onClick={() => setTripType(type as any)}
                    className={`text-sm font-bold pb-2 transition-colors border-b-2 whitespace-nowrap px-2 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded-t-sm ${tripType === type ? 'text-brand-500 border-brand-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                    {t(`tab_${type.toLowerCase()}`)}
                </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} role="search">
            
            {tripType !== 'MULTI_CITY' ? (
                /* --- ONE WAY & ROUND TRIP FORM --- */
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 md:col-span-5 relative group z-40">
                        <label htmlFor="origin-input" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_from')}</label>
                        <div className="flex items-center bg-app-card/20 backdrop-blur-md rounded-xl border border-app-border/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                            <MapPin className="text-app-text opacity-50 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 shrink-0 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                            <div className="flex-grow">
                                <LocationAutocomplete value={origin} onChange={(val, suggestion) => setOrigin(val)} placeholder={t('label_from')} required className="bg-transparent border-none outline-none w-full text-app-text text-sm sm:text-base font-medium placeholder-app-text/40" />
                            </div>
                            <button type="button" onClick={handleGeolocation} disabled={isLocating} className="p-1.5 sm:p-2 rounded-full hover:bg-app-bg/20 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Use current location">
                                {isLocating ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500 animate-spin" aria-hidden="true" /> : <Locate className="h-4 w-4 sm:h-5 sm:w-5 text-app-text opacity-50 hover:text-brand-600" aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex md:col-span-1 items-end justify-center pb-3" aria-hidden="true">
                         {tripType === 'ROUND_TRIP' ? <Repeat className="text-gray-300 dark:text-slate-700 h-6 w-6" /> : <ArrowRight className="text-gray-300 dark:text-slate-700 h-6 w-6 rtl:rotate-180" />}
                    </div>
                    <div className="sm:col-span-2 md:col-span-6 relative group z-30">
                        <label htmlFor="destination-input" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_to')}</label>
                        <div className="flex items-center bg-app-card/20 backdrop-blur-md rounded-xl border border-app-border/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                            <MapPin className="text-app-text opacity-50 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 shrink-0 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                            <div className="flex-grow">
                                <LocationAutocomplete value={destination} onChange={(val, suggestion) => setDestination(val)} placeholder={t('label_to')} required className="bg-transparent border-none outline-none w-full text-app-text text-sm sm:text-base font-medium placeholder-app-text/40" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 mt-4">
                    {/* Departure Date */}
                    <div className={`${tripType === 'ROUND_TRIP' ? 'sm:col-span-1 md:col-span-3' : 'sm:col-span-1 md:col-span-4'} relative group z-20`}>
                        <label htmlFor="departure-date" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_date')}</label>
                        <div className="flex items-center bg-app-card/20 backdrop-blur-md rounded-xl border border-app-border/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                            <Calendar className="text-app-text opacity-50 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 shrink-0 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                            <CustomDatePicker value={date} onChange={setDate} isFlexible={isFlexible} onFlexibleChange={setIsFlexible} className="w-full text-sm sm:text-base" />
                        </div>
                    </div>

                    {/* Return Date (Conditional) */}
                    {tripType === 'ROUND_TRIP' && (
                        <div className="sm:col-span-1 md:col-span-3 relative group z-20 animate-in fade-in zoom-in-95 duration-200">
                            <label htmlFor="return-date" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_return')}</label>
                            <div className="flex items-center bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 dark:border-slate-800/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                                <Calendar className="text-gray-400 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 shrink-0 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                                <CustomDatePicker value={returnDate} onChange={setReturnDate} isFlexible={isFlexible} onFlexibleChange={setIsFlexible} minDate={date} className="w-full text-sm sm:text-base" />
                            </div>
                        </div>
                    )}

                    <div className={`${tripType === 'ROUND_TRIP' ? 'sm:col-span-1 md:col-span-3' : 'sm:col-span-1 md:col-span-4'} relative group z-10`}>
                        <label htmlFor="trip-time" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_time')}</label>
                        <div className="flex items-center bg-app-card/20 backdrop-blur-md rounded-xl border border-app-border/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                            <Clock className="text-app-text opacity-50 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                            <input id="trip-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent border-none outline-none w-full text-app-text text-sm sm:text-base font-medium" required />
                        </div>
                    </div>
                    
                    <div className={`${tripType === 'ROUND_TRIP' ? 'sm:col-span-1 md:col-span-3' : 'sm:col-span-1 md:col-span-4'} relative group z-10`}>
                        <label htmlFor="passengers-input" className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('label_passengers')}</label>
                        <div className="flex items-center bg-app-card/20 backdrop-blur-md rounded-xl border border-app-border/50 group-focus-within:ring-2 ring-brand-500/50 transition-all p-2.5 sm:p-3">
                            <Users className="text-app-text opacity-50 h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 rtl:mr-0 rtl:ml-2 sm:rtl:ml-3" aria-hidden="true" />
                            <input id="passengers-input" type="number" min="1" max="10" value={passengers} onChange={(e) => setPassengers(e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-transparent border-none outline-none w-full text-app-text text-sm sm:text-base font-medium" required placeholder="1" />
                        </div>
                    </div>
                </div>
                </>
            ) : (
                /* --- MULTI CITY FORM --- */
                <div className="space-y-4">
                    {segments.map((segment, index) => (
                        <div key={segment.id} className="relative bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Segment {index + 1}</span>
                                {segments.length > 2 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeSegment(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                                        title="Remove segment"
                                        aria-label={`Remove segment ${index + 1}`}
                                    >
                                        <X className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                )}
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                 {/* Origin */}
                                 <div className="md:col-span-3 z-30">
                                     <div className="flex items-center bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 dark:border-slate-800/50 focus-within:ring-2 focus-within:ring-brand-500/50 p-2">
                                         <MapPin className="text-gray-400 h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                                         <LocationAutocomplete 
                                            value={segment.origin} 
                                            onChange={(val) => updateSegment(index, 'origin', val)} 
                                            placeholder={t('label_from')}
                                            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400" 
                                         />
                                         {index === 0 && (
                                            <button type="button" onClick={handleGeolocation} disabled={isLocating} className="ml-1 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded" aria-label="Use current location">
                                                {isLocating ? <Loader2 className="h-4 w-4 text-brand-500 animate-spin" aria-hidden="true" /> : <Locate className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                                            </button>
                                         )}
                                     </div>
                                 </div>
                                 
                                 {/* Destination */}
                                 <div className="md:col-span-3 z-30">
                                     <div className="flex items-center bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 dark:border-slate-800/50 focus-within:ring-2 focus-within:ring-brand-500/50 p-2">
                                         <MapPin className="text-brand-500 h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                                         <LocationAutocomplete 
                                            value={segment.destination} 
                                            onChange={(val) => updateSegment(index, 'destination', val)} 
                                            placeholder={t('label_to')}
                                            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400" 
                                         />
                                     </div>
                                 </div>

                                 {/* Date */}
                                 <div className="md:col-span-3 z-20">
                                     <div className="flex items-center bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 dark:border-slate-800/50 p-2 h-full focus-within:ring-2 focus-within:ring-brand-500/50">
                                         <Calendar className="text-gray-400 h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                                         <CustomDatePicker 
                                            value={segment.date} 
                                            onChange={(val) => updateSegment(index, 'date', val)} 
                                            isFlexible={false} 
                                            onFlexibleChange={() => {}} 
                                            className="w-full text-sm"
                                            minDate={index > 0 ? segments[index-1].date : undefined}
                                         />
                                     </div>
                                 </div>

                                 {/* Time */}
                                 <div className="md:col-span-3">
                                     <div className="flex items-center bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 dark:border-slate-800/50 p-2 h-full focus-within:ring-2 focus-within:ring-brand-500/50">
                                         <Clock className="text-gray-400 h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                                         <input 
                                            type="time" 
                                            value={segment.time} 
                                            onChange={(e) => updateSegment(index, 'time', e.target.value)} 
                                            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-900 dark:text-white" 
                                            aria-label={`Time for segment ${index + 1}`}
                                         />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-4">
                        {segments.length < 5 && (
                            <button 
                                type="button"
                                onClick={addSegment}
                                className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-4 py-2 rounded-lg transition-colors border border-dashed border-brand-300 dark:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" /> Add City
                            </button>
                        )}
                        
                        <div className="ml-auto flex items-center bg-gray-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-500">
                             <Users className="text-gray-400 h-4 w-4 mr-2" aria-hidden="true" />
                             <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={passengers} 
                                onChange={(e) => setPassengers(e.target.value === '' ? '' : parseInt(e.target.value))} 
                                className="bg-transparent border-none outline-none w-12 text-sm font-medium text-center dark:text-white" 
                                title="Passengers"
                                placeholder="1"
                                aria-label="Number of passengers"
                             />
                             <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">Pax</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-grow text-lg shadow-premium bg-brand-500 hover:bg-brand-600 text-white rounded-3xl">
                <Search className="mr-2 h-5 w-5 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                {tripType === 'ROUND_TRIP' ? t('btn_search_round') : tripType === 'ONE_WAY' ? t('btn_search') : t('btn_search_multi')}
              </Button>
              <button 
                type="button"
                onClick={openSaveModal}
                className="flex items-center justify-center px-6 py-3 border-2 border-white/10 dark:border-slate-700/50 text-slate-300 font-semibold rounded-3xl hover:bg-white/10 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                title="Save this search for later"
              >
                <Heart className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
                Save
              </button>
            </div>
          </form>
          
          {/* Group Booking Link */}
          <div className="mt-4 text-center">
              <button 
                onClick={() => navigate('/group-booking')}
                className="text-xs text-gray-500 hover:text-brand-600 hover:underline flex items-center justify-center mx-auto transition-colors"
              >
                  <Building className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" /> {t('group_booking')}
              </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="max-w-5xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <button 
            onClick={() => navigate('/route-planner')}
            className="flex flex-col items-center justify-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all group"
          >
            <div className="p-3 bg-brand-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-brand-400" />
            </div>
            <span className="text-xs font-bold text-app-text opacity-80">Route Planner</span>
          </button>

          <button 
            onClick={() => navigate('/location-search')}
            className="flex flex-col items-center justify-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all group"
          >
            <div className="p-3 bg-indigo-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <Globe className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-app-text opacity-80">Global Search</span>
          </button>
          
          <button 
            onClick={() => navigate('/saved-trips')}
            className="flex flex-col items-center justify-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all group"
          >
            <div className="p-3 bg-orange-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <Heart className="h-6 w-6 text-orange-400" />
            </div>
            <span className="text-xs font-bold text-app-text opacity-80">Favorites</span>
          </button>

          <button 
            onClick={() => navigate('/alerts')}
            className="flex flex-col items-center justify-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all group"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-app-text opacity-80">Travel Alerts</span>
          </button>

          <button 
            onClick={() => navigate('/impact')}
            className="flex flex-col items-center justify-center p-4 bg-app-card/10 backdrop-blur-xl rounded-2xl border border-app-border/50 shadow-premium hover:shadow-premium-hover hover:bg-app-card/20 transition-all group"
          >
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-app-text opacity-80">My Impact</span>
          </button>
        </section>

        {/* --- SAVED SEARCHES SECTION --- */}
        {savedSearches.length > 0 && (
           <section className="max-w-5xl mx-auto mt-6 bg-app-card/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-app-border/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
             <button 
               onClick={() => setIsSavedSectionOpen(!isSavedSectionOpen)}
               className="w-full flex items-center justify-between p-4 bg-app-card/20 hover:bg-app-card/30 transition-colors focus:outline-none"
               aria-expanded={isSavedSectionOpen}
             >
               <div className="flex items-center gap-2">
                 <Bookmark className="h-5 w-5 text-brand-500" aria-hidden="true" />
                 <h3 className="font-bold text-app-text">{t('saved_routes')}</h3>
                 <span className="bg-brand-500/20 text-brand-400 text-xs font-bold px-2 py-0.5 rounded-full">{savedSearches.length}</span>
               </div>
               {isSavedSectionOpen ? <ChevronUp className="h-4 w-4 text-app-text opacity-50" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-app-text opacity-50" aria-hidden="true" />}
             </button>
             
             {isSavedSectionOpen && (
               <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-transparent">
                 {savedSearches.map(saved => (
                   <button 
                     key={saved.id}
                     onClick={() => handleApplySearch(saved)}
                     className="group relative flex flex-col p-3 rounded-xl border border-app-border/20 hover:border-brand-500/50 hover:bg-app-card/20 transition-all cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                   >
                     <div className="flex justify-between items-start mb-2 w-full">
                       <div className="flex items-center gap-1.5 font-bold text-app-text">
                         <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                         {saved.name}
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                         <div 
                           role="button"
                           tabIndex={0}
                           onClick={(e) => handleEditSaved(saved, e)}
                           onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleEditSaved(saved, e); }}
                           className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           {/* Edit Icon SVG */}
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </div>
                         <div
                           role="button"
                           tabIndex={0}
                           onClick={(e) => handleDeleteSaved(saved.id, e)}
                           onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleDeleteSaved(saved.id, e); }}
                           className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                         >
                           <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                         </div>
                       </div>
                     </div>
                     <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {saved.origin} → {saved.destination}
                     </div>
                     <div className="text-xs text-slate-500 mt-1 flex justify-between w-full">
                        <span>{formatDate(saved.date)}</span>
                        <span>{saved.tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}</span>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </section>
        )}

        {/* Why Choose MaaS Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-app-text mb-4">Why Choose MaaS?</h2>
            <p className="text-app-text opacity-60 max-w-2xl mx-auto">Experience the future of urban mobility with our integrated platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <div className="p-4 bg-brand-500/10 rounded-2xl"><Globe className="h-8 w-8 text-brand-400" /></div>, title: 'Integrated Network', desc: 'Access cabs, buses, trains, and metro all from a single interface.' },
              { icon: <div className="p-4 bg-amber-500/10 rounded-2xl"><Zap className="h-8 w-8 text-amber-400" /></div>, title: 'Real-time Updates', desc: 'Get live tracking and instant alerts for all your transit modes.' },
              { icon: <div className="p-4 bg-emerald-500/10 rounded-2xl"><Users className="h-8 w-8 text-emerald-400" /></div>, title: 'Eco-Friendly', desc: 'Choose greener routes and track your carbon footprint reduction.' }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 bg-app-card/10 backdrop-blur-xl rounded-[2.5rem] border border-app-border/50 shadow-premium hover:shadow-premium-hover transition-all group">
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-app-text mb-3">{feature.title}</h3>
                <p className="text-app-text opacity-60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download App Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-[3rem] p-8 sm:p-16 overflow-hidden relative shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-black/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                  Travel Smarter with the <span className="text-amber-300">MaaS App</span>
                </h2>
                <p className="text-brand-100 text-lg mb-10 opacity-90">
                  Book rides, track transit, and manage your mobility budget all in one place. Available now on iOS and Android.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl hover:scale-105">
                    <Globe className="h-8 w-8" />
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold opacity-60">Download on the</div>
                      <div className="text-lg font-bold leading-none">App Store</div>
                    </div>
                  </button>
                  <button className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl hover:scale-105">
                    <Locate className="h-8 w-8" />
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold opacity-60">Get it on</div>
                      <div className="text-lg font-bold leading-none">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="w-64 h-[400px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-center">
                      <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                   </div>
                   <div className="p-4 pt-10">
                      <div className="w-full h-32 bg-brand-500/20 rounded-2xl mb-4 animate-pulse"></div>
                      <div className="space-y-3">
                        <div className="w-3/4 h-4 bg-slate-800 rounded"></div>
                        <div className="w-1/2 h-4 bg-slate-800 rounded"></div>
                        <div className="w-full h-20 bg-slate-800 rounded-xl"></div>
                      </div>
                   </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-amber-400 text-slate-900 p-4 rounded-2xl font-bold shadow-lg animate-bounce">
                  4.9 ★
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Save Modal */}
        {isSaveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
                <div ref={saveModalRef} className="bg-app-card rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-app-border">
                    <h3 className="text-lg font-bold text-app-text mb-4">{editingId ? 'Edit Saved Search' : 'Save This Search'}</h3>
                    <input 
                        type="text" 
                        value={routeToSaveName}
                        onChange={(e) => setRouteToSaveName(e.target.value)}
                        placeholder="e.g. Daily Office Commute"
                        className="w-full border border-app-border bg-app-bg rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-brand-500 outline-none text-app-text"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-2 text-app-text opacity-70 font-medium hover:bg-app-bg rounded-lg transition-colors">Cancel</button>
                        <Button onClick={confirmSaveSearch} className="flex-1">Save</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Save Success Toast */}
        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
            <Search className="h-5 w-5" />
            <span className="font-bold text-sm">Search saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

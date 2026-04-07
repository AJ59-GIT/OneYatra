
import React, { useState, useEffect, useRef } from 'react';
import { Plane, Building2, MapPin, Home, Briefcase, Star, Loader2, X, Navigation } from 'lucide-react';
import { LocationSuggestion, searchLocations, getCityFromCoordinates } from '../services/locationService';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, suggestion?: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  className,
  required
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const skipNextFetch = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Try to get user's location for search biasing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to India center if permission denied or unavailable
        },
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2 || skipNextFetch.current) {
         if (skipNextFetch.current) skipNextFetch.current = false;
         setSuggestions([]); 
         return;
      }
      setIsLoading(true);
      try {
        const results = await searchLocations(value, userCoords || undefined);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200); // 200ms Debounce
    return () => clearTimeout(timer);
  }, [value, userCoords]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (s: LocationSuggestion) => {
    skipNextFetch.current = true;
    onChange(s.fullAddress || s.city, s);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const cityName = await getCityFromCoordinates(latitude, longitude);
        if (cityName) {
          onChange(cityName);
          // Trigger a search with the city name to get full details
          const results = await searchLocations(cityName, { lat: latitude, lng: longitude });
          if (results.length > 0) {
            selectSuggestion(results[0]);
          }
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Unable to retrieve your location. Please check your browser permissions.");
      },
      { timeout: 10000 }
    );
  };

  const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="font-bold text-brand-600">{part}</span> : part
        )}
      </span>
    );
  };

  const getIcon = (item: LocationSuggestion) => {
      if (item.type === 'AIRPORT') return <Plane className="h-4 w-4" />;
      if (item.type === 'SAVED') {
          const lowerCity = item.city.toLowerCase();
          if (lowerCity.includes('home')) return <Home className="h-4 w-4" />;
          if (lowerCity.includes('work') || lowerCity.includes('office')) return <Briefcase className="h-4 w-4" />;
          return <Star className="h-4 w-4" />;
      }
      if (item.type === 'CITY') return <Building2 className="h-4 w-4" />;
      return <MapPin className="h-4 w-4" />;
  };

  const getIconBg = (item: LocationSuggestion) => {
      if (item.type === 'AIRPORT') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      if (item.type === 'SAVED') return 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400';
      if (item.type === 'CITY') return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400';
  };

  const activeDescendantId = highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined;

  return (
    <div ref={wrapperRef} className="w-full relative group">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
               onChange(e.target.value);
               if(!isOpen && e.target.value.length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length >= 2 && setIsOpen(true)}
            className={`${className} pr-24`}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-activedescendant={activeDescendantId}
            aria-label={placeholder || "Location Search"}
          />
          
          <div className="absolute right-3 flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            
            {value && (
              <button 
                type="button"
                onClick={() => {
                  onChange('');
                  setSuggestions([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`p-1.5 rounded-lg transition-all ${isLocating ? 'bg-brand-50 text-brand-600 animate-pulse' : 'hover:bg-brand-50 text-gray-400 hover:text-brand-600 dark:hover:bg-brand-900/20'}`}
              title="Locate Me"
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {isOpen && (
           <ul 
             id="location-listbox"
             role="listbox"
             className="absolute z-[1000] left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-2xl dark:shadow-black/50 max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
           >
              {suggestions.map((item, index) => (
                <li 
                  key={`${item.id}-${index}`}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() => selectSuggestion(item)}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${index === highlightedIndex ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                >
                   <div className={`p-2 rounded-full mr-3 shrink-0 ${getIconBg(item)}`}>
                      {getIcon(item)}
                   </div>
                   <div className="flex-grow min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white text-sm truncate flex items-center gap-2">
                        <HighlightText text={item.city} highlight={value} />
                        {item.code && <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-slate-800 tracking-wider">{item.code}</span>}
                        {item.type === 'SAVED' && <span className="text-[9px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-1.5 rounded uppercase font-bold">Saved</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {item.state}{item.country && item.country !== 'India' ? `, ${item.country}` : ''}
                      </div>
                   </div>
                </li>
              ))}
           </ul>
        )}
    </div>
  );
};

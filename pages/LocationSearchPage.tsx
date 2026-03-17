
import React, { useState } from 'react';
import { MapPin, Search, ArrowLeft, Globe, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { MapComponent } from '../components/MapComponent';
import { LocationSuggestion } from '../services/locationService';

const LocationSearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);

  const markers = selectedLocation ? [{
    position: [selectedLocation.lat, selectedLocation.lng] as [number, number],
    label: selectedLocation.fullAddress || selectedLocation.city
  }] : [];

  const handleLocationChange = (val: string, suggestion?: LocationSuggestion) => {
    setSearchQuery(val);
    if (suggestion) {
      setSelectedLocation(suggestion);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-600" />
            Global Location Search
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Search Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Search Everywhere</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  </div>
                  <LocationAutocomplete 
                    value={searchQuery} 
                    onChange={handleLocationChange}
                    placeholder="Search city, street, or landmark..."
                    className="pl-10 w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none p-3"
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">
                  Results are prioritized based on your location or India center.
                </p>
              </div>

              {selectedLocation && (
                <div className="pt-6 border-t border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Location Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedLocation.city}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{selectedLocation.fullAddress}</div>
                      </div>
                    </div>
                    {selectedLocation && (
                      <div className="flex items-center gap-3">
                        <Navigation className="h-5 w-5 text-orange-500 shrink-0" />
                        <div className="text-xs font-mono text-gray-500 dark:text-slate-400">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20">
              <h4 className="font-bold mb-2">How it works</h4>
              <ul className="text-xs space-y-2 text-brand-100">
                <li className="flex gap-2">
                  <span className="font-bold">•</span>
                  Global search powered by OpenStreetMap data.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">•</span>
                  Results are biased towards India (lat: 20.5937, lon: 78.9629).
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">•</span>
                  If GPS is enabled, results near you appear first.
                </li>
              </ul>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-2 h-[600px]">
              <MapComponent 
                markers={markers}
                className="h-full w-full rounded-xl"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LocationSearchPage;

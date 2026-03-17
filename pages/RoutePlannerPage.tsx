
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Ruler, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { MapComponent } from '../components/MapComponent';
import { getRoadDistance, RouteData, LocationSuggestion } from '../services/locationService';
import { Button } from '../components/Button';

const RoutePlannerPage = () => {
  const navigate = useNavigate();
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [origin, setOrigin] = useState<LocationSuggestion | null>(null);
  const [destination, setDestination] = useState<LocationSuggestion | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOriginChange = (val: string, suggestion?: LocationSuggestion) => {
    setOriginInput(val);
    if (suggestion) setOrigin(suggestion);
  };

  const handleDestChange = (val: string, suggestion?: LocationSuggestion) => {
    setDestInput(val);
    if (suggestion) setDestination(suggestion);
  };

  // Trigger route calculation when both points are selected
  useEffect(() => {
    const calculateRoute = async () => {
      if (origin && destination) {
        setIsLoading(true);
        const data = await getRoadDistance({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng });
        setRoute(data);
        setIsLoading(false);
      } else {
        setRoute(null);
      }
    };

    calculateRoute();
  }, [origin, destination]);

  const markers = [
    ...(origin ? [{ position: [origin.lat, origin.lng] as [number, number], label: `Start: ${origin.city}` }] : []),
    ...(destination ? [{ position: [destination.lat, destination.lng] as [number, number], label: `End: ${destination.city}` }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Route Planner</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-6">
              
              {/* Origin Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Starting Point</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className="h-5 w-5 text-brand-500" />
                  </div>
                  <LocationAutocomplete 
                    value={originInput} 
                    onChange={handleOriginChange}
                    placeholder="Enter starting city or place..."
                    className="pl-10 w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Destination Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Destination</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className="h-5 w-5 text-orange-500" />
                  </div>
                  <LocationAutocomplete 
                    value={destInput} 
                    onChange={handleDestChange}
                    placeholder="Enter destination..."
                    className="pl-10 w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Route Info */}
              {route && (
                <div className="pt-6 border-t border-gray-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-1">
                        <Ruler className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Distance</span>
                      </div>
                      <div className="text-2xl font-black text-brand-700 dark:text-brand-300">
                        {route.distance} <span className="text-sm font-normal">km</span>
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Duration</span>
                      </div>
                      <div className="text-2xl font-black text-orange-700 dark:text-orange-300">
                        {Math.floor(route.duration / 60)}h {route.duration % 60}m
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/', { state: { origin: origin?.city, destination: destination?.city } })}
                  >
                    Search Travel Options
                  </Button>
                </div>
              )}

              {!route && !isLoading && origin && destination && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                  Could not calculate route between these points.
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Smart Routing
              </h3>
              <p className="text-sm text-brand-100 leading-relaxed">
                Our system uses real-time road data from OpenStreetMap to provide the most accurate distance and duration estimates for your journey.
              </p>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-2 h-[600px]">
              <MapComponent 
                markers={markers}
                route={route?.geometry}
                className="h-full w-full rounded-xl"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoutePlannerPage;

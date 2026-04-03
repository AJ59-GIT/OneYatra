
import { useEffect, useState } from 'react';
import { Heart, ArrowLeft, MapPin } from 'lucide-react';
import { SavedTrip, TravelOption } from '../types';
import { getSavedTrips, removeTrip } from '../services/savedTripsService';
import { TravelCard } from '../components/TravelCard';
import { EmptyState } from '../components/EmptyState';

interface SavedTripsPageProps {
  onBack: () => void;
  onBookOption: (option: TravelOption, context?: { origin: string, destination: string }) => void;
}

export const SavedTripsPage = ({ onBack, onBookOption }: SavedTripsPageProps) => {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    setSavedTrips(getSavedTrips());
  }, []);

  const handleRemove = (id: string) => {
    setSavedTrips(removeTrip(id));
  };

  // Group trips by Route only (ignore date)
  const groupedTrips = savedTrips.reduce((groups, trip) => {
    const key = `${trip.origin} to ${trip.destination}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(trip);
    return groups;
  }, {} as Record<string, SavedTrip[]>);

  const handleBookSavedTrip = (trip: SavedTrip) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Calculate new arrival time based on original duration
    // For simplicity, we'll just keep the original duration if possible
    // or just update the departure time to 'Now'
    
    const updatedOption: TravelOption = {
      ...trip.option,
      departureTime: timeStr,
      // We could calculate arrivalTime here, but usually the provider handles it.
      // For the UI, let's just keep the original duration and update arrival accordingly if we can parse it.
    };

    onBookOption(updatedOption, { origin: trip.origin, destination: trip.destination });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-200 gap-4">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-sm text-gray-500 hover:text-brand-600 mb-2 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="h-8 w-8 text-brand-500 mr-3 fill-brand-100" />
                Saved Trips
            </h1>
            <span className="flex items-center text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {savedTrips.length} Items
            </span>
          </div>
        </div>
      </div>

      {savedTrips.length === 0 ? (
        <EmptyState 
            icon={Heart}
            title="No saved trips yet"
            description="Heart items from your search results to see them here."
            actionLabel="Find a Trip"
            onAction={onBack}
        />
      ) : (
        <div className="space-y-8">
           {Object.entries(groupedTrips).map(([route, trips]) => {
              return (
                 <div key={route} className="bg-slate-50/50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-brand-500" />
                          <span className="font-bold text-gray-900 text-sm">{route}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       {(trips as SavedTrip[]).map(trip => (
                          <div key={trip.id} className="relative group">
                             <TravelCard 
                                option={trip.option} 
                                onBook={() => handleBookSavedTrip(trip)}
                                isSaved={true}
                                onToggleSave={() => handleRemove(trip.option.id)}
                             />
                             <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                Saved {new Date(trip.savedAt).toLocaleDateString()}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )
           })}
        </div>
      )}
    </div>
  );
};

export default SavedTripsPage;

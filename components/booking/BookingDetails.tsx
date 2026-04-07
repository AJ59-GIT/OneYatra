
import React from 'react';
import { ArrowRight, Plane, Briefcase, Info, Car, Train, Bus } from 'lucide-react';
import { TravelOption, TransportMode } from '../../types';
import { Button } from '../Button';
import { SeatMap } from '../SeatMap';

interface BookingDetailsProps {
  option: TravelOption;
  origin: string;
  destination: string;
  passengersCount: number;
  onProceed: (seats: any[]) => void;
  onBack: () => void;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({
  option, origin, destination, passengersCount, onProceed, onBack
}) => {
  const [selectedSeats, setSelectedSeats] = React.useState<any[]>([]);

  const getBaggageInfo = () => {
    if (option.mode !== 'FLIGHT') return null;
    return {
      cabin: "7 kg (1 piece)",
      checkIn: "15 kg (1 piece)",
      extra: "Extra baggage can be added at the counter"
    };
  };

  const getCarInfo = () => {
    if (option.mode !== 'CAB') return null;
    return {
      type: option.provider.includes('Prime') ? 'Sedan' : 'Hatchback',
      capacity: "4 Passengers",
      features: ["AC", "Professional Driver", "Clean Interior"]
    };
  };

  const baggage = getBaggageInfo();
  const car = getCarInfo();

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Trip Details</h2>
      
      {/* Trip Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
         <div className="flex justify-between items-start mb-4">
            <div>
               <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {origin} <ArrowRight className="h-5 w-5 text-gray-400" /> {destination}
               </div>
               <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date().toLocaleDateString()} • {option.departureTime}
               </div>
            </div>
            <div className="text-right">
               <div className="text-xl font-bold text-brand-500">₹{option.price.toLocaleString()}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400">{passengersCount} Traveller(s)</div>
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600">
               {option.mode === 'FLIGHT' && <Plane className="h-4 w-4 text-blue-600" />}
               {option.mode === 'CAB' && <Car className="h-4 w-4 text-yellow-600" />}
               {option.mode === 'TRAIN' && <Train className="h-4 w-4 text-red-600" />}
               {option.mode === 'BUS' && <Bus className="h-4 w-4 text-orange-600" />}
            </div>
            <div>
               <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{option.provider}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400">{option.mode} • {option.duration}</div>
            </div>
         </div>
      </div>

      {/* Specifics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         {baggage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
               <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4" /> Baggage Information
               </h3>
               <div className="space-y-2 text-xs text-blue-700 dark:text-blue-400">
                  <div className="flex justify-between">
                     <span>Cabin Baggage:</span>
                     <span className="font-bold">{baggage.cabin}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Check-in Baggage:</span>
                     <span className="font-bold">{baggage.checkIn}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 italic">
                     {baggage.extra}
                  </div>
               </div>
            </div>
         )}

         {car && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4">
               <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 flex items-center gap-2 mb-3">
                  <Car className="h-4 w-4" /> Vehicle Details
               </h3>
               <div className="space-y-2 text-xs text-yellow-700 dark:text-yellow-400">
                  <div className="flex justify-between">
                     <span>Car Type:</span>
                     <span className="font-bold">{car.type}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Capacity:</span>
                     <span className="font-bold">{car.capacity}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                     {car.features.map((f, i) => (
                        <span key={i} className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-700 text-[10px]">
                           {f}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         )}

         <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
               <Info className="h-4 w-4" /> Important Information
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
               <li>Reporting time: 30 mins before departure</li>
               <li>Carry a valid Government ID proof</li>
               <li>Masks are recommended during travel</li>
               <li>Cancellation charges apply as per policy</li>
            </ul>
         </div>
      </div>

      {/* Seat Selection Integration */}
      {['FLIGHT', 'TRAIN', 'BUS'].includes(option.mode) && (
         <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Select Your Seats</h3>
            <SeatMap 
               mode={option.mode}
               passengersCount={passengersCount}
               onConfirm={(seats) => {
                  setSelectedSeats(seats);
                  onProceed(seats);
               }}
               onSkip={() => onProceed([])}
               basePrice={option.price}
            />
         </div>
      )}

      {!['FLIGHT', 'TRAIN', 'BUS'].includes(option.mode) && (
         <Button onClick={() => onProceed([])} className="w-full py-4 text-lg shadow-lg shadow-brand-500/30">
            Proceed to Passenger Details
         </Button>
      )}
    </div>
  );
};

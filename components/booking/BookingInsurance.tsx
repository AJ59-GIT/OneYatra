
import React from 'react';
import { ArrowRight, ShieldCheck, Check, Leaf } from 'lucide-react';
import { TravelOption } from '../../types';
import { Button } from '../Button';

interface BookingInsuranceProps {
  option: TravelOption;
  origin: string;
  destination: string;
  passengersCount: number;
  onProceed: (insurance: boolean, carbonOffset: boolean) => void;
  onBack: () => void;
}

export const BookingInsurance: React.FC<BookingInsuranceProps> = ({
  option, origin, destination, passengersCount, onProceed, onBack
}) => {
  const [insurance, setInsurance] = React.useState(true);
  const [carbonOffset, setCarbonOffset] = React.useState(false);

  const handleProceed = () => {
    onProceed(insurance, carbonOffset);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Travel Insurance & Extras</h2>
      
      {/* Trip Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
         <div className="flex justify-between items-start">
            <div>
               <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {origin} <ArrowRight className="h-5 w-5 text-gray-400" /> {destination}
               </div>
               <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date().toLocaleDateString()} • {option.departureTime}
               </div>
            </div>
            <div className="text-right">
               <div className="text-xl font-bold text-brand-600">₹{option.price.toLocaleString()}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400">{passengersCount} Traveller(s)</div>
            </div>
         </div>
      </div>

      {/* Insurance & Carbon Offset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         <div 
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${insurance ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
            onClick={() => setInsurance(!insurance)}
         >
            <div className="flex justify-between items-start mb-2">
               <ShieldCheck className={`h-6 w-6 ${insurance ? 'text-green-600' : 'text-gray-400'}`} />
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${insurance ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                  {insurance && <Check className="h-3 w-3 text-white" />}
               </div>
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Travel Insurance</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cover for medical emergencies, trip delays, and lost baggage.</p>
            <div className="mt-2 text-sm font-bold text-green-600">₹199 / traveller</div>
         </div>

         <div 
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${carbonOffset ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
            onClick={() => setCarbonOffset(!carbonOffset)}
         >
            <div className="flex justify-between items-start mb-2">
               <Leaf className={`h-6 w-6 ${carbonOffset ? 'text-emerald-600' : 'text-gray-400'}`} />
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${carbonOffset ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                  {carbonOffset && <Check className="h-3 w-3 text-white" />}
               </div>
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Carbon Offset</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Neutralize your carbon footprint by supporting green projects.</p>
            <div className="mt-2 text-sm font-bold text-emerald-600">₹49 / trip</div>
         </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1 py-4">
          Back
        </Button>
        <Button onClick={handleProceed} className="flex-[2] py-4 text-lg shadow-lg shadow-brand-500/30">
          Proceed to Meals
        </Button>
      </div>
    </div>
  );
};

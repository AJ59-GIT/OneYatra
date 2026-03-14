import React from 'react';
import { ArrowRight, Plane, ChevronUp, ChevronDown, Shield, User, ShieldCheck, Check, RotateCw } from 'lucide-react';
import { TravelOption, Passenger, SavedTraveler, UserDocument } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';
import { FormErrorSummary } from '../FormErrorSummary';

interface BookingReviewProps {
  option: TravelOption;
  origin: string;
  destination: string;
  passengersCount: number;
  passengers: Passenger[];
  expandedIndex: number;
  setExpandedIndex: (index: number) => void;
  errors: Record<string, string>;
  savedTravelers: SavedTraveler[];
  vaultDocs: UserDocument[];
  activeVaultIndex: number | null;
  setActiveVaultIndex: (index: number | null) => void;
  isPolicyExpanded: boolean;
  setIsPolicyExpanded: (expanded: boolean) => void;
  updatePassenger: (index: number, field: keyof Passenger, value: any) => void;
  fillFromVault: (doc: UserDocument) => void;
  getCancellationPolicy: () => any;
  onProceed: () => void;
}

export const BookingReview: React.FC<BookingReviewProps> = ({
  option, origin, destination, passengersCount, passengers,
  expandedIndex, setExpandedIndex, errors, savedTravelers,
  vaultDocs, activeVaultIndex, setActiveVaultIndex,
  isPolicyExpanded, setIsPolicyExpanded,
  updatePassenger, fillFromVault, getCancellationPolicy, onProceed
}) => {
  const inputClasses = "col-span-1 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors";

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Review & Travelers</h2>
      
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
               <div className="text-xl font-bold text-brand-600">₹{option.price.toLocaleString()}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400">{passengersCount} Traveller(s)</div>
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600">
               {/* Note: Plane is a placeholder, in real app we'd use TransportIcon or similar */}
               <Plane className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
               <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{option.provider}</div>
               <div className="text-xs text-gray-500 dark:text-gray-400">{option.mode} • {option.duration}</div>
            </div>
         </div>
      </div>

      {Object.keys(errors).length > 0 && (
          <FormErrorSummary errors={errors} title="Please fix the errors below" />
      )}

      {/* Passenger Forms */}
      <div className="space-y-4 mb-8">
         {passengers.map((passenger, index) => (
           <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-all">
              <div 
                className={`p-4 flex justify-between items-center cursor-pointer focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-700 ${expandedIndex === index ? 'bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600' : ''}`}
                onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                       {index + 1}
                    </div>
                    <div>
                       <div className="font-bold text-sm text-gray-900 dark:text-white">{passenger.name || `Passenger ${index + 1}`}</div>
                       {passenger.age && <div className="text-xs text-gray-500 dark:text-gray-400">{passenger.gender}, {passenger.age} yrs</div>}
                    </div>
                 </div>
                 {expandedIndex === index ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>

              {expandedIndex === index && (
                 <div className="p-4 space-y-2 animate-in slide-in-from-top-2">
                    
                    {/* Autofill Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                       <button
                          type="button"
                          onClick={() => setActiveVaultIndex(index)}
                          className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-3 py-1 text-xs whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       >
                          <Shield className="h-3 w-3" /> Autofill from Vault
                       </button>

                       {savedTravelers.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                               updatePassenger(index, 'name', t.name);
                               updatePassenger(index, 'age', t.age);
                               updatePassenger(index, 'gender', t.gender);
                               updatePassenger(index, 'idType', t.idType);
                               updatePassenger(index, 'idNumber', t.idNumber);
                            }}
                            className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1 text-xs whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                             <User className="h-3 w-3 text-gray-400" /> {t.name}
                          </button>
                       ))}

                       {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                               const p1 = passengers[0];
                               updatePassenger(index, 'gender', p1.gender);
                               updatePassenger(index, 'idType', p1.idType);
                            }}
                            className="flex items-center gap-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-full px-3 py-1 text-xs whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                             <RotateCw className="h-3 w-3" /> Copy from P1
                          </button>
                       )}
                    </div>

                    <Input
                       label="Full Name"
                       value={passenger.name}
                       onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                       placeholder="As per ID proof"
                       error={errors[`name_${index}`]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                       <Input 
                          label="Age"
                          type="number"
                          value={passenger.age}
                          onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                          placeholder="Yrs"
                          error={errors[`age_${index}`]}
                       />
                       <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                          <div className="flex gap-2">
                             {['M', 'F', 'O'].map(g => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => updatePassenger(index, 'gender', g)}
                                  className={`flex-1 py-3 rounded-lg text-xs font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${passenger.gender === g ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'} ${errors[`gender_${index}`] ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                                >
                                   {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                                </button>
                             ))}
                          </div>
                          {errors[`gender_${index}`] && <p className="text-xs text-red-600 mt-1 font-bold">{errors[`gender_${index}`]}</p>}
                       </div>
                    </div>

                    {(option.mode === 'FLIGHT' || option.mode === 'TRAIN') && (
                       <div className="pt-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Government ID</label>
                          <div className="grid grid-cols-3 gap-3">
                             <select 
                               value={passenger.idType || ''}
                               onChange={(e) => updatePassenger(index, 'idType', e.target.value)}
                               className={`${inputClasses} ${errors[`idType_${index}`] ? 'border-red-500' : ''}`}
                             >
                                <option value="">Select ID</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="AADHAAR">Aadhaar</option>
                                <option value="PAN">PAN</option>
                                <option value="VOTER_ID">Voter ID</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                             </select>
                             <input 
                               type="text"
                               value={passenger.idNumber || ''}
                               onChange={(e) => updatePassenger(index, 'idNumber', e.target.value)}
                               placeholder="ID Number"
                               className={`col-span-2 ${inputClasses} ${errors[`idNumber_${index}`] ? 'border-red-500' : ''}`}
                             />
                          </div>
                          {(errors[`idType_${index}`] || errors[`idNumber_${index}`]) && (
                            <p className="text-xs text-red-600 mt-1 font-bold">
                              {errors[`idNumber_${index}`] || errors[`idType_${index}`] || 'ID details required.'}
                            </p>
                          )}
                       </div>
                    )}
                 </div>
              )}
           </div>
         ))}
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
         <button 
           onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
           className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700"
         >
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
               <ShieldCheck className="h-4 w-4 text-green-600" />
               Cancellation Policy
            </div>
            {isPolicyExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
         </button>
         
         {isPolicyExpanded && (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300 animate-in slide-in-from-top-2">
               <p className="mb-3">{getCancellationPolicy().description}</p>
               <div className="space-y-2">
                  {getCancellationPolicy().tiers.map((tier: any, i: number) => (
                     <div key={i} className="flex justify-between items-center text-xs">
                        <span>{tier.label}</span>
                        <span className={`font-bold ${tier.color}`}>{tier.refund}% Refund</span>
                     </div>
                  ))}
               </div>
               <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-green-600 font-bold flex items-center">
                  <Check className="h-3 w-3 mr-1" /> {getCancellationPolicy().freeCancelText}
               </div>
            </div>
         )}
      </div>

      <Button onClick={onProceed} className="w-full py-4 text-lg shadow-lg shadow-brand-500/30">
         Proceed to {option.mode === 'CAB' ? 'Extras' : 'Seat Selection'}
      </Button>
    </div>
  );
};

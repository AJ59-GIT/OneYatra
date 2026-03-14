import React from 'react';
import { SpecialRequirements } from '../SpecialRequirements';
import { SpecialRequestOption, TransportMode } from '../../types';

interface BookingSpecialRequestsProps {
  mode: TransportMode;
  onConfirmed: (requests: SpecialRequestOption[], notes: string) => void;
  onSkipped: () => void;
}

export const BookingSpecialRequests: React.FC<BookingSpecialRequestsProps> = ({ mode, onConfirmed, onSkipped }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Special Requirements</h2>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
        <SpecialRequirements 
          mode={mode}
          onConfirm={onConfirmed} 
          onSkip={onSkipped}
        />
      </div>
    </div>
  );
};

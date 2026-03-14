import React from 'react';
import { SeatMap } from '../SeatMap';
import { TransportMode } from '../../types';

interface BookingSeatSelectionProps {
  mode: TransportMode;
  passengersCount: number;
  onConfirmed: (seats: any[]) => void;
  onSkipped: () => void;
  basePrice: number;
}

export const BookingSeatSelection: React.FC<BookingSeatSelectionProps> = ({ mode, passengersCount, onConfirmed, onSkipped, basePrice }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Your Seats</h2>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
        <SeatMap 
          mode={mode}
          passengersCount={passengersCount}
          onConfirm={onConfirmed}
          onSkip={onSkipped}
          basePrice={basePrice}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { MealSelection } from '../MealSelection';
import { Meal, Passenger } from '../../types';

interface BookingMealSelectionProps {
  passengers: Passenger[];
  onConfirmed: (meal: Meal | null, specialRequests: string) => void;
  onSkipped: () => void;
  currency: string;
}

export const BookingMealSelection: React.FC<BookingMealSelectionProps> = ({ passengers, onConfirmed, onSkipped, currency }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose Your Meal</h2>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
        <MealSelection 
          passengers={passengers}
          onConfirm={onConfirmed}
          onSkip={onSkipped}
          currency={currency}
        />
      </div>
    </div>
  );
};

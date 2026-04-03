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
      <div className="mb-8 h-[600px]">
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

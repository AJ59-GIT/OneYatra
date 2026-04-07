
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TravelOption, Passenger, Booking, SpecialRequestOption, Meal } from '../types';

interface BookingState {
  option: TravelOption | null;
  passengersCount: number;
  travelDate: string;
  origin: string;
  destination: string;
  passengers: Passenger[];
  selectedSeats: any[];
  selectedMeal: Meal | null;
  selectedRequests: SpecialRequestOption[];
  specialRequestNotes: string;
  hasInsurance: boolean;
  hasCarbonOffset: boolean;
  seatCost: number;
  mealCost: number;
  specialRequestCost: number;
  insuranceCost: number;
  carbonOffsetCost: number;
  step: string;
}

interface BookingContextType {
  state: BookingState;
  initBooking: (data: { option: TravelOption, passengersCount: number, travelDate: string, origin: string, destination: string }) => void;
  updatePassengers: (passengers: Passenger[]) => void;
  updateSeats: (seats: any[], cost: number) => void;
  updateMeal: (meal: Meal | null, notes: string, cost: number) => void;
  updateSpecialRequests: (requests: SpecialRequestOption[], notes: string, cost: number) => void;
  updateInsurance: (hasInsurance: boolean, hasCarbonOffset: boolean, iCost: number, cCost: number) => void;
  setStep: (step: string) => void;
  resetBooking: () => void;
}

const initialState: BookingState = {
  option: null,
  passengersCount: 1,
  travelDate: '',
  origin: '',
  destination: '',
  passengers: [],
  selectedSeats: [],
  selectedMeal: null,
  selectedRequests: [],
  specialRequestNotes: '',
  hasInsurance: false,
  hasCarbonOffset: false,
  seatCost: 0,
  mealCost: 0,
  specialRequestCost: 0,
  insuranceCost: 0,
  carbonOffsetCost: 0,
  step: 'DETAILS'
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingState>(initialState);

  const initBooking = (data: { option: TravelOption, passengersCount: number, travelDate: string, origin: string, destination: string }) => {
    setState(prev => ({
      ...initialState,
      ...data,
      passengers: Array(data.passengersCount).fill({ name: '', age: '', gender: '', idType: '', idNumber: '' })
    }));
  };

  const updatePassengers = (passengers: Passenger[]) => {
    setState(prev => ({ ...prev, passengers }));
  };

  const updateSeats = (seats: any[], cost: number) => {
    setState(prev => ({ ...prev, selectedSeats: seats, seatCost: cost }));
  };

  const updateMeal = (meal: Meal | null, notes: string, cost: number) => {
    setState(prev => ({ 
      ...prev, 
      selectedMeal: meal, 
      mealCost: cost,
      specialRequestNotes: prev.specialRequestNotes ? `${prev.specialRequestNotes}. ${notes}` : notes
    }));
  };

  const updateSpecialRequests = (requests: SpecialRequestOption[], notes: string, cost: number) => {
    setState(prev => ({ 
      ...prev, 
      selectedRequests: requests, 
      specialRequestCost: cost,
      specialRequestNotes: prev.specialRequestNotes ? `${prev.specialRequestNotes}. ${notes}` : notes
    }));
  };

  const updateInsurance = (hasInsurance: boolean, hasCarbonOffset: boolean, iCost: number, cCost: number) => {
    setState(prev => ({ ...prev, hasInsurance, hasCarbonOffset, insuranceCost: iCost, carbonOffsetCost: cCost }));
  };

  const setStep = (step: string) => {
    setState(prev => ({ ...prev, step }));
  };

  const resetBooking = () => {
    setState(initialState);
  };

  return (
    <BookingContext.Provider value={{ 
      state, 
      initBooking, 
      updatePassengers, 
      updateSeats, 
      updateMeal, 
      updateSpecialRequests, 
      updateInsurance,
      setStep,
      resetBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

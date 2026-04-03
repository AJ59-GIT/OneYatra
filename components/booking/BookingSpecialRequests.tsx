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
      <div className="mb-8 h-[600px]">
        <SpecialRequirements 
          mode={mode}
          onConfirm={onConfirmed} 
          onSkip={onSkipped}
        />
      </div>
    </div>
  );
};

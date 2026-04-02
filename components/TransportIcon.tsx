import { Plane, Bus, Train, Car, Bike, Zap, Navigation, Anchor, Users, Footprints, Bike as Bicycle } from 'lucide-react';
import { TransportMode } from '../types';

interface TransportIconProps {
  mode: TransportMode;
  className?: string;
}

export const TransportIcon = ({ mode, className = "h-5 w-5" }: TransportIconProps) => {
  switch (mode) {
    case 'FLIGHT':
      return <Plane className={className} />;
    case 'BUS':
      return <Bus className={className} />;
    case 'TRAIN':
      return <Train className={className} />;
    case 'CAB':
      return <Car className={className} />;
    case 'BIKE_TAXI':
      return <Bike className={className} />;
    case 'SCOOTER':
      return <Zap className={className} />;
    case 'AUTO':
      return <Navigation className={className} />;
    case 'METRO':
      return <Train className={className} />;
    case 'SUBURBAN_RAIL':
      return <Train className={className} />;
    case 'FERRY':
      return <Anchor className={className} />;
    case 'SHARED_CAB':
      return <Users className={className} />;
    case 'WALK':
      return <Footprints className={className} />;
    case 'BICYCLE':
      return <Bicycle className={className} />;
    default:
      return <Car className={className} />;
  }
};

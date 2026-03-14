// Rate Card Database
interface RateCard {
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  nightSurcharge: number; // multiplier
}

const CITY_RATES: Record<string, RateCard> = {
  'Delhi': { baseFare: 50, perKm: 14, perMin: 2, minFare: 100, nightSurcharge: 1.25 },
  'Mumbai': { baseFare: 40, perKm: 16, perMin: 2.5, minFare: 90, nightSurcharge: 1.3 },
  'Bangalore': { baseFare: 60, perKm: 18, perMin: 3, minFare: 120, nightSurcharge: 1.5 },
  'Chennai': { baseFare: 45, perKm: 15, perMin: 2, minFare: 100, nightSurcharge: 1.2 },
  'Kolkata': { baseFare: 35, perKm: 12, perMin: 1.5, minFare: 70, nightSurcharge: 1.25 },
  'Hyderabad': { baseFare: 50, perKm: 16, perMin: 2, minFare: 110, nightSurcharge: 1.3 },
  'Ahmedabad': { baseFare: 40, perKm: 13, perMin: 1.5, minFare: 80, nightSurcharge: 1.2 },
  'Pune': { baseFare: 45, perKm: 15, perMin: 2, minFare: 90, nightSurcharge: 1.3 },
  'Default': { baseFare: 45, perKm: 15, perMin: 2, minFare: 80, nightSurcharge: 1.2 },
};

// Traffic Factors (Simulated Maps API Latency)
const TRAFFIC_MULTIPLIERS = {
  'Peak': 1.8, // Heavy Traffic
  'Normal': 1.2,
  'Off-Peak': 1.0,
};

const BIKE_TAXI_RATES: RateCard = { baseFare: 20, perKm: 8, perMin: 1, minFare: 35, nightSurcharge: 1.2 };
const SCOOTER_RATES: RateCard = { baseFare: 10, perKm: 5, perMin: 0.5, minFare: 20, nightSurcharge: 1.1 };
const AUTO_RATES: RateCard = { baseFare: 30, perKm: 15, perMin: 1.5, minFare: 50, nightSurcharge: 1.25 };
const E_RICKSHAW_RATES: RateCard = { baseFare: 10, perKm: 5, perMin: 1, minFare: 10, nightSurcharge: 1.1 };

export const getRateCard = (city: string, mode: string = 'CAB'): RateCard => {
  if (mode === 'BIKE_TAXI') return BIKE_TAXI_RATES;
  if (mode === 'SCOOTER') return SCOOTER_RATES;
  if (mode === 'AUTO') return AUTO_RATES;
  if (mode === 'E_RICKSHAW') return E_RICKSHAW_RATES;
  
  // Simple heuristic to match city string
  if (city.includes('Delhi') || city.includes('Noida') || city.includes('Gurgaon')) return CITY_RATES['Delhi'];
  if (city.includes('Mumbai') || city.includes('Pune')) return CITY_RATES['Mumbai'];
  if (city.includes('Bangalore') || city.includes('Bengaluru')) return CITY_RATES['Bangalore'];
  return CITY_RATES['Default'];
};

export const calculateSurge = (timeStr: string): number => {
  const hour = parseInt(timeStr.split(':')[0]);
  // Rush hours: 8-11 AM and 5-8 PM
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20)) {
    return 1.4 + (Math.random() * 0.4); // 1.4x to 1.8x
  }
  // Night rates: 10 PM to 6 AM
  if (hour >= 22 || hour <= 6) {
    return 1.2;
  }
  return 1.0;
};

export const calculateCabPrice = (
  distanceKm: number,
  durationMins: number,
  city: string,
  timeStr: string,
  mode: string = 'CAB',
  passengers: number = 1
): { price: number; surge: number; breakdown: string } => {
  if (mode === 'WALK' || mode === 'BICYCLE') {
    return { price: 0, surge: 1, breakdown: 'Free' };
  }
  
  if (mode === 'METRO') {
    // Zone based pricing simulation
    const perPersonPrice = distanceKm <= 5 ? 10 : distanceKm <= 12 ? 20 : distanceKm <= 21 ? 30 : distanceKm <= 32 ? 40 : 50;
    const totalMetroPrice = perPersonPrice * passengers;
    return { price: totalMetroPrice, surge: 1, breakdown: `₹${perPersonPrice} per person` };
  }

  const rates = getRateCard(city, mode);
  const surge = calculateSurge(timeStr);
  
  const distanceCost = distanceKm * rates.perKm;
  const timeCost = durationMins * rates.perMin;
  let rawTotal = (rates.baseFare + distanceCost + timeCost) * surge;
  
  // For Bike Taxi and Scooter, it's usually 1 person per vehicle.
  // If more than 1 passenger, we assume multiple vehicles are needed.
  if (mode === 'BIKE_TAXI' || mode === 'SCOOTER') {
    rawTotal = rawTotal * passengers;
  }
  
  const finalPrice = Math.max(rawTotal, rates.minFare);

  return {
    price: Math.round(finalPrice),
    surge: parseFloat(surge.toFixed(1)),
    breakdown: mode === 'BIKE_TAXI' || mode === 'SCOOTER' 
      ? `Base ₹${rates.baseFare} x ${passengers} riders`
      : `Base ₹${rates.baseFare} + ₹${rates.perKm}/km + Time`
  };
};

export const parseDurationToMins = (durationStr: string): number => {
  // format "2h 30m" or "45m"
  let minutes = 0;
  const hMatch = durationStr.match(/(\d+)h/);
  const mMatch = durationStr.match(/(\d+)m/);
  
  if (hMatch) minutes += parseInt(hMatch[1]) * 60;
  if (mMatch) minutes += parseInt(mMatch[1]);
  
  return minutes || 60; // Default fallback
};

export const parseDistanceToKm = (distanceStr: string): number => {
  // format "14 km"
  const match = distanceStr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 10;
};

export const predictPriceTrend = (mode: string): 'UP' | 'DOWN' | 'STABLE' => {
  const rand = Math.random();
  if (mode === 'FLIGHT' || mode === 'TRAIN') return rand > 0.3 ? 'UP' : 'STABLE';
  if (mode === 'CAB') return rand > 0.8 ? 'UP' : (rand < 0.2 ? 'DOWN' : 'STABLE');
  return 'STABLE';
};

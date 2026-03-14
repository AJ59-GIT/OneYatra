
import { getCurrentUser } from "./authService";

export interface LocationSuggestion {
  id: string;
  city: string; // Main display text (City Name OR Address Label)
  state: string; // Subtitle (State/Country OR Full Address Line)
  country: string;
  code?: string; // Airport code
  type: 'CITY' | 'AIRPORT' | 'SAVED' | 'ADDRESS';
  fullAddress?: string; // Explicit full address for booking
  coordinates?: { lat: number; lng: number };
}

export interface RouteData {
  distance: number; // km
  duration: number; // minutes
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // Client side uses relative proxy
  return 'https://photon.komoot.io'; // Server side calls directly
};

const getPhotonPath = (params: string, isReverse = false) => {
  const base = getBaseUrl();
  if (typeof window !== 'undefined') {
    return `/api/locations?${params}`;
  }
  return `${base}/${isReverse ? 'reverse' : 'api'}/?${params}`;
};

export const getRoadDistance = async (origin: string, destination: string): Promise<RouteData> => {
  // We can use OSRM for road distance (free)
  try {
    // First find coordinates for origin and destination if they are names
    const originRes = await fetch(getPhotonPath(`q=${encodeURIComponent(origin)}&limit=1`));
    const destRes = await fetch(getPhotonPath(`q=${encodeURIComponent(destination)}&limit=1`));
    const originData = await originRes.json();
    const destData = await destRes.json();

    if (originData.features.length > 0 && destData.features.length > 0) {
      const [lon1, lat1] = originData.features[0].geometry.coordinates;
      const [lon2, lat2] = destData.features[0].geometry.coordinates;

      const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
      const osrmData = await osrmRes.json();
      if (osrmData.code === 'Ok') {
        return {
          distance: Math.round(osrmData.routes[0].distance / 1000), // meters to km
          duration: Math.round(osrmData.routes[0].duration / 60) // seconds to minutes
        };
      }
    }
  } catch (error) {
    console.error("Error fetching road distance:", error);
  }

  return { distance: 50, duration: 60 }; // Default fallback
};

export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();
  
  // 1. Fetch Saved Addresses from User Profile
  const user = getCurrentUser();
  const savedSuggestions: LocationSuggestion[] = [];
  
  if (user && user.addresses) {
    user.addresses.forEach(addr => {
      const label = addr.label || (addr.type === 'OTHER' ? 'Custom Location' : addr.type);
      const fullAddr = `${addr.line1}, ${addr.city}`;
      
      if (label.toLowerCase().includes(q) || 
          addr.city.toLowerCase().includes(q) || 
          addr.line1.toLowerCase().includes(q)) {
            
        savedSuggestions.push({
          id: addr.id,
          city: label,
          state: fullAddr,
          country: 'India',
          type: 'SAVED',
          fullAddress: `${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.zip}`
        });
      }
    });
  }

  // 2. Fetch from Proxy API (Photon)
  try {
    const response = await fetch(getPhotonPath(`q=${encodeURIComponent(query)}&limit=10`));
    const data = await response.json();
    
    const apiMatches: LocationSuggestion[] = data.features.map((f: any) => {
      const p = f.properties;
      const name = p.name || p.city || p.street || 'Unknown Location';
      const city = p.city || p.state || '';
      const state = p.state || p.country || '';
      const country = p.country || '';
      
      return {
        id: `api-${p.osm_id || Math.random()}`,
        city: name,
        state: `${city}${city && state ? ', ' : ''}${state}`,
        country: country,
        type: p.osm_value === 'airport' ? 'AIRPORT' : (p.type === 'house' ? 'ADDRESS' : 'CITY'),
        coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
        fullAddress: p.name ? `${p.name}, ${city}, ${state}, ${country}` : `${city}, ${state}, ${country}`
      };
    });

    // 3. Combine (Saved first)
    return [...savedSuggestions, ...apiMatches];
  } catch (error) {
    console.error("Photon API error:", error);
    return savedSuggestions;
  }
};

export const getCityFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(getPhotonPath(`lat=${lat}&lon=${lng}`, true));
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const p = data.features[0].properties;
      return p.city || p.name || p.state || null;
    }
    return null;
  } catch (error) {
    console.error("Error reverse geocoding with Photon:", error);
    return null;
  }
};

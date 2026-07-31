
import { GoogleGenAI, Type } from "@google/genai";
import { getCurrentUser } from "./authService";

export interface LocationSuggestion {
  id: string;
  city: string; // Main display text (City Name OR Address Label)
  state: string; // Subtitle (State/Country OR Full Address Line)
  country: string;
  code?: string; // Airport code
  type: 'CITY' | 'AIRPORT' | 'SAVED' | 'ADDRESS';
  fullAddress?: string; // Explicit full address for booking
  lat: number;
  lng: number;
}

const FALLBACK_CITIES_AND_AIRPORTS: LocationSuggestion[] = [
  // Airports
  { id: 'DEL', city: 'Indira Gandhi International Airport', state: 'Delhi', country: 'India', type: 'AIRPORT', lat: 28.5562, lng: 77.1000, code: 'DEL' },
  { id: 'BOM', city: 'Chhatrapati Shivaji Maharaj International Airport', state: 'Mumbai, Maharashtra', country: 'India', type: 'AIRPORT', lat: 19.0896, lng: 72.8656, code: 'BOM' },
  { id: 'BLR', city: 'Kempegowda International Airport', state: 'Bengaluru, Karnataka', country: 'India', type: 'AIRPORT', lat: 13.1986, lng: 77.7066, code: 'BLR' },
  { id: 'MAA', city: 'Chennai International Airport', state: 'Chennai, Tamil Nadu', country: 'India', type: 'AIRPORT', lat: 12.9941, lng: 80.1709, code: 'MAA' },
  { id: 'HYD', city: 'Rajiv Gandhi International Airport', state: 'Hyderabad, Telangana', country: 'India', type: 'AIRPORT', lat: 17.2403, lng: 78.4294, code: 'HYD' },
  { id: 'CCU', city: 'Netaji Subhash Chandra Bose International Airport', state: 'Kolkata, West Bengal', country: 'India', type: 'AIRPORT', lat: 22.6547, lng: 88.4467, code: 'CCU' },
  { id: 'GOI', city: 'Goa International Airport (Dabolim)', state: 'Goa', country: 'India', type: 'AIRPORT', lat: 15.3808, lng: 73.8314, code: 'GOI' },
  { id: 'PNQ', city: 'Pune Airport', state: 'Pune, Maharashtra', country: 'India', type: 'AIRPORT', lat: 18.5822, lng: 73.9197, code: 'PNQ' },
  { id: 'AMD', city: 'Sardar Vallabhbhai Patel International Airport', state: 'Ahmedabad, Gujarat', country: 'India', type: 'AIRPORT', lat: 23.0772, lng: 72.6347, code: 'AMD' },
  { id: 'COK', city: 'Cochin International Airport', state: 'Kochi, Kerala', country: 'India', type: 'AIRPORT', lat: 10.1520, lng: 76.4019, code: 'COK' },

  // Major Cities
  { id: 'CITY-DEL', city: 'New Delhi', state: 'Delhi NCR', country: 'India', type: 'CITY', lat: 28.6139, lng: 77.2090 },
  { id: 'CITY-BOM', city: 'Mumbai', state: 'Maharashtra', country: 'India', type: 'CITY', lat: 19.0760, lng: 72.8777 },
  { id: 'CITY-BLR', city: 'Bengaluru', state: 'Karnataka', country: 'India', type: 'CITY', lat: 12.9716, lng: 77.5946 },
  { id: 'CITY-HYD', city: 'Hyderabad', state: 'Telangana', country: 'India', type: 'CITY', lat: 17.3850, lng: 78.4867 },
  { id: 'CITY-MAA', city: 'Chennai', state: 'Tamil Nadu', country: 'India', type: 'CITY', lat: 13.0827, lng: 80.2707 },
  { id: 'CITY-CCU', city: 'Kolkata', state: 'West Bengal', country: 'India', type: 'CITY', lat: 22.5726, lng: 88.3639 },
  { id: 'CITY-PNQ', city: 'Pune', state: 'Maharashtra', country: 'India', type: 'CITY', lat: 18.5204, lng: 73.8567 },
  { id: 'CITY-AMD', city: 'Ahmedabad', state: 'Gujarat', country: 'India', type: 'CITY', lat: 23.0225, lng: 72.5714 },
  { id: 'CITY-JAI', city: 'Jaipur', state: 'Rajasthan', country: 'India', type: 'CITY', lat: 26.9124, lng: 75.7873 },
  { id: 'CITY-LKO', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', type: 'CITY', lat: 26.8467, lng: 80.9462 },
  { id: 'CITY-VNS', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', type: 'CITY', lat: 25.3176, lng: 82.9739 },
  { id: 'CITY-AGR', city: 'Agra', state: 'Uttar Pradesh', country: 'India', type: 'CITY', lat: 27.1767, lng: 78.0081 },
  { id: 'CITY-GOA', city: 'Panaji', state: 'Goa', country: 'India', type: 'CITY', lat: 15.4909, lng: 73.8278 },
  { id: 'CITY-COK', city: 'Kochi', state: 'Kerala', country: 'India', type: 'CITY', lat: 9.9312, lng: 76.2673 },
  { id: 'CITY-IND', city: 'Indore', state: 'Madhya Pradesh', country: 'India', type: 'CITY', lat: 22.7196, lng: 75.8577 },
  { id: 'CITY-SUR', city: 'Surat', state: 'Gujarat', country: 'India', type: 'CITY', lat: 21.1702, lng: 72.8311 },
  { id: 'CITY-IXC', city: 'Chandigarh', state: 'Punjab & Haryana', country: 'India', type: 'CITY', lat: 30.7333, lng: 76.7794 },
  { id: 'CITY-SML', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', type: 'CITY', lat: 31.1048, lng: 77.1734 }
];

export interface RouteData {
  distance: number; // km
  duration: number; // minutes
  geometry?: string; // Polyline string
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // Client side uses relative proxy
  return 'https://photon.komoot.io'; // Server side calls directly
};

const getPhotonPath = (params: string, isReverse = false) => {
  const base = getBaseUrl();
  if (typeof window !== 'undefined') {
    return `/api/locations?${params}${isReverse ? '&reverse=true' : ''}`;
  }
  return `${base}/${isReverse ? 'reverse' : 'api'}/?${params}`;
};

export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

export const getRoadDistance = async (
  origin: string | { lat: number, lng: number }, 
  destination: string | { lat: number, lng: number }
): Promise<RouteData> => {
  let originCoords: { lat: number, lng: number };
  let destCoords: { lat: number, lng: number };

  // Resolve origin
  if (typeof origin === 'string') {
    const suggestions = await searchLocations(origin);
    if (suggestions.length > 0) {
      originCoords = { lat: suggestions[0].lat, lng: suggestions[0].lng };
    } else {
      // Default to Delhi if not found
      originCoords = { lat: 28.6139, lng: 77.2090 };
    }
  } else {
    originCoords = origin;
  }

  // Resolve destination
  if (typeof destination === 'string') {
    const suggestions = await searchLocations(destination);
    if (suggestions.length > 0) {
      destCoords = { lat: suggestions[0].lat, lng: suggestions[0].lng };
    } else {
      // Default to Mumbai if not found
      destCoords = { lat: 19.0760, lng: 72.8777 };
    }
  } else {
    destCoords = destination;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout to 5s

  try {
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const osrmData = await osrmRes.json();
    
    if (osrmData.code === 'Ok') {
      return {
        distance: Math.round(osrmData.routes[0].distance / 1000),
        duration: Math.round(osrmData.routes[0].duration / 60),
        geometry: osrmData.routes[0].geometry
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("OSRM API timeout (5s), falling back to Haversine.");
    } else {
      console.error("OSRM API error, falling back to Haversine:", error.message || error);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to Haversine
  const distance = calculateHaversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  return {
    distance,
    duration: Math.round(distance * 1.5), // Estimated duration for road travel
  };
};

export const getGeminiSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  // On client, use the proxy API to avoid exposing keys and CORS issues
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/locations?source=ai&query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch location suggestions from proxy", e);
      return [];
    }
  }

  // Safe access for server environment
  const rawApiKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : null;
  const apiKey = rawApiKey?.trim();

  const isValidFormat = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;

  if (!isValidFormat || apiKey === 'TODO_KEYHERE' || apiKey.includes('YOUR_') || apiKey === 'undefined' || apiKey === 'null') {
    console.warn("No valid GEMINI_API_KEY found or invalid format for location suggestions.", {
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      startsWithAIza: apiKey?.startsWith('AIza')
    });
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 real Indian cities or airports matching the query: "${query}". Return a strictly formatted JSON array of objects with: id, city, state, country, type (enum: 'CITY', 'AIRPORT'), lat, lng, and code (for airports).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              city: { type: Type.STRING },
              state: { type: Type.STRING },
              country: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['CITY', 'AIRPORT'] },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              code: { type: Type.STRING }
            },
            required: ['id', 'city', 'state', 'country', 'type', 'lat', 'lng']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini API error:", error);
    return [];
  }
};

const searchCache = new Map<string, LocationSuggestion[]>();

export const searchLocations = async (query: string, biasCoords?: { lat: number, lng: number }): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();
  const cacheKey = `${q}_${biasCoords?.lat.toFixed(2)}_${biasCoords?.lng.toFixed(2)}`;

  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

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
          lat: addr.coordinates?.lat || 0,
          lng: addr.coordinates?.lng || 0,
          fullAddress: `${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.zip}`
        });
      }
    });
  }

  // 2. Fetch from Gemini AI and Photon API in parallel
  const [geminiMatches, apiMatches] = await Promise.all([
    // Gemini with a strict timeout
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for AI
      try {
        return await getGeminiSuggestions(query);
      } catch (e) {
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    })(),
    // Photon API (Fast)
    (async () => {
      let retryCount = 0;
      const maxRetries = 1;

      const attemptFetch = async (): Promise<LocationSuggestion[]> => {
        try {
          const lat = biasCoords?.lat ?? 20.5937;
          const lon = biasCoords?.lng ?? 78.9629;
          
          const params = new URLSearchParams({
            q: query,
            limit: '15',
            lat: lat.toString(),
            lon: lon.toString(),
            lang: 'en'
          });

          const path = getPhotonPath(params.toString());
          const response = await fetch(path, {
            credentials: 'include'
          });

          if (!response.ok) {
            const text = await response.text();
            console.warn(`[Location API] Status: ${response.status}, Body: ${text.substring(0, 100)}`);
            return [];
          }

          const data = await response.json();
          if (!data || !data.features) return [];

          return data.features
            .filter((f: any) => f.properties.country === 'India' || !f.properties.country)
            .map((f: any) => {
              const p = f.properties;
              const name = p.name || p.city || p.street || p.district || 'Unknown Location';
              const city = p.city || p.district || p.county || p.town || p.village || '';
              const state = p.state || '';
              const country = p.country || 'India';
              
              return {
                id: `api-${p.osm_id || Math.random()}`,
                city: name,
                state: [city, state].filter(Boolean).join(', '),
                country: country,
                type: p.osm_value === 'airport' ? 'AIRPORT' : (p.type === 'house' ? 'ADDRESS' : 'CITY'),
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                fullAddress: [name, city, state, country].filter(Boolean).join(', ')
              } as LocationSuggestion;
            });
        } catch (error: any) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`[Location API] Fetch failed, retrying (${retryCount}/${maxRetries})...`, error.message);
            return await attemptFetch();
          }
          console.error("Photon API error:", error.message || error);
          return [];
        }
      };

      return await attemptFetch();
    })()
  ]);

  // 3. Fetch from Fallback Dataset
  const fallbackMatches = FALLBACK_CITIES_AND_AIRPORTS.filter(a => 
    a.city.toLowerCase().includes(q) || 
    a.code?.toLowerCase().includes(q) || 
    a.state.toLowerCase().includes(q)
  );

  // 4. Combine all sources
  const allSuggestions = [...savedSuggestions, ...geminiMatches, ...fallbackMatches, ...apiMatches];
  
  // De-duplicate by ID or coordinates
  const seen = new Set();
  const results = allSuggestions.filter(s => {
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  searchCache.set(cacheKey, results);
  return results;
};

export const getCityFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    // Use Nominatim via our server proxy (Zero Cost)
    const response = await fetch(getPhotonPath(`lat=${lat}&lon=${lng}`, true), {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const p = data.features[0].properties;
      return p.city || p.town || p.village || p.name || p.state || null;
    }
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

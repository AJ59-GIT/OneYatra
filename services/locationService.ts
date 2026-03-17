
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

const FALLBACK_AIRPORTS: LocationSuggestion[] = [
  { id: 'DEL', city: 'Indira Gandhi International Airport', state: 'Delhi', country: 'India', type: 'AIRPORT', lat: 28.5562, lng: 77.1000, code: 'DEL' },
  { id: 'BOM', city: 'Chhatrapati Shivaji Maharaj International Airport', state: 'Mumbai, Maharashtra', country: 'India', type: 'AIRPORT', lat: 19.0896, lng: 72.8656, code: 'BOM' },
  { id: 'BLR', city: 'Kempegowda International Airport', state: 'Bengaluru, Karnataka', country: 'India', type: 'AIRPORT', lat: 13.1986, lng: 77.7066, code: 'BLR' },
  { id: 'MAA', city: 'Chennai International Airport', state: 'Chennai, Tamil Nadu', country: 'India', type: 'AIRPORT', lat: 12.9941, lng: 80.1709, code: 'MAA' },
  { id: 'HYD', city: 'Rajiv Gandhi International Airport', state: 'Hyderabad, Telangana', country: 'India', type: 'AIRPORT', lat: 17.2403, lng: 78.4294, code: 'HYD' },
  { id: 'CCU', city: 'Netaji Subhash Chandra Bose International Airport', state: 'Kolkata, West Bengal', country: 'India', type: 'AIRPORT', lat: 22.6547, lng: 88.4467, code: 'CCU' },
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
  const timeoutId = setTimeout(() => controller.abort(), 2000);

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
  } catch (error) {
    console.error("OSRM API error or timeout, falling back to Haversine:", error);
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

const getGeminiSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const apiKey = rawApiKey?.trim();

  if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey.includes('YOUR_')) {
    console.warn("No valid GEMINI_API_KEY found for location suggestions.");
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

export const searchLocations = async (query: string, biasCoords?: { lat: number, lng: number }): Promise<LocationSuggestion[]> => {
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
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for AI
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
      try {
        const lat = biasCoords?.lat ?? 20.5937;
        const lon = biasCoords?.lng ?? 78.9629;
        
        const params = new URLSearchParams({
          q: query,
          limit: '10',
          lat: lat.toString(),
          lon: lon.toString(),
          lang: 'en'
        });

        const response = await fetch(getPhotonPath(params.toString()));
        const data = await response.json();
        
        if (!data || !data.features) return [];

        return data.features.map((f: any) => {
          const p = f.properties;
          const name = p.name || p.city || p.street || p.district || 'Unknown Location';
          const city = p.city || p.district || p.county || p.town || p.village || '';
          const state = p.state || '';
          const country = p.country || '';
          
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
      } catch (error) {
        console.error("Photon API error:", error);
        return [];
      }
    })()
  ]);

  // 3. Fetch from Fallback Dataset
  const fallbackMatches = FALLBACK_AIRPORTS.filter(a => 
    a.city.toLowerCase().includes(q) || 
    a.code?.toLowerCase().includes(q) || 
    a.state.toLowerCase().includes(q)
  );

  // 4. Combine all sources
  const allSuggestions = [...savedSuggestions, ...geminiMatches, ...fallbackMatches, ...apiMatches];
  
  // De-duplicate by ID or coordinates
  const seen = new Set();
  return allSuggestions.filter(s => {
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getCityFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    // Use Nominatim via our server proxy (Zero Cost)
    const response = await fetch(getPhotonPath(`lat=${lat}&lon=${lng}`, true));
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

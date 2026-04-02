
import { GoogleGenAI, Type } from "@google/genai";
import { RouteResponse, SearchParams, TravelOption, ChatMessage, TransportMode } from "../types.ts";
import { calculateCabPrice, parseDistanceToKm, parseDurationToMins, predictPriceTrend } from "./pricingService.ts";
import { generateDeepLink } from "./deepLinkService.ts";
import { getRoadDistance, RouteData } from "./locationService.ts";

// Helper for exponential backoff retry
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota'))) {
      console.warn(`Gemini API rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const fetchTravelOptionsInternal = async (
  params: SearchParams
): Promise<RouteResponse> => {
  let finalRealDistance: number | undefined = params.roadDistance;
  let finalRealDuration: number | undefined = params.roadDuration;

  try {
    // 0. Validate Params
    if (!params || !params.origin || !params.destination) {
      console.error("Invalid search params received:", params);
      throw new Error("Origin and destination are required.");
    }

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const apiKey = rawApiKey?.trim();

    // 1. Get Road Distance & Duration (Use provided values or fetch if missing)
    if (finalRealDistance === undefined || finalRealDuration === undefined) {
      try {
        console.log(`Fetching road data for ${params.origin} to ${params.destination} (not provided in params)`);
        const routeData = await getRoadDistance(params.origin, params.destination);
        finalRealDistance = routeData.distance;
        finalRealDuration = routeData.duration;
      } catch (routeError) {
        console.error("Failed to fetch road distance, using fallback:", routeError);
        finalRealDistance = 10; // Fallback
        finalRealDuration = 30; // Fallback
      }
    }
    
    console.log(`Real Road Data for ${params.origin} to ${params.destination}: ${finalRealDistance} km, ${finalRealDuration} mins`);

  const isValidFormat = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;

  if (!isValidFormat || apiKey === 'TODO_KEYHERE' || apiKey.includes('YOUR_') || apiKey === 'undefined' || apiKey === 'null') {
    console.warn("No valid GEMINI_API_KEY found or invalid format. Returning mock data.", { 
      hasKey: !!apiKey, 
      keyLength: apiKey?.length,
      startsWithAIza: apiKey?.startsWith('AIza'),
      isPlaceholder: apiKey === 'TODO_KEYHERE'
    });
    return mockTravelData(params, finalRealDistance || 10, finalRealDuration || 30);
  }

  const ai = new GoogleGenAI({ apiKey });

  let promptContext = "";
  if (params.tripType === 'MULTI_CITY' && params.segments.length > 0) {
    promptContext = `
      Multi-City Trip Request:
      ${(params.segments || []).map((seg, i) => `Segment ${i+1}: From "${seg.origin}" to "${seg.destination}" on ${seg.date} after ${seg.time}`).join('\n')}
      
      Provide a unified itinerary. 'mode' can be 'MIXED' if different modes are used for segments.
      Include a 'legs' array in the response options detailing each segment.
    `;
  } else if (params.tripType === 'ROUND_TRIP') {
    promptContext = `
      Round Trip Request:
      Outbound: From "${params.origin}" to "${params.destination}" on ${params.date} after ${params.time}.
      Return: From "${params.destination}" to "${params.origin}" on ${params.returnDate} after ${params.returnTime || '09:00'}.
      
      Provide two lists of options: 'options' for outbound and 'returnOptions' for the return journey.
    `;
  } else {
    promptContext = `
      Single Trip Request: From "${params.origin}" to "${params.destination}" on ${params.date} after ${params.time}.
    `;
  }

  const prompt = `
    Act as a Travel Search Engine. Generate realistic travel options for the following request:
    ${promptContext}
    
    Actual Road Distance: ${finalRealDistance} km.
    
    Passengers: ${params.passengers} (Prices must be TOTAL for all passengers)
    
    Filtering Rules based on distance (${finalRealDistance} km):
    - If distance <= 2 km: Prioritize WALK, BICYCLE (MyByk, Yulu), and E-RICKSHAW.
    - If distance <= 5 km: Include AUTO (Uber Auto, Ola Auto), METRO (DMRC, MMRDA, BMRCL), and BIKE_TAXI (Rapido, Uber Moto).
    - If distance <= 15 km: Include METRO, CAB (Uber, Ola, BluSmart), and AUTO.
    - If distance <= 50 km: Include METRO, CAB, SUBURBAN_RAIL (Mumbai Local, Chennai Suburban), and SHARED_CAB.
    - If distance > 50 km: Include TRAIN (IRCTC), FLIGHT (IndiGo, Air India), BUS (RedBus, MSRTC, UPSRTC), SUBURBAN_RAIL (for inter-city/state passenger trains), and FERRY (Kochi Water Metro, Mumbai Ferry).
    - HARD RULE: Strictly EXCLUDE FLIGHT if distance is under 80 km.
    
    MaaS Providers to use (Select realistically):
    - Cabs/Ride-Hailing: Uber, Ola, Rapido, BluSmart, InDrive, Savaari.
    - Public Transport: IRCTC (Rail), MSRTC, DTC, BMTC, BEST, KSRTC, UPSRTC.
    - Metro: DMRC (Delhi), MMRDA/MMOPL (Mumbai), BMRCL (Bangalore), CMRL (Chennai), KMRL (Kochi), HMRL (Hyderabad).
    - Micro-mobility: Yulu, Bounce, Vogo, MyByk.
    - Bus Aggregators: RedBus, AbhiBus, ZingBus, IntrCity SmartBus.
    - Car Rentals: Zoomcar, Revv, Myles, Avis India.
    - Water: Kochi Water Metro, Mumbai-Mandwa Ferry, Kolkata Ferry.

    Suburban Rail Context:
    - If origin/destination are in Mumbai, Kolkata, Chennai, or Hyderabad, prioritize 'SUBURBAN_RAIL' (Local Trains).
    - For Mumbai Local: Mention "Ticket valid for 1 hour for single journey" in features.
    
    Mood Assignment:
    - PRODUCTIVE: Flights, AC Trains, Cabs with WiFi (BluSmart).
    - RELAXED: Sleeper Buses (ZingBus), Rajdhani Trains.
    - ADVENTUROUS: Bike Taxis (Rapido), Scooters (Vogo), Ferries, Local Trains (General Class).
    - ECO_FRIENDLY: Metro, E-Rickshaws, Walking, Cycling (Yulu), Local Trains.
    
    Modes to include: Provide a diverse mix based on the rules above.
    
    For each option:
    1. 'distance': Estimate precise road/track distance.
    2. 'ecoScore': (0-100).
    3. 'carbonEmission': Estimate CO2 in kg.
    4. 'price': Total price in INR.
    5. 'tag': 'Cheapest', 'Fastest', 'Best Value', 'Eco-Choice'.
    6. 'mood': Assign one of the moods above.
    7. 'trustBadges': Add relevant badges (e.g., 'Verified Provider', 'Safe for Women', 'Eco-Friendly').
    
    Provide a short 'aiInsight' comparing the options and mentioning why certain modes are prioritized for this distance.
    Limit the response to a maximum of 4 high-quality options per journey.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class travel expert for the Indian market. You provide precise, realistic travel options across Cabs, Bike Taxis, Scooters, Buses, Trains, and Flights. You MUST follow distance-based filtering rules strictly. You understand Indian geography, typical travel times, and pricing nuances. You are aware of all major MaaS providers in India like Uber, Ola, BluSmart, Rapido, IRCTC, RedBus, and various Metro/Local train networks. Keep the JSON response concise.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            origin: { type: Type.STRING },
            destination: { type: Type.STRING },
            date: { type: Type.STRING },
            returnDate: { type: Type.STRING, nullable: true },
            aiInsight: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ['CAB', 'BUS', 'TRAIN', 'FLIGHT', 'MIXED', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'FERRY', 'SHARED_CAB', 'WALK', 'BICYCLE', 'SUBURBAN_RAIL'] },
                  provider: { type: Type.STRING },
                  departureTime: { type: Type.STRING },
                  arrivalTime: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  carbonEmission: { type: Type.STRING },
                  ecoScore: { type: Type.NUMBER },
                  deepLink: { type: Type.STRING },
                  features: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tag: { type: Type.STRING, nullable: true },
                  mood: { type: Type.STRING, enum: ['PRODUCTIVE', 'RELAXED', 'ADVENTUROUS', 'ECO_FRIENDLY'] },
                  trustBadges: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        description: { type: Type.STRING },
                        color: { type: Type.STRING }
                      }
                    }
                  },
                  legs: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                         id: { type: Type.STRING },
                         mode: { type: Type.STRING },
                         provider: { type: Type.STRING },
                         departureTime: { type: Type.STRING },
                         arrivalTime: { type: Type.STRING },
                         duration: { type: Type.STRING },
                         price: { type: Type.NUMBER },
                         distance: { type: Type.STRING },
                         currency: { type: Type.STRING },
                         ecoScore: { type: Type.NUMBER },
                         features: { type: Type.ARRAY, items: { type: Type.STRING } }
                       }
                    }
                  }
                },
                required: ['id', 'mode', 'provider', 'price', 'duration', 'ecoScore'],
              },
            },
            returnOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ['CAB', 'BUS', 'TRAIN', 'FLIGHT', 'MIXED', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'FERRY', 'SHARED_CAB', 'WALK', 'BICYCLE', 'SUBURBAN_RAIL'] },
                  provider: { type: Type.STRING },
                  departureTime: { type: Type.STRING },
                  arrivalTime: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  carbonEmission: { type: Type.STRING },
                  ecoScore: { type: Type.NUMBER },
                  deepLink: { type: Type.STRING },
                  features: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tag: { type: Type.STRING, nullable: true },
                  mood: { type: Type.STRING, enum: ['PRODUCTIVE', 'RELAXED', 'ADVENTUROUS', 'ECO_FRIENDLY'] },
                  trustBadges: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        description: { type: Type.STRING },
                        color: { type: Type.STRING }
                      }
                    }
                  },
                  legs: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                         id: { type: Type.STRING },
                         mode: { type: Type.STRING },
                         provider: { type: Type.STRING },
                         departureTime: { type: Type.STRING },
                         arrivalTime: { type: Type.STRING },
                         duration: { type: Type.STRING },
                         price: { type: Type.NUMBER },
                         distance: { type: Type.STRING },
                         currency: { type: Type.STRING },
                         ecoScore: { type: Type.NUMBER },
                         features: { type: Type.ARRAY, items: { type: Type.STRING } }
                       }
                    }
                  }
                },
                required: ['id', 'mode', 'provider', 'price', 'duration', 'ecoScore'],
              }
            }
          },
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    let result: RouteResponse;
    try {
      result = JSON.parse(text) as RouteResponse;
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", parseError);
      return mockTravelData(params, finalRealDistance || 10, finalRealDuration || 30);
    }

    if (result.options && Array.isArray(result.options)) {
      result.options = result.options.map(opt => processOption(opt, params.origin, params.time, params.destination, finalRealDistance || 10, finalRealDuration || 30, params.passengers));
    } else {
      result.options = [];
    }

    if (result.returnOptions && Array.isArray(result.returnOptions)) {
        result.returnOptions = result.returnOptions.map(opt => processOption(opt, params.destination, params.returnTime || '09:00', params.origin, finalRealDistance || 10, finalRealDuration || 30, params.passengers));
    }

    return result;

  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.error("Gemini API Quota Exhausted. Falling back to mock data.");
    } else {
      console.error("Gemini API Error or Crash:", error);
    }
    // Final fallback - ensure we return SOMETHING if possible
    try {
      // Use fallback values if real ones are missing
      const dist = (typeof finalRealDistance === 'number') ? finalRealDistance : 10;
      const dur = (typeof finalRealDuration === 'number') ? finalRealDuration : 30;
      return mockTravelData(params, dist, dur);
    } catch (mockError) {
      console.error("Even mock data failed:", mockError);
      throw error; // Re-throw original if even mock fails
    }
  }
};

export const chatWithAIInternal = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const apiKey = rawApiKey?.trim();
  
  const isValidFormat = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;

  if (!isValidFormat || apiKey === 'TODO_KEYHERE' || apiKey.includes('YOUR_') || apiKey === 'undefined' || apiKey === 'null') {
    return "I'm in offline mode right now (API key not configured). How can I help you with your travel plans?";
  }

  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are YatraBot, the AI assistant for OneYatra, India's MaaS Super App. You help users find travel options, explain refund policies, and provide travel tips. Keep responses concise and helpful. If asked for routes, suggest they use the main search bar for precise real-time data, but you can give general advice.",
    }
  });

  try {
    const response = await withRetry(() => chat.sendMessage({ message }));
    return response.text || "I'm sorry, I couldn't process that. Could you try again?";
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.error("Gemini API Quota Exhausted in Chat.");
      return "I'm currently receiving too many requests. Please try again in a minute, or use the search bar for travel options!";
    }
    console.error("Chat AI Error:", error);
    return "I'm having a bit of trouble connecting. Please try again in a moment.";
  }
};

const processOption = (opt: TravelOption, origin: string, time: string, destination: string, realDistance: number, realDuration: number, passengers: number = 1): TravelOption => {
  let updatedOpt = { ...opt };
  
  if (Array.isArray(updatedOpt.legs) && updatedOpt.legs.length > 0) {
      updatedOpt.legs = updatedOpt.legs.map((leg) => {
         return processOption(leg, origin, time, destination, realDistance, realDuration, passengers);
      });
  }

  // Distance Validation
  if (updatedOpt.distance) {
    const aiKm = parseDistanceToKm(updatedOpt.distance);
    const deviation = Math.abs(aiKm - realDistance) / (realDistance || 1);
    
    if (deviation > 0.3 || aiKm === 0) {
      updatedOpt.distance = `${realDistance} km`;
    }
  } else {
    updatedOpt.distance = `${realDistance} km`;
  }

  // Duration Validation & Correction
  const aiMins = parseDurationToMins(updatedOpt.duration);
  const isFlexible = updatedOpt.duration.toLowerCase().includes('flexible');
  
  // If duration is unrealistic or "Flexible", use real road duration for road modes
  if (['CAB', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'WALK', 'BICYCLE', 'BUS'].includes(updatedOpt.mode)) {
    const speedMultiplier = 
      updatedOpt.mode === 'BIKE_TAXI' ? 0.8 : 
      updatedOpt.mode === 'SCOOTER' ? 0.9 : 
      updatedOpt.mode === 'WALK' ? 12 : 
      updatedOpt.mode === 'BICYCLE' ? 4 : 
      updatedOpt.mode === 'BUS' ? 1.5 : 1.0;
    
    const estimatedMins = Math.round(realDuration * speedMultiplier);
    
    // If AI duration is way off (>50% deviation) or it's "Flexible", overwrite it
    const deviation = Math.abs(aiMins - estimatedMins) / (estimatedMins || 1);
    if (deviation > 0.5 || isFlexible || aiMins === 60) { // 60 is the fallback default
       const h = Math.floor(estimatedMins / 60);
       const m = estimatedMins % 60;
       updatedOpt.duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }

  // Price Recalculation for Cabs/Bike Taxis/Scooters/Auto/Metro/Suburban
  if (['CAB', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'WALK', 'BICYCLE', 'SUBURBAN_RAIL'].includes(updatedOpt.mode)) {
    const km = parseDistanceToKm(updatedOpt.distance!);
    const mins = parseDurationToMins(updatedOpt.duration);
    const estimate = calculateCabPrice(km, mins, origin, time, updatedOpt.mode, passengers);
    
    updatedOpt = {
      ...updatedOpt,
      price: estimate.price,
      surgeMultiplier: estimate.surge,
      features: [...(opt.features || []), estimate.surge > 1 ? `Surge ${estimate.surge}x` : 'Standard Rate']
    };
  }

  // Provider override for Suburban Rail
  if (updatedOpt.mode === 'SUBURBAN_RAIL') {
    updatedOpt.provider = 'UTS (Indian Railways)';
    if (!updatedOpt.features.includes('Unreserved')) updatedOpt.features.push('Unreserved');
    if (!updatedOpt.features.includes('UTS Booking')) updatedOpt.features.push('UTS Booking');
    
    // Add Mumbai Local specific rule
    if (origin.toLowerCase().includes('mumbai') || destination.toLowerCase().includes('mumbai')) {
      if (!updatedOpt.features.includes('Ticket valid for 1h')) {
        updatedOpt.features.push('Ticket valid for 1h');
      }
    }
  }

  // Add last-mile suggestions for long-distance modes
  if (['TRAIN', 'FLIGHT', 'BUS'].includes(updatedOpt.mode) && !updatedOpt.legs) {
    const lastMileProviders = ['Uber', 'Ola', 'BluSmart', 'Rapido'];
    const randomProvider = lastMileProviders[Math.floor(Math.random() * lastMileProviders.length)];
    if (!updatedOpt.features.some(f => f.includes('Last-mile'))) {
      updatedOpt.features.push(`Last-mile: ${randomProvider} available`);
    }
  }

  const linkData = generateDeepLink(updatedOpt.provider, updatedOpt.mode, origin, destination);
  updatedOpt.deepLink = linkData.url;
  updatedOpt.deepLinkFallback = linkData.fallbackUrl;
  updatedOpt.androidIntent = linkData.androidIntent;

  updatedOpt.priceTrend = predictPriceTrend(updatedOpt.mode);

  if (['CAB', 'BIKE_TAXI', 'AUTO'].includes(updatedOpt.mode)) {
    const mins = Math.floor(Math.random() * 10) + 2;
    const label = updatedOpt.mode === 'CAB' ? 'Driver' : updatedOpt.mode === 'AUTO' ? 'Auto' : 'Rider';
    updatedOpt.realTimeStatus = `${label} arriving in ${mins} mins`;
  } else if (updatedOpt.mode === 'BUS' || updatedOpt.mode === 'METRO' || updatedOpt.mode === 'SUBURBAN_RAIL') {
    const status = Math.random() > 0.5 ? 'On Time' : '5 mins delayed';
    updatedOpt.realTimeStatus = `Live: ${status}`;
  } else if (updatedOpt.mode === 'TRAIN') {
    updatedOpt.realTimeStatus = 'Live: Running on time';
  }

  return updatedOpt;
};

const mockTravelData = (params: SearchParams, realDistance: number, realDuration: number): RouteResponse => {
  let options: TravelOption[] = [];

  if (realDistance <= 3) {
    options = [
      {
        id: "s1", mode: "SCOOTER", provider: "Vogo", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.9)}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.2, features: ["Self-drive", "Electric"], tag: "Eco-Choice", carbonEmission: "0 kg", ecoScore: 95,
        mood: "ECO_FRIENDLY", trustBadges: [{ id: "tb1", label: "Eco-Friendly", icon: "Leaf", description: "Zero emissions", color: "green" }]
      },
      {
        id: "c1", mode: "CAB", provider: "Uber Go", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.5, features: ["AC", "Door-to-door"], tag: "Fastest", carbonEmission: "0.5 kg", ecoScore: 40,
        mood: "PRODUCTIVE", trustBadges: [{ id: "tb2", label: "Verified", icon: "ShieldCheck", description: "Top rated driver", color: "blue" }]
      },
      {
        id: "a1", mode: "AUTO", provider: "Ola Auto", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.3, features: ["Open-air", "Economical"], tag: "Best Value", carbonEmission: "0.3 kg", ecoScore: 55,
        mood: "ADVENTUROUS"
      },
      {
        id: "bt0", mode: "BIKE_TAXI", provider: "Rapido", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.8)}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.4, features: ["Fast", "Helmet provided"], tag: "Cheapest", carbonEmission: "0.2 kg", ecoScore: 65,
        mood: "ADVENTUROUS"
      }
    ];
  } else if (realDistance <= 10) {
    options = [
      {
        id: "bt1", mode: "BIKE_TAXI", provider: "Rapido", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.8)}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.6, features: ["Helmet provided", "Fast"], tag: "Best Value", carbonEmission: "0.2 kg", ecoScore: 60,
        mood: "ADVENTUROUS"
      },
      {
        id: "m1", mode: "METRO", provider: "DMRC", departureTime: "Every 5 mins", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.7)}m`, distance: `${realDistance} km`, price: 40, currency: "INR",
        rating: 4.7, features: ["AC", "No Traffic"], tag: "Fastest", carbonEmission: "0.1 kg", ecoScore: 90,
        mood: "ECO_FRIENDLY"
      },
      {
        id: "c2", mode: "CAB", provider: "BluSmart", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.9, features: ["Electric", "No Cancellations"], tag: "Best Value", carbonEmission: "0 kg", ecoScore: 95,
        mood: "PRODUCTIVE"
      }
    ];
  } else if (realDistance <= 50) {
    options = [
      {
        id: "c3", mode: "CAB", provider: "Uber Premier", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.8, features: ["Top-rated drivers", "Sedan"], tag: "Best Value", carbonEmission: "3.5 kg", ecoScore: 30,
        mood: "PRODUCTIVE"
      },
      {
        id: "sr1", mode: "SUBURBAN_RAIL", provider: "Mumbai Local", departureTime: "Every 10 mins", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.8)}m`, distance: `${realDistance} km`, price: 15, currency: "INR",
        rating: 4.1, features: ["Fast Train", "Ticket valid for 1h"], tag: "Cheapest", carbonEmission: "0.5 kg", ecoScore: 85,
        mood: "ADVENTUROUS"
      }
    ];
  } else {
    options = [
      {
        id: "f1", mode: "FLIGHT", provider: "IndiGo", departureTime: "11:00 AM", arrivalTime: "12:30 PM",
        duration: "1h 30m", distance: "800 km", price: 5500 * params.passengers, currency: "INR",
        rating: 4.2, features: ["On-time", "Last-mile: Uber available"], tag: "Fastest", carbonEmission: "120 kg", ecoScore: 20,
        mood: "PRODUCTIVE"
      },
      {
        id: "t1", mode: "TRAIN", provider: "IRCTC (Vande Bharat)", departureTime: "08:00 AM", arrivalTime: "02:00 PM",
        duration: "6h 00m", distance: "500 km", price: 1800 * params.passengers, currency: "INR",
        rating: 4.9, features: ["AC Chair Car", "Meals included"], tag: "Best Value", carbonEmission: "8 kg", ecoScore: 92,
        mood: "PRODUCTIVE"
      },
      {
        id: "b2", mode: "BUS", provider: "IntrCity SmartBus", departureTime: "09:00 PM", arrivalTime: "08:00 AM",
        duration: "11h 00m", distance: "800 km", price: 1200 * params.passengers, currency: "INR",
        rating: 4.4, features: ["AC Sleeper", "Washroom", "WiFi"], tag: "Cheapest", carbonEmission: "20 kg", ecoScore: 70,
        mood: "RELAXED"
      }
    ];
  }

  const aiInsight = realDistance <= 25 
    ? `Short distance detected (${realDistance}km). We've prioritized local transport like Cabs and Bike Taxis for your convenience.`
    : realDistance <= 80
    ? `Intercity journey detected (${realDistance}km). Cabs and Buses are the most efficient options for this route.`
    : `Long distance journey (${realDistance}km). Trains and Flights are recommended for comfort and speed.`;

  return {
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    returnDate: params.returnDate,
    aiInsight,
    options: options.map(opt => processOption(opt, params.origin, params.time, params.destination, realDistance, realDuration, params.passengers)),
    returnOptions: params.tripType === 'ROUND_TRIP' ? options.map(opt => processOption(opt, params.destination, params.returnTime || '09:00', params.origin, realDistance, realDuration, params.passengers)) : undefined
  };
};

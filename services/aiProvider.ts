
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
  const apiKey = process.env.API_KEY;

  // 1. Fetch Real Road Distance & Duration
  const routeData = await getRoadDistance(params.origin, params.destination);
  const { distance: realDistance, duration: realDuration } = routeData;
  console.log(`Real Road Data for ${params.origin} to ${params.destination}: ${realDistance} km, ${realDuration} mins`);

  if (!apiKey) {
    console.warn("No API_KEY found. Returning mock data.");
    return mockTravelData(params, realDistance, realDuration);
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
    
    Actual Road Distance: ${realDistance} km.
    
    Passengers: ${params.passengers} (Prices must be TOTAL for all passengers)
    
    Filtering Rules based on distance (${realDistance} km):
    - If distance <= 2 km: Prioritize WALK, BICYCLE, and E-RICKSHAW.
    - If distance <= 5 km: Include AUTO, METRO, and BIKE_TAXI.
    - If distance <= 15 km: Include METRO, CAB, and AUTO.
    - If distance <= 50 km: Include METRO, CAB, and SHARED_CAB.
    - If distance > 50 km: Include TRAIN, FLIGHT, BUS, and FERRY (if coastal).
    - HARD RULE: Strictly EXCLUDE FLIGHT if distance is under 80 km.
    
    Mood Assignment:
    - PRODUCTIVE: Flights, AC Trains, Cabs with WiFi.
    - RELAXED: Sleeper Buses, Rajdhani Trains.
    - ADVENTUROUS: Bike Taxis, Scooters, Ferries.
    - ECO_FRIENDLY: Metro, E-Rickshaws, Walking, Cycling.
    
    Modes to include: Provide a diverse mix based on the rules above.
    
    For each option:
    1. 'distance': Estimate precise road/track distance.
    2. 'ecoScore': (0-100).
    3. 'carbonEmission': Estimate CO2 in kg.
    4. 'price': Total price in INR.
    5. 'tag': 'Cheapest', 'Fastest', 'Best Value', 'Eco-Choice'.
    6. 'mood': Assign one of the moods above.
    
    Provide a short 'aiInsight' comparing the options and mentioning why certain modes are prioritized for this distance.
    Limit the response to a maximum of 4 high-quality options per journey.
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class travel expert for the Indian market. You provide precise, realistic travel options across Cabs, Bike Taxis, Scooters, Buses, Trains, and Flights. You MUST follow distance-based filtering rules strictly. You understand Indian geography, typical travel times, and pricing nuances. Keep the JSON response concise.",
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
                  mode: { type: Type.STRING, enum: ['CAB', 'BUS', 'TRAIN', 'FLIGHT', 'MIXED', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'FERRY', 'SHARED_CAB', 'WALK', 'BICYCLE'] },
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
                  mode: { type: Type.STRING, enum: ['CAB', 'BUS', 'TRAIN', 'FLIGHT', 'MIXED', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'FERRY', 'SHARED_CAB', 'WALK', 'BICYCLE'] },
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
      return mockTravelData(params, realDistance, realDuration);
    }

    if (result.options && Array.isArray(result.options)) {
      result.options = result.options.map(opt => processOption(opt, params.origin, params.time, params.destination, realDistance, realDuration, params.passengers));
    } else {
      result.options = [];
    }

    if (result.returnOptions && Array.isArray(result.returnOptions)) {
        result.returnOptions = result.returnOptions.map(opt => processOption(opt, params.destination, params.returnTime || '09:00', params.origin, realDistance, realDuration, params.passengers));
    }

    return result;

  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.error("Gemini API Quota Exhausted. Falling back to mock data.");
    } else {
      console.error("Gemini API Error:", error);
    }
    return mockTravelData(params, realDistance, realDuration);
  }
};

export const chatWithAIInternal = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "I'm in offline mode right now. How can I help you with your travel plans?";

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

  // Price Recalculation for Cabs/Bike Taxis/Scooters/Auto/Metro
  if (['CAB', 'BIKE_TAXI', 'SCOOTER', 'AUTO', 'METRO', 'WALK', 'BICYCLE'].includes(updatedOpt.mode)) {
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

  const linkData = generateDeepLink(updatedOpt.provider, updatedOpt.mode, origin, destination);
  updatedOpt.deepLink = linkData.url;
  updatedOpt.deepLinkFallback = linkData.fallbackUrl;
  updatedOpt.androidIntent = linkData.androidIntent;

  updatedOpt.priceTrend = predictPriceTrend(updatedOpt.mode);

  if (['CAB', 'BIKE_TAXI', 'AUTO'].includes(updatedOpt.mode)) {
    const mins = Math.floor(Math.random() * 10) + 2;
    const label = updatedOpt.mode === 'CAB' ? 'Driver' : updatedOpt.mode === 'AUTO' ? 'Auto' : 'Rider';
    updatedOpt.realTimeStatus = `${label} arriving in ${mins} mins`;
  } else if (updatedOpt.mode === 'BUS' || updatedOpt.mode === 'METRO') {
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
        rating: 4.2, features: ["Self-drive", "Electric"], tag: "Eco-Choice", carbonEmission: "0 kg", ecoScore: 95
      },
      {
        id: "c1", mode: "CAB", provider: "Uber Go", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.5, features: ["AC", "Door-to-door"], tag: "Fastest", carbonEmission: "0.5 kg", ecoScore: 40
      }
    ];
  } else if (realDistance <= 8) {
    options = [
      {
        id: "bt1", mode: "BIKE_TAXI", provider: "Rapido", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.8)}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.6, features: ["Helmet provided", "Fast"], tag: "Best Value", carbonEmission: "0.2 kg", ecoScore: 60
      },
      {
        id: "c2", mode: "CAB", provider: "Ola Mini", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.3, features: ["AC", "Comfort"], tag: "Fastest", carbonEmission: "1.2 kg", ecoScore: 35
      }
    ];
  } else if (realDistance <= 25) {
    options = [
      {
        id: "c3", mode: "CAB", provider: "Uber Premier", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.8, features: ["Top-rated drivers", "Sedan"], tag: "Best Value", carbonEmission: "3.5 kg", ecoScore: 30
      },
      {
        id: "bt2", mode: "BIKE_TAXI", provider: "Uber Moto", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${Math.round(realDuration * 0.8)}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.4, features: ["Quick", "Affordable"], tag: "Cheapest", carbonEmission: "0.8 kg", ecoScore: 55
      }
    ];
  } else if (realDistance <= 80) {
    options = [
      {
        id: "b1", mode: "BUS", provider: "UPSRTC", departureTime: "08:00 AM", arrivalTime: "10:00 AM",
        duration: `${Math.round(realDuration * 1.5)}m`, distance: `${realDistance} km`, price: 150 * params.passengers, currency: "INR",
        rating: 3.8, features: ["Non-AC", "Regular"], tag: "Cheapest", carbonEmission: "5 kg", ecoScore: 75
      },
      {
        id: "c4", mode: "CAB", provider: "Ola Intercity", departureTime: "Flexible", arrivalTime: "Flexible",
        duration: `${realDuration}m`, distance: `${realDistance} km`, price: 0, currency: "INR",
        rating: 4.6, features: ["AC", "Private"], tag: "Fastest", carbonEmission: "15 kg", ecoScore: 25
      }
    ];
  } else {
    options = [
      {
        id: "f1", mode: "FLIGHT", provider: "Air India", departureTime: "11:00 AM", arrivalTime: "12:30 PM",
        duration: "1h 30m", distance: "800 km", price: 5500 * params.passengers, currency: "INR",
        rating: 4.2, features: ["Full Service", "Meals"], tag: "Fastest", carbonEmission: "120 kg", ecoScore: 20
      },
      {
        id: "t1", mode: "TRAIN", provider: "Rajdhani Express", departureTime: "08:00 PM", arrivalTime: "06:00 AM",
        duration: "10h 00m", distance: "800 km", price: 2800 * params.passengers, currency: "INR",
        rating: 4.9, features: ["AC 2-Tier", "Bedding"], tag: "Best Value", carbonEmission: "12 kg", ecoScore: 90
      },
      {
        id: "b2", mode: "BUS", provider: "RedBus", departureTime: "09:00 PM", arrivalTime: "08:00 AM",
        duration: "11h 00m", distance: "800 km", price: 1200 * params.passengers, currency: "INR",
        rating: 4.1, features: ["AC Sleeper", "WiFi"], tag: "Cheapest", carbonEmission: "20 kg", ecoScore: 70
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

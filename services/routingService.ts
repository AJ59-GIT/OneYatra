
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  id: string;
  city: string;
  coordinates: Coordinates;
}

const LOCATIONS: LocationData[] = [
  { id: 'DEL', city: 'New Delhi', coordinates: { lat: 28.5562, lng: 77.1000 } },
  { id: 'BOM', city: 'Mumbai', coordinates: { lat: 19.0896, lng: 72.8656 } },
  { id: 'BLR', city: 'Bengaluru', coordinates: { lat: 13.1986, lng: 77.7066 } },
  { id: 'MAA', city: 'Chennai', coordinates: { lat: 12.9941, lng: 80.1709 } },
  { id: 'CCU', city: 'Kolkata', coordinates: { lat: 22.6547, lng: 88.4467 } },
  { id: 'HYD', city: 'Hyderabad', coordinates: { lat: 17.2403, lng: 78.4298 } },
  { id: 'GOI', city: 'Goa', coordinates: { lat: 15.3800, lng: 73.8311 } },
  { id: 'PNQ', city: 'Pune', coordinates: { lat: 18.5822, lng: 73.9197 } },
  { id: 'AMD', city: 'Ahmedabad', coordinates: { lat: 23.0772, lng: 72.6347 } },
  { id: 'JAI', city: 'Jaipur', coordinates: { lat: 26.8242, lng: 75.8122 } },
  { id: 'LKO', city: 'Lucknow', coordinates: { lat: 26.7606, lng: 80.8893 } },
  { id: 'COK', city: 'Kochi', coordinates: { lat: 10.1520, lng: 76.3920 } },
  { id: 'IXC', city: 'Chandigarh', coordinates: { lat: 30.6735, lng: 76.7885 } },
  { id: 'ATQ', city: 'Amritsar', coordinates: { lat: 31.7096, lng: 74.7973 } },
  { id: 'C_AGR', city: 'Agra', coordinates: { lat: 27.1767, lng: 78.0081 } },
  { id: 'C_VNS', city: 'Varanasi', coordinates: { lat: 25.3176, lng: 82.9739 } },
  { id: 'C_SHM', city: 'Shimla', coordinates: { lat: 31.1048, lng: 77.1734 } },
  { id: 'C_MNL', city: 'Manali', coordinates: { lat: 32.2432, lng: 77.1892 } },
  { id: 'C_UDR', city: 'Udaipur', coordinates: { lat: 24.5854, lng: 73.7125 } },
  { id: 'C_RSH', city: 'Rishikesh', coordinates: { lat: 30.0869, lng: 78.2676 } },
];

export const getRoadDistance = async (origin: string, destination: string): Promise<number> => {
  const apiKey = process.env.API_KEY;
  
  const originLoc = LOCATIONS.find(l => l.city.toLowerCase().includes(origin.toLowerCase()) || l.id === origin);
  const destLoc = LOCATIONS.find(l => l.city.toLowerCase().includes(destination.toLowerCase()) || l.id === destination);

  if (apiKey && originLoc?.coordinates && destLoc?.coordinates) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLoc.coordinates.lat},${originLoc.coordinates.lng}&destinations=${destLoc.coordinates.lat},${destLoc.coordinates.lng}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        return data.rows[0].elements[0].distance.value / 1000;
      }
    } catch (error) {
      console.error("Error fetching road distance:", error);
    }
  }

  if (originLoc?.coordinates && destLoc?.coordinates) {
    const R = 6371;
    const dLat = (destLoc.coordinates.lat - originLoc.coordinates.lat) * Math.PI / 180;
    const dLng = (destLoc.coordinates.lng - originLoc.coordinates.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(originLoc.coordinates.lat * Math.PI / 180) * Math.cos(destLoc.coordinates.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const straightLine = R * c;
    return Math.round(straightLine * 1.25);
  }

  return 50;
};

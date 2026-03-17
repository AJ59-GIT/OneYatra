
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    label: string;
  }>;
  route?: any; // GeoJSON geometry
  className?: string;
}

// Component to handle map view updates
const MapUpdater: React.FC<{ center?: [number, number]; zoom?: number; markers?: any[] }> = ({ center, zoom, markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, markers, map]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ 
  center = [20.5937, 78.9629], // Center of India
  zoom = 5,
  markers = [],
  route,
  className = "h-[400px] w-full rounded-xl overflow-hidden shadow-inner"
}) => {
  
  // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
  const polylinePositions = route?.coordinates?.map((coord: [number, number]) => [coord[1], coord[0]]) || [];

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            <Popup>
              <div className="font-bold">{marker.label}</div>
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length > 0 && (
          <Polyline 
            positions={polylinePositions} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.7} 
          />
        )}

        <MapUpdater center={center} zoom={zoom} markers={markers} />
      </MapContainer>
    </div>
  );
};

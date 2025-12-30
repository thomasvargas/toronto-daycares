'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'

// FIX: Default Leaflet icon fix for Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// BRANDING: Custom "Lola Yellow" Pin using CSS
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-icon', // We will add a tiny CSS rule for this
    html: `<div style="
      background-color: #FACC15; 
      width: 16px; 
      height: 16px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Center the point
    popupAnchor: [0, -12] // Popup opens slightly above
  })
}

export default function Map({ daycares }) {
  const customIcon = createCustomIcon()

  return (
    <MapContainer 
      center={[43.6532, -79.3832]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false} // Cleaner look
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // "Voyager" is a cleaner, prettier map style than default
      />
      
      {daycares.map((daycare) => (
        <Marker 
          key={daycare.id} 
          position={[daycare.lat, daycare.lon]}
          icon={customIcon}
        >
          <Popup className="lola-popup">
            <div className="min-w-[200px]">
              <h3 className="font-bold text-slate-900 text-base">{daycare.name}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">{daycare.address}</p>
              
              <div className="flex gap-2">
                <Link 
                  href={`/daycare/${daycare.id}`}
                  className="flex-1 bg-slate-900 text-white text-center text-xs font-bold py-2 rounded-lg hover:bg-slate-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
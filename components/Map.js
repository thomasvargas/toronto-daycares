'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

export default function Map({ daycares }) {
  // Center roughly on Toronto
  const position = [43.70, -79.42]

  return (
    <MapContainer center={position} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {daycares.map((daycare) => (
        <Marker 
            key={daycare.id} 
            position={[daycare.latitude, daycare.longitude]}
        >
          <Popup>
            <div className="p-1 min-w-[200px]">
              <h3 className="font-bold text-lg leading-tight">{daycare.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{daycare.address}</p>
              
              <div className="mt-2 flex gap-1 flex-wrap mb-3">
                {daycare.accepts_infant && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Infant</span>}
                {daycare.accepts_toddler && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Toddler</span>}
                {daycare.is_cwelcc_participant && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded border border-purple-200">$10/Day</span>}
              </div>

              {/* Standard HTML link is best for Map Popups */}
              <a 
                href={`/daycare/${daycare.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors"
              >
                View Full Profile
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
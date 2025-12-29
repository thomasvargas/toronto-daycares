'use client'

// We change 'Marker' to 'CircleMarker' for the sleek dot look
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

export default function Map({ daycares }) {
  const position = [43.70, -79.42]

  return (
    <MapContainer 
      center={position} 
      zoom={12} 
      style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      zoomControl={false} // We hide zoom buttons for a cleaner mobile look (pinch to zoom works)
    >
      <TileLayer
        // Using a cleaner, black & white map style (CartoDB Voyager) for sophistication
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {daycares.map((daycare) => (
        <CircleMarker 
            key={daycare.id} 
            center={[daycare.latitude, daycare.longitude]}
            radius={6} // Size of the dot
            pathOptions={{ 
                color: '#ffffff',    // White border
                fillColor: '#0f172a', // Slate-900 (Dark Navy) fill
                fillOpacity: 0.9,
                weight: 2 
            }}
        >
          <Popup closeButton={false} className="clean-popup">
            <div className="p-2 min-w-[200px]">
              {/* Type Tag */}
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 uppercase mb-2">
                {daycare.type}
              </span>
              
              <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">{daycare.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{daycare.address}</p>
              
              <div className="flex gap-1 flex-wrap mb-4">
                {daycare.accepts_infant && <Badge text="Infant" color="blue" />}
                {daycare.accepts_toddler && <Badge text="Toddler" color="emerald" />}
                {daycare.is_cwelcc_participant && <Badge text="$10/Day" color="purple" />}
              </div>

              <a 
                href={`/daycare/${daycare.id}`}
                className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                View Details
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

function Badge({ text, color }) {
  // Mapping simplistic colors to Tailwind classes
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
  }
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-medium ${styles[color] || "bg-gray-100"}`}>
      {text}
    </span>
  )
}
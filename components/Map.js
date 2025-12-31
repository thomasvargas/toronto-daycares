'use client'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// --- 1. SMART BOUNDS COMPONENT ---
// This invisible component watches the pins and zooms the map to fit them all.
function FitBounds({ markers }) {
  const map = useMap()

  useEffect(() => {
    if (!markers || markers.length === 0) return

    // Create a bounding box that includes every pin
    const bounds = L.latLngBounds(markers.map(m => [m.finalLat, m.finalLon]))
    
    // Zoom the map to fit that box (with some padding so pins aren't on the edge)
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [markers, map])

  return null
}

export default function Map({ daycares, userLocation }) {
  const [user, setUser] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [lolaIcon, setLolaIcon] = useState(null)
  const [userIcon, setUserIcon] = useState(null)

  // 2. DATA CLEANING
  // Handle both 'lat' and 'latitude' AND remove empty objects
  const validDaycares = (daycares || [])
    .filter(d => d) // Remove nulls
    .map(d => ({ 
      ...d, 
      finalLat: d.lat || d.latitude, 
      finalLon: d.lon || d.longitude 
    }))
    .filter(d => d.finalLat && d.finalLon) // Only keep valid coordinates

  useEffect(() => {
    setIsClient(true)

    // YELLOW PIN (Daycares)
    const pin = L.divIcon({
      className: 'custom-lola-pin',
      html: `<div style="
        background-color: #FACC15; 
        width: 18px; 
        height: 18px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    })
    setLolaIcon(pin)

    // BLUE PIN (User)
    const mePin = L.divIcon({
      className: 'custom-user-pin',
      html: `<div style="
        background-color: #3B82F6; 
        width: 18px; 
        height: 18px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
    setUserIcon(mePin)

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
    }
    checkUser()
  }, [])

  const handleQuickSave = async (daycareId) => {
    if (!user) return alert("Please sign in to save places!")
    const { error } = await supabase
      .from('saved_daycares')
      .insert([{ user_id: user.id, daycare_id: daycareId }])
      
    if (!error) alert("Saved to your shortlist!")
    else alert("Already in your list!")
  }

  if (!isClient || !lolaIcon) return <div className="h-full w-full bg-[#FDFBF7]" />

  return (
    <MapContainer 
      // Force re-render if data changes significantly
      key={`map-${validDaycares.length}`}
      center={[43.6532, -79.3832]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* 3. ACTIVATE AUTO-FIT */}
      <FitBounds markers={validDaycares} />

      {/* User Location */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
           <Popup>You are here</Popup>
        </Marker>
      )}
      
      {/* Daycare Pins */}
      {validDaycares.map((daycare) => (
        <Marker 
          key={daycare.id} 
          position={[daycare.finalLat, daycare.finalLon]}
          icon={lolaIcon}
        >
          <Popup className="lola-popup">
            <div className="min-w-[200px] font-sans">
                <h3 className="font-bold text-slate-900 text-base leading-tight">{daycare.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{daycare.address}</p>
                
                <div className="flex gap-2">
                    <Link 
                      href={`/daycare/${daycare.id}`}
                      className="flex-1 bg-slate-900 text-white text-center text-xs font-bold py-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Details
                    </Link>
                    
                    {user && (
                        <button
                            onClick={() => handleQuickSave(daycare.id)}
                            className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 transition-colors"
                            title="Quick Save"
                        >
                            ❤️
                        </button>
                    )}
                </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
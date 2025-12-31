'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Map({ daycares }) {
  const [user, setUser] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [lolaIcon, setLolaIcon] = useState(null)

  // 1. SMART DATA CLEANING
  // We check for 'lat' OR 'latitude', and 'lon' OR 'longitude'
  const validDaycares = daycares
    .map(d => ({
      ...d,
      // Normalize the names so the rest of the app doesn't worry
      finalLat: d.lat || d.latitude, 
      finalLon: d.lon || d.longitude 
    }))
    .filter(d => d.finalLat && d.finalLon) // Only keep valid ones

  useEffect(() => {
    setIsClient(true)

    // 2. CREATE THE YELLOW PIN (CSS)
    // This draws the pin with code, so no image files can break.
    const icon = L.divIcon({
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
    setLolaIcon(icon)

    // 3. CHECK USER (For Quick Save)
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

  // Wait for client + icon to be ready
  if (!isClient || !lolaIcon) return <div className="h-full w-full bg-[#FDFBF7]" />

  return (
    <MapContainer 
      center={[43.6532, -79.3832]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
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
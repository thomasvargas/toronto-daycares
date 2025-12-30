'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient' // Import Supabase to handle the Quick Save

// FIX: Ensure this code only runs in the browser (fixes "window is not defined")
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="
      background-color: #FACC15; 
      width: 16px; 
      height: 16px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  })
}

export default function Map({ daycares }) {
  // Use a stable reference for the icon so it doesn't flicker
  const [icon, setIcon] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Create icon only on client side
    if (typeof window !== 'undefined') {
      setIcon(createCustomIcon())
    }

    // 2. Check for user session (for the Quick Save button)
    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
    }
    checkUser()
  }, [])

  // Handle Quick Save
  const handleQuickSave = async (daycareId) => {
    if (!user) return alert("Please sign in to save places!")
    
    const { error } = await supabase
      .from('saved_daycares')
      .insert([{ user_id: user.id, daycare_id: daycareId }])
      
    if (!error) alert("Saved to your shortlist!")
    else alert("Already in your list!")
  }

  if (!icon) return null // Wait for icon to load

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
      
      {daycares.map((daycare) => {
        // --- THE FIX IS HERE ---
        // If lat or lon is missing, skip this marker entirely.
        if (!daycare.lat || !daycare.lon) return null;

        return (
            <Marker 
            key={daycare.id} 
            position={[daycare.lat, daycare.lon]}
            icon={icon}
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
        )
      })}
    </MapContainer>
  )
}
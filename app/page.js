'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'

const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-[#FDFBF7] text-gray-400">Loading Map...</div>
})

export default function Home() {
  const [daycares, setDaycares] = useState([])
  const [user, setUser] = useState(null)
  
  // --- NEW STATE VARIABLES ---
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [userLocation, setUserLocation] = useState(null) // { lat: 43.6, lon: -79.3 }
  const [radius, setRadius] = useState(5) // Default 5km radius
  
  const [filters, setFilters] = useState({
    infant: false,
    toddler: false,
    cwelcc: false,
    subsidy: false
  })

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('daycares').select('*')
      if (data) setDaycares(data)

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    fetchData()
  }, [])

  // --- 1. DISTANCE CALCULATOR (Haversine Formula) ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // --- 2. SEARCH LOGIC (OpenStreetMap) ---
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery) return

    setIsSearching(true)
    try {
      // Use OpenStreetMap Nominatim API (Free)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery} Toronto Canada`)
      const data = await res.json()
      
      if (data && data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
      } else {
        alert("Couldn't find that address. Try searching for a major street or neighborhood.")
      }
    } catch (err) {
      console.error(err)
      alert("Search failed. Please try again.")
    }
    setIsSearching(false)
  }

  // --- 3. LOCATE ME LOGIC ---
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    setIsSearching(true)
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      })
      setIsSearching(false)
    }, () => {
      alert("Unable to retrieve your location")
      setIsSearching(false)
    })
  }

  const handleReset = () => {
    setFilters({ infant: false, toddler: false, cwelcc: false, subsidy: false })
    setUserLocation(null)
    setSearchQuery('')
    setRadius(5)
  }

  // --- FILTERING LOGIC ---
  const filteredDaycares = daycares.filter(daycare => {
    // 1. Basic Filters
    if (filters.infant && !daycare.accepts_infant) return false
    if (filters.toddler && !daycare.accepts_toddler) return false
    if (filters.cwelcc && !daycare.is_cwelcc_participant) return false
    if (filters.subsidy && !daycare.has_subsidy) return false
    
    // 2. Distance Filter (Only if user has a location set)
    if (userLocation) {
      const dLat = daycare.lat || daycare.latitude
      const dLon = daycare.lon || daycare.longitude
      if (dLat && dLon) {
        const dist = calculateDistance(userLocation.lat, userLocation.lon, dLat, dLon)
        if (dist > radius) return false
      }
    }
    return true
  })

  const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <main className="flex h-screen flex-col bg-[#FDFBF7] overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100">
        
        {/* TOP ROW: Logo & Auth */}
        <div className="px-6 py-4 flex justify-between items-center">
            <div className="relative h-24 w-48 shrink-0 -my-4"> 
              <Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority />
            </div>
            <div className="flex gap-4 items-center">
               {user ? (
                 <Link href="/dashboard" className="text-sm font-bold bg-yellow-400 px-4 py-2 rounded-full hover:bg-yellow-300">My Dashboard</Link>
               ) : (
                 <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900">Sign In</Link>
               )}
            </div>
        </div>

        {/* --- CONTROL PANEL --- */}
        <div className="px-6 pb-6 pt-2 max-w-7xl mx-auto space-y-4">
          
          {/* ROW 1: SEARCH & LOCATE */}
          <div className="flex flex-col md:flex-row gap-3">
             <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search address, neighborhood or postal code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-stone-300 rounded-xl px-4 py-3 bg-white text-slate-900 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
                />
                <button type="submit" disabled={isSearching} className="bg-slate-900 text-white font-bold px-6 rounded-xl hover:bg-slate-700 transition-all">
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
             </form>
             <button onClick={handleLocateMe} className="bg-white border border-stone-300 text-slate-700 font-bold px-4 py-3 rounded-xl hover:bg-stone-50 flex items-center gap-2 shadow-sm whitespace-nowrap">
                📍 Locate Me
             </button>
             {(filters.infant || filters.toddler || filters.cwelcc || filters.subsidy || userLocation) && (
                <button onClick={handleReset} className="text-red-500 font-bold text-sm px-4 hover:underline whitespace-nowrap">
                  ✕ Reset All
                </button>
             )}
          </div>

          {/* ROW 2: FILTERS & RADIUS */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border-t border-stone-100 pt-4">
             
             {/* Left: Toggles */}
             <div className="flex flex-wrap gap-3">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wide self-center mr-2">Ages:</span>
               <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
               <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
               
               <div className="w-px h-8 bg-stone-200 mx-2 hidden sm:block"></div> {/* Divider */}
               
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wide self-center mr-2">Cost:</span>
               <FilterPill label="$10/Day" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
               <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
             </div>

             {/* Right: Distance Slider (Only visible if location set) */}
             {userLocation && (
               <div className="flex items-center gap-4 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 animate-in fade-in slide-in-from-right-4">
                  <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide whitespace-nowrap">
                    Within {radius}km
                  </span>
                  <input 
                    type="range" 
                    min="1" max="20" 
                    value={radius} 
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-32 accent-yellow-500 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                  />
               </div>
             )}
          </div>

        </div>
      </div>

      {/* --- MAP --- */}
      <div className="flex-1 relative z-0 w-full">
        {/* Pass userLocation to map so it can draw the 'Me' pin and fly to it */}
        <Map daycares={filteredDaycares} userLocation={userLocation} />
      </div>
    </main>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border ${active ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-stone-200 hover:border-yellow-400 hover:text-slate-900 hover:shadow-sm"}`}
    >
      {label}
    </button>
  )
}
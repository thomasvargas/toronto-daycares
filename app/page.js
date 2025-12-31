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
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [radius, setRadius] = useState(5)
  
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery} Toronto Canada`)
      const data = await res.json()
      if (data && data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
      } else {
        alert("Couldn't find that location. Try a major street or postal code.")
      }
    } catch (err) {
      alert("Search failed.")
    }
    setIsSearching(false)
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported")
    setIsSearching(true)
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      setIsSearching(false)
    }, () => setIsSearching(false))
  }

  const handleReset = () => {
    setFilters({ infant: false, toddler: false, cwelcc: false, subsidy: false })
    setUserLocation(null)
    setSearchQuery('')
    setRadius(5)
  }

  const filteredDaycares = daycares.filter(daycare => {
    if (filters.infant && !daycare.accepts_infant) return false
    if (filters.toddler && !daycare.accepts_toddler) return false
    if (filters.cwelcc && !daycare.is_cwelcc_participant) return false
    if (filters.subsidy && !daycare.has_subsidy) return false
    
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
      
      {/* --- MAIN HEADER (ONE ROW) --- */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-4">
            
            {/* 1. LOGO (Doubled Size + Negative Margin to keep header tight) */}
            <div className="relative h-24 w-64 shrink-0 -my-4"> 
              <Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority />
            </div>

            {/* 2. SEARCH & LOCATE (CENTERED) */}
            <div className="flex-1 w-full flex items-center justify-center gap-2">
                 <form onSubmit={handleSearch} className="flex-1 max-w-md flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Search neighborhood / postal code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
                    />
                    <button type="submit" disabled={isSearching} className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-700 whitespace-nowrap">
                      {isSearching ? '...' : 'Search'}
                    </button>
                 </form>
                 
                 <button onClick={handleLocateMe} className="bg-white border border-stone-300 text-slate-700 text-sm font-bold px-3 py-2 rounded-lg hover:bg-stone-50 shadow-sm whitespace-nowrap" title="Use my location">
                    📍 Locate Me
                 </button>
            </div>

            {/* 3. AUTH & DASHBOARD (RIGHT) */}
            <div className="shrink-0 flex items-center gap-3">
               {user ? (
                 <Link href="/dashboard" className="text-sm font-bold bg-yellow-400 text-slate-900 px-5 py-2 rounded-full hover:bg-yellow-300 shadow-sm whitespace-nowrap">
                   My Dashboard
                 </Link>
               ) : (
                 <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 whitespace-nowrap">
                   Sign In
                 </Link>
               )}
            </div>
        </div>
      </div>

      {/* --- FILTER BAR (SECOND ROW) --- */}
      <div className="w-full relative z-10 shrink-0 bg-white/50 backdrop-blur-sm border-b border-stone-100 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
             
             {/* FILTERS */}
             <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
               <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
               <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
               <span className="text-stone-300 mx-1">|</span>
               <FilterPill label="$10/Day Program" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
               <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
             </div>

             {/* ACTIVE SEARCH CONTROLS (Slider & Reset) */}
             <div className="flex items-center gap-4">
                {userLocation && (
                   <div className="flex items-center gap-3 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                      <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide">
                        Within {radius}km
                      </span>
                      <input 
                        type="range" min="1" max="20" value={radius} 
                        onChange={(e) => setRadius(e.target.value)}
                        className="w-24 accent-yellow-500 h-1.5 bg-yellow-200 rounded-lg cursor-pointer"
                      />
                   </div>
                )}
                
                {(filters.infant || filters.toddler || filters.cwelcc || filters.subsidy || userLocation) && (
                    <button onClick={handleReset} className="text-xs font-bold text-red-400 hover:text-red-600 hover:underline whitespace-nowrap">
                      Clear All
                    </button>
                )}
             </div>
        </div>
      </div>

      {/* --- MAP --- */}
      <div className="flex-1 relative z-0 w-full">
        <Map daycares={filteredDaycares} userLocation={userLocation} />
      </div>
    </main>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${active ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-stone-200 hover:border-yellow-400 hover:text-slate-900"}`}
    >
      {label}
    </button>
  )
}
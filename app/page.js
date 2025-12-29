'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'

// Dynamically import Map
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
})

export default function Home() {
  const [daycares, setDaycares] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 1. FILTER STATE: Keep track of which buttons are 'ON'
  const [filters, setFilters] = useState({
    infant: false,
    toddler: false,
    cwelcc: false,
    subsidy: false
  })

  // Fetch data once on load
  useEffect(() => {
    async function fetchDaycares() {
      const { data, error } = await supabase.from('daycares').select('*')
      if (error) console.error('Error:', error)
      else setDaycares(data)
      setLoading(false)
    }
    fetchDaycares()
  }, [])

  // 2. FILTER LOGIC: This runs every time a button is clicked
  // It starts with the full list and removes daycares that don't match
  const filteredDaycares = daycares.filter(daycare => {
    if (filters.infant && !daycare.accepts_infant) return false
    if (filters.toddler && !daycare.accepts_toddler) return false
    if (filters.cwelcc && !daycare.is_cwelcc_participant) return false
    if (filters.subsidy && !daycare.has_subsidy) return false
    return true
  })

  // Helper to toggle filters
  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white shadow-md z-10 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Toronto Daycare Map</h1>
              <p className="text-sm text-gray-500">
                Showing {filteredDaycares.length} of {daycares.length} locations
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <FilterButton 
                label="Infant (0-18m)" 
                active={filters.infant} 
                onClick={() => toggleFilter('infant')}
                color="blue"
              />
              <FilterButton 
                label="Toddler (18m-2.5y)" 
                active={filters.toddler} 
                onClick={() => toggleFilter('toddler')}
                color="green"
              />
              <FilterButton 
                label="$10/Day Program" 
                active={filters.cwelcc} 
                onClick={() => toggleFilter('cwelcc')}
                color="purple"
              />
              <FilterButton 
                label="Accepts Subsidy" 
                active={filters.subsidy} 
                onClick={() => toggleFilter('subsidy')}
                color="orange"
              />
            </div>

          </div>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="flex-grow relative">
        {loading ? (
           <div className="h-full flex items-center justify-center">Loading...</div>
        ) : (
           <Map daycares={filteredDaycares} />
        )}
      </div>
    </main>
  )
}

// A small sub-component for the buttons to keep code clean
function FilterButton({ label, active, onClick, color }) {
  // Define colors for Active vs Inactive state
  const colorMap = {
    blue:   active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400",
    green:  active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:border-green-400",
    purple: active ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300 hover:border-purple-400",
    orange: active ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400",
  }

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 ${colorMap[color]}`}
    >
      {active && "✓ "} {label}
    </button>
  )
}
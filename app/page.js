'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">Loading Map...</div>
})

export default function Home() {
  const [daycares, setDaycares] = useState([])
  const [user, setUser] = useState(null) // Track the user
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    infant: false,
    toddler: false,
    cwelcc: false,
    subsidy: false
  })

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Daycares
      const { data: daycareData } = await supabase.from('daycares').select('*')
      if (daycareData) setDaycares(daycareData)

      // 2. Check who is logged in
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredDaycares = daycares.filter(daycare => {
    if (filters.infant && !daycare.accepts_infant) return false
    if (filters.toddler && !daycare.accepts_toddler) return false
    if (filters.cwelcc && !daycare.is_cwelcc_participant) return false
    if (filters.subsidy && !daycare.has_subsidy) return false
    return true
  })

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <main className="flex h-screen flex-col bg-slate-50 relative overflow-hidden">
      
      {/* FLOATING CONTROL PANEL */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl border border-gray-100 p-4 md:p-5">
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Toronto Daycare Finder</h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                  {loading ? 'Loading...' : `Found ${filteredDaycares.length} Locations`}
                </p>
              </div>
              
              {/* AUTH BUTTON: Shows Email if logged in, Sign In button if not */}
              {user ? (
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                   <div className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {user.email[0].toUpperCase()}
                   </div>
                   <span className="text-xs font-semibold text-slate-700 hidden sm:block">
                      {user.email}
                   </span>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                  Sign In
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
              <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
              <FilterPill label="$10/Day Program" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
              <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
            </div>

          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Map daycares={filteredDaycares} />
      </div>
    </main>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border ${active ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105" : "bg-white text-slate-600 border-gray-200 hover:border-slate-300 hover:shadow-sm"}`}
    >
      {label}
    </button>
  )
}
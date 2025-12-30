'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'

const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">Loading Map...</div>
})

export default function Home() {
  const [daycares, setDaycares] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    infant: false,
    toddler: false,
    cwelcc: false,
    subsidy: false
  })

  useEffect(() => {
    async function fetchData() {
      const { data: daycareData } = await supabase.from('daycares').select('*')
      if (daycareData) setDaycares(daycareData)

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

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
      
      {/* WIDE TOP BANNER */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="w-full pointer-events-auto">
          {/* UPDATED BANNER STYLES:
             - bg-[#FFF9F0]: Cream color to blend with logo background.
             - Added 'flex items-center gap-8' to parent container for layout.
          */}
          <div className="bg-[#FFF9F0] shadow-md border-b border-yellow-100 px-6 py-4 md:px-8 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            
            {/* LEFT: LOGO (Redundant text removed, size doubled) */}
            {/* Increased from h-24 to h-48 for 2x size */}
            <div className="relative h-48 w-48 shrink-0">
                <Image 
                src="/logo.png" 
                alt="Lola's List Logo" 
                fill
                className="object-contain"
                priority
                />
            </div>

            {/* MIDDLE: FILTERS (Relocated here) */}
            <div className="flex-1 flex flex-col items-center md:items-start w-full md:w-auto order-last md:order-none">
                <span className="text-sm font-bold text-slate-700 mb-2 block">Filters!</span>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
                  <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
                  <FilterPill label="$10/Day Program" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
                  <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
                </div>
            </div>
              
            {/* RIGHT: AUTH SECTION */}
            <div className="shrink-0">
                {user ? (
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-300 hover:bg-yellow-200 transition-all cursor-pointer group shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center text-sm font-bold">
                                {user.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-800 hidden sm:block">
                                My Shortlist
                            </span>
                        </Link>
                        
                        <button 
                            onClick={handleLogout}
                            className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors px-2"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-5 py-2.5 rounded-full shadow-md transition-colors">
                    Sign In
                    </Link>
                )}
            </div>

          </div>
        </div>
      </div>

      {/* Adjusted top padding to account for taller header (approx 230px) */}
      <div className="absolute inset-0 z-0 pt-[230px]">
        <Map daycares={filteredDaycares} />
      </div>
    </main>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 border ${active ? "bg-yellow-400 text-slate-900 border-yellow-500 shadow-md transform scale-105" : "bg-white text-slate-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm"}`}
    >
      {label}
    </button>
  )
}
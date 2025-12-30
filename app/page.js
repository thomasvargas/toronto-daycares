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
    // LAYOUT FIX: 'flex-col' stacks the banner and map vertically
    <main className="flex h-screen flex-col bg-[#FDFBF7] overflow-hidden">
      
      {/* 1. THE HEADER (Static Block) */}
      {/* Removed 'absolute', added 'relative z-10' so its shadow sits on top of the map */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-6 py-4">
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* LEFT: LOGO */}
          <div className="relative h-32 w-64 shrink-0 -my-4"> 
              <Image 
                src="/logo.png" 
                alt="Lola's List Logo" 
                fill
                className="object-contain mix-blend-multiply" 
                priority
              />
          </div>

          {/* CENTER: FILTERS */}
          <div className="flex-1 w-full md:w-auto flex justify-center md:justify-start">
              <div className="flex flex-wrap gap-3 justify-center">
                <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
                <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
                <FilterPill label="$10/Day Program" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
                <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
              </div>
          </div>
            
          {/* RIGHT: AUTH SECTION */}
          <div className="shrink-0 flex items-center gap-4">
              {user ? (
                  <>
                      <Link href="/dashboard" className="flex items-center gap-3 bg-yellow-400 text-slate-900 px-5 py-2.5 rounded-full hover:bg-yellow-300 hover:scale-105 transition-all cursor-pointer shadow-md font-bold">
                          <span className="text-sm">My Shortlist</span>
                          <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center text-xs">
                              {user.email[0].toUpperCase()}
                          </div>
                      </Link>
                      
                      <button 
                          onClick={handleLogout}
                          className="text-xs font-bold text-slate-400 uppercase tracking-wide hover:text-red-500 transition-colors"
                      >
                          Log Out
                      </button>
                  </>
              ) : (
                  <Link href="/login" className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 px-6 py-3 rounded-full shadow-md transition-all hover:scale-105">
                    Sign In
                  </Link>
              )}
          </div>

        </div>
      </div>

      {/* 2. THE MAP (Fills Remaining Space) */}
      {/* 'flex-1' tells this div to take all remaining height. No padding needed! */}
      <div className="flex-1 relative z-0 w-full">
        <Map daycares={filteredDaycares} />
      </div>
    </main>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`
        px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
        ${active 
          ? "bg-blue-500 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-200" 
          : "bg-white text-slate-500 border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:shadow-sm"
        }
      `}
    >
      {label}
    </button>
  )
}
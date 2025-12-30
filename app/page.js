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
        {/* Changed from max-w-4xl to w-full for a wide banner */}
        <div className="w-full pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 px-6 py-4 md:px-8 md:py-5">
            
            <div className="flex items-center justify-between mb-4">
              
              {/* BRANDING SECTION - LARGER LOGO & TEXT */}
              <div className="flex items-center gap-4">
                {/* Larger Logo Container (h-24 w-24) */}
                <div className="relative h-24 w-24 shrink-0">
                  <Image 
                    src="/logo.png" 
                    alt="Lola's List Logo" 
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  {/* Larger Text size */}
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                    Lola&apos;s List
                  </h1>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">
                    A Childcare Finder
                  </p>
                </div>
              </div>
              
              {/* AUTH SECTION */}
              {user ? (
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 transition-all cursor-pointer group shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center text-sm font-bold">
                            {user.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-800 hidden sm:block">
                            My Shortlist
                        </span>
                    </Link>
                    
                    <button 
                        onClick={handleLogout}
                        className="text-sm font-semibold text-slate-400 hover:text-red-600 transition-colors px-2"
                    >
                        Log Out
                    </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-full shadow-md transition-colors">
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

      <div className="absolute inset-0 z-0 pt-[160px] md:pt-[140px]"> {/* Added top padding to map so it doesn't get cut off by the banner */}
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
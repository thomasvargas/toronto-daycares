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
  const [filters, setFilters] = useState({
    infant: false,
    toddler: false,
    cwelcc: false,
    subsidy: false
  })
  
  // WELCOME MODAL STATE
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Data
      const { data: daycareData } = await supabase.from('daycares').select('*')
      if (daycareData) setDaycares(daycareData)

      // 2. Check User
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      // 3. Check if user has seen the Welcome Modal
      const hasSeenIntro = localStorage.getItem('hasSeenLolaIntro')
      if (!hasSeenIntro) {
        setShowWelcome(true)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const dismissWelcome = () => {
    localStorage.setItem('hasSeenLolaIntro', 'true')
    setShowWelcome(false)
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
    <main className="flex h-screen flex-col bg-[#FDFBF7] overflow-hidden relative">
      
      {/* --- WELCOME MODAL --- */}
      {showWelcome && (
        <div className="absolute inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-[#FDFBF7] p-8 text-center border-b border-stone-100">
               <div className="relative h-24 w-48 mx-auto mb-4">
                 <Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" />
               </div>
               <h2 className="text-2xl font-bold text-slate-900">Find Childcare, Stress-Free.</h2>
               <p className="text-slate-500 mt-2">Your all-in-one tool for navigating the Toronto daycare system.</p>
            </div>
            
            {/* Modal Body: Features */}
            <div className="p-8 space-y-6">
               <FeatureRow icon="🔍" title="Search & Filter" desc="Find centers that match your exact needs (Infant spots, Subsidies, $10/day)." />
               <FeatureRow icon="❤️" title="Curate Your List" desc="Save your favorites to a personalized shortlist." />
               <FeatureRow icon="📊" title="Track Applications" desc="Log phone calls, waitlists, and follow-ups in your private dashboard." />
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-100">
              <button 
                onClick={dismissWelcome}
                className="w-full bg-yellow-400 text-slate-900 font-bold text-lg py-4 rounded-xl hover:bg-yellow-300 hover:scale-[1.02] transition-all shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN APP CONTENT --- */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative h-32 w-64 shrink-0 -my-4"> 
              <Image src="/logo.png" alt="Lola's List Logo" fill className="object-contain mix-blend-multiply" priority />
          </div>

          <div className="flex-1 w-full md:w-auto flex justify-center md:justify-start">
              <div className="flex flex-wrap gap-3 justify-center">
                <FilterPill label="Infant (0-18m)" active={filters.infant} onClick={() => toggleFilter('infant')} />
                <FilterPill label="Toddler (18m-2.5y)" active={filters.toddler} onClick={() => toggleFilter('toddler')} />
                <FilterPill label="$10/Day Program" active={filters.cwelcc} onClick={() => toggleFilter('cwelcc')} />
                <FilterPill label="Subsidies" active={filters.subsidy} onClick={() => toggleFilter('subsidy')} />
              </div>
          </div>
            
          <div className="shrink-0 flex items-center gap-4">
              {user ? (
                  <>
                      <Link href="/dashboard" className="flex items-center gap-3 bg-yellow-400 text-slate-900 px-5 py-2.5 rounded-full hover:bg-yellow-300 hover:scale-105 transition-all cursor-pointer shadow-md font-bold">
                          <span className="text-sm">My Dashboard</span>
                      </Link>
                      <button onClick={handleLogout} className="text-xs font-bold text-slate-400 uppercase tracking-wide hover:text-red-500 transition-colors">
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

      <div className="flex-1 relative z-0 w-full">
        <Map daycares={filteredDaycares} />
      </div>
    </main>
  )
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 shrink-0 bg-yellow-100 rounded-full flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${active ? "bg-blue-500 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-200" : "bg-white text-slate-500 border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:shadow-sm"}`}
    >
      {label}
    </button>
  )
}
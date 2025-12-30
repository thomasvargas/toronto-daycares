'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function DaycareProfile() {
  const params = useParams()
  const [daycare, setDaycare] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // NEW: State for the "Heart"
  const [user, setUser] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // 1. Get the Current User
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      // 2. Fetch Daycare Details
      const { data: daycareData, error } = await supabase
        .from('daycares')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) console.error('Error:', error)
      else setDaycare(daycareData)

      // 3. Check if it is ALREADY saved (only if user is logged in)
      if (currentUser && daycareData) {
        const { data: savedData } = await supabase
          .from('saved_daycares')
          .select('*')
          .eq('daycare_id', params.id)
          .eq('user_id', currentUser.id)
          .single()
        
        // If we found a row, it means it is saved!
        if (savedData) setIsSaved(true)
      }

      setLoading(false)
    }

    if (params.id) fetchData()
  }, [params.id])

  // NEW: Handle the Click
  const toggleSave = async () => {
    if (!user) return alert("Please sign in to save daycares!")
    
    setSaveLoading(true)

    if (isSaved) {
      // REMOVE from Shortlist
      const { error } = await supabase
        .from('saved_daycares')
        .delete()
        .eq('daycare_id', daycare.id)
        .eq('user_id', user.id)
      
      if (!error) setIsSaved(false)
    } else {
      // ADD to Shortlist
      const { error } = await supabase
        .from('saved_daycares')
        .insert([{ daycare_id: daycare.id, user_id: user.id }])
      
      if (!error) setIsSaved(true)
    }
    setSaveLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading profile...</div>
  if (!daycare) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Daycare not found.</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      
      {/* 1. TOP NAVIGATION */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link 
            href="/" 
            className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span className="mr-1">←</span> Back to Map
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        
        {/* 2. HERO CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative">
          
          <div className="flex justify-between items-start mb-4">
             <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider text-slate-500 bg-slate-100 uppercase">
                {daycare.type}
             </span>

             {/* THE HEART BUTTON */}
             <button 
               onClick={toggleSave}
               disabled={saveLoading}
               className={`p-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                 isSaved 
                   ? "bg-red-50 text-red-600 hover:bg-red-100" 
                   : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
               }`}
             >
               {/* Heart Icon SVG */}
               <svg 
                 xmlns="http://www.w3.org/2000/svg" 
                 viewBox="0 0 24 24" 
                 fill={isSaved ? "currentColor" : "none"} 
                 stroke="currentColor" 
                 strokeWidth="2" 
                 className={`w-6 h-6 ${saveLoading ? 'animate-pulse' : ''}`}
               >
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
               </svg>
               
               <span className="text-xs font-bold pr-1">
                 {isSaved ? "Saved" : "Save"}
               </span>
             </button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-2 pr-12">
            {daycare.name}
          </h1>
          <p className="text-slate-500 text-lg mb-6 leading-relaxed">
            {daycare.address}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {daycare.is_cwelcc_participant && <ModernBadge label="$10/Day Program" color="purple" icon="✨" />}
            {daycare.has_subsidy && <ModernBadge label="Subsidies Accepted" color="orange" icon="💰" />}
          </div>
        </div>

        {/* 3. CAPACITY DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Licensed Programs</h2>
            <div className="space-y-3">
              <ProgramRow label="Infant (0-18m)" active={daycare.accepts_infant} />
              <ProgramRow label="Toddler (18m-2.5y)" active={daycare.accepts_toddler} />
              <ProgramRow label="Preschool (2.5y-4y)" active={daycare.accepts_preschool} />
              <ProgramRow label="Kindergarten (4y-6y)" active={daycare.accepts_kindergarten} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
             <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Facility Details</h2>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-slate-900">{daycare.capacity_total}</p>
                  <p className="text-sm text-slate-500">Total Licensed Capacity</p>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Phone</p>
                <a href={`tel:${daycare.phone}`} className="text-blue-600 font-medium hover:underline text-lg">
                  {daycare.phone || "Not Listed"}
                </a>
             </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          *Capacity represents the total number of licensed spots approved by the Ministry, not current vacancies.
        </p>

      </div>
    </div>
  )
}

// Sub-components
function ModernBadge({ label, color, icon }) {
  const colors = {
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  }
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      <span className="mr-1.5">{icon}</span> {label}
    </span>
  )
}

function ProgramRow({ label, active }) {
  return (
    <div className="flex items-center justify-between group">
      <span className={`text-sm font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>
        {label}
      </span>
      {active ? (
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
      ) : (
        <span className="text-xs text-slate-300">N/A</span>
      )}
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function DaycareProfile() {
  const params = useParams()
  const [daycare, setDaycare] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDaycare() {
      const { data, error } = await supabase
        .from('daycares')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) console.error('Error:', error)
      else setDaycare(data)
      setLoading(false)
    }
    if (params.id) fetchDaycare()
  }, [params.id])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading profile...</div>
  if (!daycare) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Daycare not found.</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      
      {/* 1. TOP NAVIGATION (Sticky) */}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="mb-4">
             <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider text-slate-500 bg-slate-100 uppercase">
                {daycare.type}
             </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-2">
            {daycare.name}
          </h1>
          <p className="text-slate-500 text-lg mb-6 leading-relaxed">
            {daycare.address}
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {daycare.is_cwelcc_participant && <ModernBadge label="$10/Day Program" color="purple" icon="✨" />}
            {daycare.has_subsidy && <ModernBadge label="Subsidies Accepted" color="orange" icon="💰" />}
          </div>
        </div>

        {/* 3. CAPACITY DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Active Programs Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Licensed Programs</h2>
            <div className="space-y-3">
              <ProgramRow label="Infant (0-18m)" active={daycare.accepts_infant} />
              <ProgramRow label="Toddler (18m-2.5y)" active={daycare.accepts_toddler} />
              <ProgramRow label="Preschool (2.5y-4y)" active={daycare.accepts_preschool} />
              <ProgramRow label="Kindergarten (4y-6y)" active={daycare.accepts_kindergarten} />
            </div>
          </div>

          {/* Details Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
             <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Facility Details</h2>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-slate-900">{daycare.capacity_total}</p>
                  <p className="text-sm text-slate-500">Total Licensed Capacity</p>
                </div>
             </div>
             
             {/* Contact Button */}
             <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Phone</p>
                <a href={`tel:${daycare.phone}`} className="text-blue-600 font-medium hover:underline text-lg">
                  {daycare.phone || "Not Listed"}
                </a>
             </div>
          </div>
        </div>

        {/* 4. FOOTER NOTE */}
        <p className="text-center text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          *Capacity represents the total number of licensed spots approved by the Ministry, not current vacancies.
        </p>

      </div>
    </div>
  )
}

// UI Sub-components
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
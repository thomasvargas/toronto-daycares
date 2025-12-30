'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

export default function DaycareDetails() {
  const { id } = useParams()
  const router = useRouter()
  const [daycare, setDaycare] = useState(null)
  const [user, setUser] = useState(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Daycare Info
      const { data } = await supabase.from('daycares').select('*').eq('id', id).single()
      setDaycare(data)

      // 2. Check User Session
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      // 3. Check if already saved
      if (session?.user && data) {
        const { data: savedData } = await supabase
          .from('saved_daycares')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('daycare_id', data.id)
          .single()
        
        if (savedData) setIsSaved(true)
      }
    }
    fetchData()
  }, [id])

  const handleSave = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isSaved) {
       alert("Already in your list!")
       return
    }

    const { error } = await supabase
      .from('saved_daycares')
      .insert([{ user_id: user.id, daycare_id: daycare.id }])

    if (!error) {
      setIsSaved(true)
      router.push('/dashboard') // Send them to dashboard to track it immediately
    }
  }

  if (!daycare) return <div className="p-12 text-center text-slate-400 bg-[#FDFBF7] min-h-screen">Loading details...</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      
      {/* --- HEADER (Matches Dashboard) --- */}
      <div className="bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative h-24 w-48 shrink-0 -my-4"> 
              <Link href="/">
                <Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority />
              </Link>
          </div>
          <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  ← Back to Map
              </Link>
              {user && (
                <Link href="/dashboard" className="bg-yellow-400 text-slate-900 px-5 py-2 rounded-full font-bold shadow-sm hover:bg-yellow-300">
                  My Dashboard
                </Link>
              )}
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          
          {/* TITLE SECTION */}
          <div className="p-8 border-b border-stone-100 bg-stone-50">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">{daycare.name}</h1>
                    <p className="text-slate-500 text-lg mt-2">{daycare.address}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 text-center shadow-sm">
                     <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Type</span>
                     <span className="font-bold text-slate-900">{daycare.type}</span>
                </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {daycare.accepts_infant && <Badge color="blue">Infant (0-18m)</Badge>}
              {daycare.accepts_toddler && <Badge color="green">Toddler (18m-2.5y)</Badge>}
              {daycare.is_cwelcc_participant && <Badge color="yellow">$10/Day Program</Badge>}
              {daycare.has_subsidy && <Badge color="purple">Subsidies Available</Badge>}
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* SAVE BUTTON */}
                <button 
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${isSaved ? 'bg-green-100 text-green-700 cursor-default' : 'bg-slate-900 text-white hover:scale-[1.02]'}`}
                >
                  {isSaved ? '✓ Saved to List' : '+ Save to Shortlist'}
                </button>

                {/* CALL BUTTON */}
                <a 
                  href={`tel:${daycare.phone}`}
                  className="w-full bg-white border-2 border-slate-100 text-slate-700 py-4 rounded-xl font-bold text-lg hover:border-blue-400 hover:text-blue-600 transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>📞 Call Now</span>
                </a>
             </div>

             <div className="space-y-6">
                <InfoRow label="Phone" value={daycare.phone} />
                <InfoRow label="Operator" value={daycare.operator} />
                <InfoRow label="Capacity" value={`${daycare.total_capacity} Children`} />
             </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    purple: "bg-purple-100 text-purple-700"
  }
  return (
    <span className={`${colors[color]} px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide`}>
      {children}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex border-b border-stone-100 pb-2">
      <span className="w-32 font-bold text-slate-400 uppercase text-xs tracking-wide pt-1">{label}</span>
      <span className="flex-1 font-medium text-slate-900">{value || 'N/A'}</span>
    </div>
  )
}
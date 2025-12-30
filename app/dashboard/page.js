'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchSaved() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('saved_daycares')
        .select(`
          id,
          contacted,
          contacted_date,
          on_waitlist,
          follow_up_date,
          notes,
          daycares (
            id,
            name,
            address,
            phone,
            type
          )
        `)
        .order('id', { ascending: false })
      
      if (error) console.error('Error:', error)
      else setSavedItems(data || [])
      
      setLoading(false)
    }
    fetchSaved()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const removeItem = async (idToDelete) => {
    const { error } = await supabase
      .from('saved_daycares')
      .delete()
      .eq('id', idToDelete)

    if (error) {
      alert('Error removing item')
    } else {
      setSavedItems(current => current.filter(item => item.id !== idToDelete))
    }
  }

  // --- STATS CALCULATIONS ---
  const totalSaved = savedItems.length
  const totalContacted = savedItems.filter(i => i.contacted).length
  const totalWaitlisted = savedItems.filter(i => i.on_waitlist).length
  
  const today = new Date().toISOString().split('T')[0]
  const followUpsDue = savedItems.filter(i => i.follow_up_date && i.follow_up_date <= today).length

  if (loading) return <div className="p-12 text-center text-slate-400 bg-[#FDFBF7] min-h-screen pt-20">Loading your dashboard...</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      
      {/* --- IDENTICAL HEADER TO HOMEPAGE --- */}
      <div className="bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* LEFT: LOGO */}
          <div className="relative h-32 w-64 shrink-0 -my-4"> 
              <Link href="/">
                <Image 
                    src="/logo.png" 
                    alt="Lola's List Logo" 
                    fill
                    className="object-contain mix-blend-multiply" 
                    priority
                />
              </Link>
          </div>

          {/* CENTER: DASHBOARD TITLE */}
          <div className="flex-1 w-full md:w-auto flex justify-center md:justify-start">
             <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center md:text-left">
                  My Dashboard
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1 text-center md:text-left">
                  Manage your applications & waitlists
                </p>
             </div>
          </div>
            
          {/* RIGHT: NAVIGATION ACTIONS */}
          <div className="shrink-0 flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 bg-yellow-400 text-slate-900 px-6 py-3 rounded-full hover:bg-yellow-300 hover:scale-105 transition-all cursor-pointer shadow-md font-bold">
                  <span>← Back to Map</span>
              </Link>
              
              <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-400 uppercase tracking-wide hover:text-red-500 transition-colors"
              >
                  Log Out
              </button>
          </div>

        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        {/* STATS WIDGET */}
        {savedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-900">My Progress Stats</h2>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-slate-900">{totalSaved}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Saved Places</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-blue-600">{totalContacted}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Contacted</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-green-500">{totalWaitlisted}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Waitlists</div>
               </div>
               <div className={`${followUpsDue > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-5 rounded-2xl border shadow-sm`}>
                  <div className={`text-4xl font-bold ${followUpsDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {followUpsDue}
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wide mt-1 ${followUpsDue > 0 ? 'text-red-400' : 'text-green-600'}`}>
                      {followUpsDue > 0 ? 'Follow-ups Due!' : 'All Caught Up'}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* LIST SECTION */}
        <div className="space-y-6">
          {savedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-slate-900">Your list is empty</h3>
              <p className="text-slate-500 text-sm mb-8 mt-2 max-w-xs mx-auto">Browse the map to find and save your favorite childcare centers.</p>
              <Link href="/" className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform inline-block">
                Browse Map
              </Link>
            </div>
          ) : (
            savedItems.map((item) => (
              <TrackerCard 
                key={item.id} 
                item={item} 
                onRemove={() => removeItem(item.id)}
                isOverdue={item.follow_up_date && item.follow_up_date <= today} 
              />
            ))
          )}
        </div>

      </div>
    </div>
  )
}

function TrackerCard({ item, onRemove, isOverdue }) {
  const [data, setData] = useState({
    contacted: item.contacted || false,
    contacted_date: item.contacted_date || '',
    on_waitlist: item.on_waitlist || false,
    follow_up_date: item.follow_up_date || '',
    notes: item.notes || ''
  })

  const updateField = async (field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
    const { error } = await supabase
      .from('saved_daycares')
      .update({ [field]: value })
      .eq('id', item.id)
    if (error) console.error('Save failed:', error)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow group ${isOverdue ? 'ring-2 ring-red-100 border-red-200' : 'border-stone-200'}`}>
      
      {/* TOP SECTION */}
      <div className="p-6 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {item.daycares.name}
          </h3>
          <p className="text-slate-500 text-sm mt-1 mb-3">{item.daycares.address}</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
              {item.daycares.type}
            </span>
            {item.daycares.phone && (
                <a href={`tel:${item.daycares.phone}`} className="text-blue-600 bg-blue-50 text-xs font-bold px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                📞 {item.daycares.phone}
                </a>
            )}
            {isOverdue && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">
                    ⚠ Follow Up Due
                </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
           <Link href={`/daycare/${item.daycares.id}`} className="text-xs font-bold text-center text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-lg transition-all">
             Details
           </Link>
           <button onClick={onRemove} className="text-xs font-bold text-red-400 hover:text-red-600 px-4 py-2 transition-colors">
             Remove
           </button>
        </div>
      </div>

      {/* TRACKER SECTION */}
      <div className="bg-slate-50 border-t-4 border-yellow-400 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.contacted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input type="checkbox" checked={data.contacted} onChange={(e) => updateField('contacted', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"/>
              Contacted?
            </label>
            {data.contacted && (
               <input type="date" value={data.contacted_date} onChange={(e) => updateField('contacted_date', e.target.value)} className="text-xs font-medium border-none bg-transparent text-blue-600 focus:ring-0 text-right p-0"/>
            )}
          </div>
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.on_waitlist ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
             <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input type="checkbox" checked={data.on_waitlist} onChange={(e) => updateField('on_waitlist', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"/>
              On Waitlist?
            </label>
          </div>
        </div>
        <div className="space-y-4">
           <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <span className={`text-xs font-bold uppercase shrink-0 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>Follow Up:</span>
              <input type="date" value={data.follow_up_date} onChange={(e) => updateField('follow_up_date', e.target.value)} className={`w-full text-sm font-bold border-none bg-transparent focus:ring-0 p-0 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}/>
           </div>
           
           {/* UPDATED: Added text-slate-900 to ensure text is dark black */}
           <textarea 
             placeholder="Add notes..." 
             value={data.notes} 
             onChange={(e) => updateField('notes', e.target.value)} 
             className="w-full text-sm text-slate-900 p-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-blue-400 focus:ring-1 bg-white resize-none h-24 transition-all placeholder:text-slate-400"
           />
        </div>
      </div>
    </div>
  )
}
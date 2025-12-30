'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchSaved() {
      // 1. Check Auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 2. Fetch Data (Including new columns)
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
        .order('id', { ascending: false }) // Newest on top
      
      if (error) console.error('Error:', error)
      else setSavedItems(data || [])
      
      setLoading(false)
    }
    fetchSaved()
  }, [router])

  // REMOVE FUNCTION
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

  if (loading) return <div className="p-12 text-center text-slate-400">Loading your list...</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* HEADER */}
      <div className="bg-white border-b border-stone-100 px-6 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Shortlist</h1>
            <p className="text-slate-500 text-sm mt-1">Track your applications</p>
          </div>
          <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
            + Add More
          </Link>
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        
        {savedItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <h3 className="text-lg font-bold text-slate-900">Your list is empty</h3>
            <Link href="/" className="mt-4 bg-yellow-400 text-slate-900 px-8 py-3 rounded-full font-bold shadow-md inline-block">
              Browse Map
            </Link>
          </div>
        ) : (
          savedItems.map((item) => (
            <TrackerCard 
              key={item.id} 
              item={item} 
              onRemove={() => removeItem(item.id)} 
            />
          ))
        )}
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: HANDLES THE INPUTS & SAVING ---
function TrackerCard({ item, onRemove }) {
  // Local state for the inputs (so typing is fast)
  const [data, setData] = useState({
    contacted: item.contacted || false,
    contacted_date: item.contacted_date || '',
    on_waitlist: item.on_waitlist || false,
    follow_up_date: item.follow_up_date || '',
    notes: item.notes || ''
  })

  // THE AUTO-SAVE MAGIC
  // This function runs every time you change an input
  const updateField = async (field, value) => {
    // 1. Update screen instantly (optimistic UI)
    setData(prev => ({ ...prev, [field]: value }))

    // 2. Send to Supabase silently
    const { error } = await supabase
      .from('saved_daycares')
      .update({ [field]: value })
      .eq('id', item.id)

    if (error) console.error('Save failed:', error)
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      
      {/* TOP SECTION: INFO */}
      <div className="p-6 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{item.daycares.name}</h3>
          <p className="text-slate-500 text-sm mt-1">{item.daycares.address}</p>
          <div className="mt-2 flex gap-2">
            <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-1 rounded">
              {item.daycares.type}
            </span>
            <a href={`tel:${item.daycares.phone}`} className="text-blue-600 text-xs font-bold px-2 py-1 hover:underline">
              📞 {item.daycares.phone || 'No phone'}
            </a>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
           <Link href={`/daycare/${item.daycares.id}`} className="text-xs font-bold text-center bg-slate-50 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100">
             View Details
           </Link>
           <button onClick={onRemove} className="text-xs font-bold text-red-400 px-3 py-1.5 hover:text-red-600">
             Remove
           </button>
        </div>
      </div>

      {/* BOTTOM SECTION: TRACKER (The "Spreadsheet" Part) */}
      <div className="bg-yellow-50/50 border-t border-yellow-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* COLUMN 1: STATUS */}
        <div className="space-y-3">
          {/* Contacted Checkbox */}
          <div className="flex items-center justify-between bg-white p-2 rounded border border-yellow-100">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.contacted} 
                onChange={(e) => updateField('contacted', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              Contacted?
            </label>
            {data.contacted && (
               <input 
                 type="date" 
                 value={data.contacted_date}
                 onChange={(e) => updateField('contacted_date', e.target.value)}
                 className="text-xs border-none bg-transparent text-slate-500 focus:ring-0 text-right"
               />
            )}
          </div>

          {/* Waitlist Checkbox */}
          <div className="flex items-center justify-between bg-white p-2 rounded border border-yellow-100">
             <label className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={data.on_waitlist} 
                onChange={(e) => updateField('on_waitlist', e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              On Waitlist?
            </label>
          </div>
        </div>

        {/* COLUMN 2: FOLLOW UP & NOTES */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 bg-white p-2 rounded border border-yellow-100">
              <span className="text-xs font-bold text-slate-400 uppercase">Next Follow Up:</span>
              <input 
                type="date" 
                value={data.follow_up_date}
                onChange={(e) => updateField('follow_up_date', e.target.value)}
                className="flex-1 text-sm border-none bg-transparent focus:ring-0 p-0 text-slate-700"
              />
           </div>

           <textarea 
             placeholder="Add notes (e.g. 'Spoke to Sarah, tour scheduled')..."
             value={data.notes}
             onChange={(e) => updateField('notes', e.target.value)}
             className="w-full text-sm p-2 rounded border border-yellow-100 focus:border-blue-300 focus:ring-0 bg-white resize-none h-20"
           />
        </div>

      </div>
    </div>
  )
}
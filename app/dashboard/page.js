'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image' // Added for the mini logo
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

  if (loading) return <div className="p-12 text-center text-slate-400 bg-[#FDFBF7] min-h-screen pt-20">Loading your list...</div>

  return (
    // BRANDING FIX: Main background matches homepage
    <div className="min-h-screen bg-[#FDFBF7]">
      
      {/* BRANDING FIX: Header matches homepage color */}
      <div className="bg-[#FDFBF7] border-b border-stone-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          
          {/* Header Title + Mini Logo */}
          <div className="flex items-center gap-3">
             {/* Mini Logo for continuity */}
             <div className="relative h-10 w-10 shrink-0">
               <Image 
                 src="/logo.png" 
                 alt="Logo" 
                 fill
                 className="object-contain mix-blend-multiply"
               />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900">My Shortlist</h1>
                <p className="text-slate-500 text-xs font-medium">Track your applications</p>
             </div>
          </div>

          {/* BRANDING FIX: Button is now Lola Yellow */}
          <Link href="/" className="text-sm font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-300 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all">
            + Add More
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {savedItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Your list is empty</h3>
            <p className="text-slate-500 text-sm mb-6 mt-1">Start browsing to build your list.</p>
            <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform inline-block">
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

function TrackerCard({ item, onRemove }) {
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
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      
      {/* TOP SECTION: INFO (Clean White) */}
      <div className="p-5 sm:p-6 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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
          </div>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
           <Link href={`/daycare/${item.daycares.id}`} className="text-xs font-bold text-center text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all">
             Details
           </Link>
           <button onClick={onRemove} className="text-xs font-bold text-red-400 hover:text-red-600 px-3 py-1.5 transition-colors">
             Remove
           </button>
        </div>
      </div>

      {/* BOTTOM SECTION: TRACKER (High Contrast / Branded) */}
      {/* Changed background to white, but added a top border in Lola Yellow */}
      <div className="bg-slate-50 border-t-4 border-yellow-400 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* COLUMN 1: CHECKBOXES */}
        <div className="space-y-3">
          
          {/* Contacted */}
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.contacted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input 
                type="checkbox" 
                checked={data.contacted} 
                onChange={(e) => updateField('contacted', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              Contacted?
            </label>
            {data.contacted && (
               <input 
                 type="date" 
                 value={data.contacted_date}
                 onChange={(e) => updateField('contacted_date', e.target.value)}
                 className="text-xs font-medium border-none bg-transparent text-blue-600 focus:ring-0 text-right p-0"
               />
            )}
          </div>

          {/* Waitlist */}
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.on_waitlist ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
             <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input 
                type="checkbox" 
                checked={data.on_waitlist} 
                onChange={(e) => updateField('on_waitlist', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              On Waitlist?
            </label>
          </div>
        </div>

        {/* COLUMN 2: NOTES & DATES */}
        <div className="space-y-3">
           <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Follow Up:</span>
              <input 
                type="date" 
                value={data.follow_up_date}
                onChange={(e) => updateField('follow_up_date', e.target.value)}
                className="w-full text-sm font-bold border-none bg-transparent focus:ring-0 p-0 text-slate-700"
              />
           </div>

           <textarea 
             placeholder="Add notes..."
             value={data.notes}
             onChange={(e) => updateField('notes', e.target.value)}
             className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-blue-400 focus:ring-1 bg-white resize-none h-20 transition-all placeholder:text-slate-400"
           />
        </div>

      </div>
    </div>
  )
}
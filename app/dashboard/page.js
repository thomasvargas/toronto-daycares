'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-stone-100 text-stone-400">Loading Map...</div>
})

export default function Dashboard() {
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  const [showSettings, setShowSettings] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const router = useRouter()

  async function fetchSaved() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)

    const { data, error } = await supabase
      .from('saved_daycares')
      .select(`
        id,
        contacted,
        contacted_date,
        on_waitlist,
        follow_up_date,
        notes,
        daycares (*) 
      `)
      .order('id', { ascending: false })
    
    if (error) {
      console.error('Error fetching dashboard:', error) 
    } else {
      setSavedItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSaved()
  }, [router])

  const downloadCSV = () => {
    const headers = ['Name', 'Address', 'Phone', 'Type', 'Contacted?', 'Waitlisted?', 'Follow Up Date', 'Notes']
    const rows = savedItems.map(item => [
      item.daycares.name,
      item.daycares.address,
      item.daycares.phone,
      item.daycares.type,
      item.contacted ? 'Yes' : 'No',
      item.on_waitlist ? 'Yes' : 'No',
      item.follow_up_date || '',
      `"${item.notes || ''}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "my_daycare_shortlist.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return setPasswordMsg("Password must be 6+ chars")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPasswordMsg("Error: " + error.message)
    else {
      setPasswordMsg("Password updated successfully!")
      setNewPassword('')
      setTimeout(() => setShowSettings(false), 2000)
    }
  }

  const removeItem = async (idToDelete) => {
    const { error } = await supabase
      .from('saved_daycares')
      .delete()
      .eq('id', idToDelete)
    if (error) alert('Error removing item')
    else setSavedItems(current => current.filter(item => item.id !== idToDelete))
  }

  // --- STATS ---
  const totalSaved = savedItems.length
  const totalContacted = savedItems.filter(i => i.contacted).length
  const totalWaitlisted = savedItems.filter(i => i.on_waitlist).length
  
  const today = new Date().toISOString().split('T')[0]
  const followUpsDue = savedItems.filter(i => i.follow_up_date && i.follow_up_date <= today).length

  const mapData = savedItems.map(item => item.daycares)

  if (loading && savedItems.length === 0) return <div className="p-12 text-center text-slate-400 bg-[#FDFBF7] min-h-screen pt-20">Loading...</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* HEADER */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-4 py-3 sticky top-0">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative h-24 w-64 shrink-0 -my-4"> 
              <Link href="/">
                <Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority />
              </Link>
            </div>
            <div className="flex-1 text-center lg:text-left">
               <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
               <p className="text-xs text-slate-500 font-medium">Manage your applications</p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
               <button onClick={() => setShowSettings(!showSettings)} className="text-sm font-bold text-slate-500 hover:text-slate-900 bg-white border border-stone-200 px-4 py-2 rounded-lg shadow-sm">
                 {showSettings ? 'Close Settings' : '⚙️ Settings'}
               </button>
               <Link href="/" className="text-sm font-bold bg-yellow-400 text-slate-900 px-5 py-2 rounded-full hover:bg-yellow-300 shadow-sm whitespace-nowrap">
                   ← Back to Map
               </Link>
            </div>
        </div>
      </div>

      {/* SETTINGS */}
      {showSettings && (
        <div className="bg-stone-100 border-b border-stone-200 p-6 animate-in slide-in-from-top-4">
           <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Account Settings</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Update Password</label>
                    <input type="password" placeholder="New password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                 </div>
                 {passwordMsg && <p className={`text-sm font-bold ${passwordMsg.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{passwordMsg}</p>}
                 <div className="flex gap-3">
                    <button type="submit" className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-700">Save Password</button>
                    <button type="button" onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="text-red-500 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-lg">Log Out</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* STATS */}
        {savedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">My Progress</h2>
                  <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <div className="flex gap-2">
                   <button onClick={fetchSaved} className="text-xs font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1">↻ Refresh</button>
                   <button onClick={downloadCSV} className="text-xs font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1">⬇ Download CSV</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-slate-900">{totalSaved}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Saved</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-blue-600">{totalContacted}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Contacted</div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="text-4xl font-bold text-green-500">{totalWaitlisted}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Waitlists</div>
               </div>
               
               {/* UPDATED: Clearer Label */}
               <div className={`${followUpsDue > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-5 rounded-2xl border shadow-sm`}>
                  <div className={`text-4xl font-bold ${followUpsDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {followUpsDue}
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wide mt-1 ${followUpsDue > 0 ? 'text-red-400' : 'text-green-600'}`}>
                      Follow-ups Due
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* MAP TOGGLE */}
        {savedItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
             <button onClick={() => setShowMap(!showMap)} className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition-colors">
                <span className="font-bold text-slate-700 flex items-center gap-2">🗺️ View My Shortlist on Map</span>
                <span className="text-slate-400 text-sm">{showMap ? 'Hide Map ▲' : 'Show Map ▼'}</span>
             </button>
             {showMap && <div className="h-96 w-full relative"><Map daycares={mapData} /></div>}
          </div>
        )}

        {/* LIST */}
        <div className="space-y-6">
          {savedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-slate-900">Your list is empty</h3>
              <p className="text-slate-500 text-sm mb-8 mt-2 max-w-xs mx-auto">Browse the map to find and save your favorite childcare centers.</p>
              <Link href="/" className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform inline-block">Browse Map</Link>
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
    const { error } = await supabase.from('saved_daycares').update({ [field]: value }).eq('id', item.id)
    if (error) console.error('Save failed:', error)
  }

  // NEW: Helper to clear date
  const clearFollowUp = () => {
    updateField('follow_up_date', null)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow group ${isOverdue ? 'ring-2 ring-red-100 border-red-200' : 'border-stone-200'}`}>
      
      {/* TOP: INFO */}
      <div className="p-6 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.daycares.name}</h3>
          <p className="text-slate-500 text-sm mt-1 mb-3">{item.daycares.address}</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{item.daycares.type}</span>
            {item.daycares.phone && <a href={`tel:${item.daycares.phone}`} className="text-blue-600 bg-blue-50 text-xs font-bold px-2 py-1 rounded hover:bg-blue-100 transition-colors">📞 {item.daycares.phone}</a>}
            {isOverdue && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">⚠ Follow Up Due</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
           <Link href={`/daycare/${item.daycares.id}`} className="text-xs font-bold text-center text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-lg transition-all">Details</Link>
           <button onClick={onRemove} className="text-xs font-bold text-red-400 hover:text-red-600 px-4 py-2 transition-colors">Remove</button>
        </div>
      </div>

      {/* BOTTOM: TRACKER */}
      <div className="bg-slate-50 border-t-4 border-yellow-400 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.contacted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input type="checkbox" checked={data.contacted} onChange={(e) => updateField('contacted', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"/>
              Contacted?
            </label>
            {data.contacted && <input type="date" value={data.contacted_date} onChange={(e) => updateField('contacted_date', e.target.value)} className="text-xs font-medium border-none bg-transparent text-blue-600 focus:ring-0 text-right p-0"/>}
          </div>
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.on_waitlist ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
             <label className="text-sm font-bold text-slate-700 flex items-center gap-3 cursor-pointer select-none w-full">
              <input type="checkbox" checked={data.on_waitlist} onChange={(e) => updateField('on_waitlist', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"/>
              On Waitlist?
            </label>
          </div>
        </div>

        {/* UPDATED: Follow Up Section with "Clear" Button */}
        <div className="space-y-4">
           <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <span className={`text-xs font-bold uppercase shrink-0 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>Follow Up:</span>
              <input type="date" value={data.follow_up_date || ''} onChange={(e) => updateField('follow_up_date', e.target.value)} className={`flex-1 text-sm font-bold border-none bg-transparent focus:ring-0 p-0 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}/>
              
              {/* THE "DONE" BUTTON */}
              {data.follow_up_date && (
                <button 
                  onClick={clearFollowUp}
                  className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2 py-1 rounded"
                  title="Mark as done (clear date)"
                >
                  ✓ Done
                </button>
              )}
           </div>
           
           <textarea placeholder="Add notes..." value={data.notes} onChange={(e) => updateField('notes', e.target.value)} className="w-full text-sm text-slate-900 p-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-blue-400 focus:ring-1 bg-white resize-none h-24 transition-all placeholder:text-slate-400"/>
        </div>
      </div>
    </div>
  )
}
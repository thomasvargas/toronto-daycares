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
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('detailed')

  const [homeAddress, setHomeAddress] = useState('')
  const [homeCoords, setHomeCoords] = useState(null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressMsg, setAddressMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const router = useRouter()

  async function fetchSaved() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUser(session.user)
    
    if (session.user.user_metadata?.address) {
      setHomeAddress(session.user.user_metadata.address)
      setHomeCoords(session.user.user_metadata.coords)
    }

    const { data, error } = await supabase
      .from('saved_daycares')
      .select(`id, contacted, contacted_date, contact_name, on_waitlist, follow_up_date, notes, daycares (*)`)
      .order('id', { ascending: false })
    
    if (error) console.error(error) 
    else setSavedItems(data || [])
    
    setLoading(false)
  }

  useEffect(() => { fetchSaved() }, [router])

  // NEW: Global Sign Out Handler
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDistance = (lat, lon) => {
    if (!homeCoords || !lat || !lon) return null
    const R = 6371
    const dLat = (lat - homeCoords.lat) * (Math.PI / 180)
    const dLon = (lon - homeCoords.lon) * (Math.PI / 180)
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(homeCoords.lat*(Math.PI/180)) * Math.cos(lat*(Math.PI/180)) * Math.sin(dLon/2)*Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return parseFloat((R * c).toFixed(1))
  }

  const getSortedItems = () => {
    let items = [...savedItems]
    if (sortBy === 'distance' && homeCoords) {
      items.sort((a, b) => {
        const distA = getDistance(a.daycares.lat || a.daycares.latitude, a.daycares.lon || a.daycares.longitude) || 9999
        const distB = getDistance(b.daycares.lat || b.daycares.latitude, b.daycares.lon || b.daycares.longitude) || 9999
        return distA - distB
      })
    } else if (sortBy === 'follow_up') {
      items.sort((a, b) => {
        if (!a.follow_up_date) return 1
        if (!b.follow_up_date) return -1
        return new Date(a.follow_up_date) - new Date(b.follow_up_date)
      })
    } else {
      items.sort((a, b) => b.id - a.id)
    }
    return items
  }

  const sortedItems = getSortedItems()

  const handleSaveAddress = async (e) => {
    e.preventDefault(); setIsSavingAddress(true); setAddressMsg('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${homeAddress} Toronto Canada`)
      const data = await res.json()
      if (!data || !data.length) { setAddressMsg("❌ Address not found"); setIsSavingAddress(false); return }
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
      await supabase.auth.updateUser({ data: { address: homeAddress, coords } })
      setHomeCoords(coords); setAddressMsg("✅ Saved!")
    } catch(e) { console.error(e) }
    setIsSavingAddress(false)
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Contacted?', 'Contact Person', 'Waitlisted?', 'Follow Up', 'Notes']
    const rows = savedItems.map(item => [
      item.daycares.name, item.daycares.phone, 
      item.contacted ? 'Yes' : 'No', 
      `"${item.contact_name || ''}"`,
      item.on_waitlist ? 'Yes' : 'No', 
      item.follow_up_date || '', `"${item.notes || ''}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "daycare_list.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault(); if (newPassword.length < 6) return setPasswordMsg("Password must be 6+ chars")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPasswordMsg("Error: " + error.message); else { setPasswordMsg("Success!"); setNewPassword(''); setTimeout(()=>setShowSettings(false), 2000) }
  }

  const removeItem = async (id) => { if(confirm("Remove?")) { await supabase.from('saved_daycares').delete().eq('id', id); setSavedItems(p=>p.filter(i=>i.id!==id)) } }

  // Stats
  const totalSaved = savedItems.length
  const totalContacted = savedItems.filter(i => i.contacted).length
  const totalWaitlisted = savedItems.filter(i => i.on_waitlist).length
  const today = new Date().toISOString().split('T')[0]
  const followUpsDue = savedItems.filter(i => i.follow_up_date && i.follow_up_date <= today).length
  const mapData = savedItems.map(item => item.daycares).filter(d => d && (d.lat || d.latitude))

  if (loading && savedItems.length === 0) return <div className="p-12 text-center text-slate-400 bg-[#FDFBF7] min-h-screen pt-20">Loading...</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* HEADER */}
      <div className="w-full relative z-10 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-4 py-3 sticky top-0">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative h-24 w-64 shrink-0 -my-4"> 
              <Link href="/"><Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority /></Link>
            </div>
            <div className="flex-1 text-center lg:text-left"><h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1></div>
            <div className="shrink-0 flex items-center gap-3">
               {/* NEW: Sign Out Button */}
               <button onClick={handleSignOut} className="text-sm font-bold text-slate-400 hover:text-red-500 px-3 transition-colors">Sign Out</button>
               
               <button onClick={() => setShowSettings(!showSettings)} className="text-sm font-bold text-slate-500 hover:text-slate-900 bg-white border border-stone-200 px-4 py-2 rounded-lg shadow-sm">{showSettings ? 'Close' : '⚙️ Settings'}</button>
               <Link href="/" className="text-sm font-bold bg-yellow-400 text-slate-900 px-5 py-2 rounded-full hover:bg-yellow-300 shadow-sm whitespace-nowrap">← Back to Map</Link>
            </div>
        </div>
      </div>

      {/* SETTINGS */}
      {showSettings && (
        <div className="bg-stone-100 border-b border-stone-200 p-6 animate-in slide-in-from-top-4">
           <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-xl shadow-sm">
              <div>
                 <h3 className="font-bold text-lg mb-4 text-slate-900">📍 Home Location</h3>
                 <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="flex gap-2"><input type="text" placeholder="e.g. 123 Queen St W..." value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm"/><button type="submit" disabled={isSavingAddress} className="bg-blue-600 text-white font-bold px-4 rounded-lg hover:bg-blue-700 text-sm">{isSavingAddress ? '...' : 'Save'}</button></div>
                    {addressMsg && <p className="text-xs font-bold text-slate-600">{addressMsg}</p>}
                 </form>
              </div>
              <div className="md:border-l md:border-stone-100 md:pl-8">
                  <h3 className="font-bold text-lg mb-4 text-slate-900">🔐 Security</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input type="password" placeholder="New password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                    {passwordMsg && <p className="text-xs font-bold text-slate-600">{passwordMsg}</p>}
                    <button type="submit" className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg">Update</button>
                  </form>
              </div>
           </div>
        </div>
      )}

      {/* CONTENT (Stats, Controls, List) */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8">
        
        {/* STATS */}
        {savedItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm"><div className="text-4xl font-bold text-slate-900">{totalSaved}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Saved</div></div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm"><div className="text-4xl font-bold text-blue-600">{totalContacted}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Contacted</div></div>
               <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm"><div className="text-4xl font-bold text-green-500">{totalWaitlisted}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Waitlists</div></div>
               <div className={`${followUpsDue > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-5 rounded-2xl border shadow-sm`}><div className={`text-4xl font-bold ${followUpsDue > 0 ? 'text-red-500' : 'text-green-600'}`}>{followUpsDue}</div><div className={`text-xs font-bold uppercase tracking-wide mt-1 ${followUpsDue > 0 ? 'text-red-400' : 'text-green-600'}`}>Follow-ups</div></div>
          </div>
        )}

        {/* CONTROLS */}
        {savedItems.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase">Sort by:</span>
               <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-stone-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400">
                 <option value="newest">Recently Added</option>
                 <option value="distance">Distance (Closest)</option>
                 <option value="follow_up">Urgent Follow-ups</option>
               </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMap(!showMap)} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-3 py-2 bg-white border border-stone-200 rounded-lg">{showMap ? 'Hide Map' : 'Show Map'}</button>
              <div className="flex bg-stone-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('detailed')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'detailed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Cards</button>
                <button onClick={() => setViewMode('compact')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'compact' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Rows</button>
              </div>
            </div>
          </div>
        )}

        {/* MAP */}
        {showMap && <div className="h-96 w-full rounded-2xl overflow-hidden shadow-sm border border-stone-200"><Map daycares={mapData} userLocation={homeCoords} /></div>}

        {/* LIST */}
        <div className="space-y-6">
          {savedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300"><div className="text-5xl mb-4">📍</div><h3 className="text-xl font-bold text-slate-900">List Empty</h3><Link href="/" className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform inline-block mt-4">Browse Map</Link></div>
          ) : (
            <>
              {viewMode === 'detailed' && sortedItems.map((item) => (
                <TrackerCard key={item.id} item={item} onRemove={() => removeItem(item.id)} isOverdue={item.follow_up_date && item.follow_up_date <= today} distance={getDistance(item.daycares.lat || item.daycares.latitude, item.daycares.lon || item.daycares.longitude)}/>
              ))}
              {viewMode === 'compact' && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-stone-50 text-xs uppercase font-bold text-slate-400"><tr><th className="px-6 py-4">Daycare</th><th className="px-6 py-4 text-center">Contacted?</th><th className="px-6 py-4 text-center">Waitlisted?</th><th className="px-6 py-4">Follow Up</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-stone-100">{sortedItems.map((item) => (<CompactRow key={item.id} item={item} onRemove={() => removeItem(item.id)} isOverdue={item.follow_up_date && item.follow_up_date <= today} distance={getDistance(item.daycares.lat || item.daycares.latitude, item.daycares.lon || item.daycares.longitude)}/>))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TrackerCard({ item, onRemove, isOverdue, distance }) {
  const [data, setData] = useState({ 
    contacted: item.contacted || false, 
    contacted_date: item.contacted_date || '', 
    contact_name: item.contact_name || '', 
    on_waitlist: item.on_waitlist || false, 
    follow_up_date: item.follow_up_date || '', 
    notes: item.notes || '' 
  })
  const updateField = async (f, v) => { setData(p=>({...p,[f]:v})); await supabase.from('saved_daycares').update({[f]:v}).eq('id',item.id) }
  const clearFollowUp = () => updateField('follow_up_date', null)
  const borderClass = data.on_waitlist ? 'ring-2 ring-green-400 border-green-500' : isOverdue ? 'ring-2 ring-red-100 border-red-200' : 'border-stone-200'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow group ${borderClass}`}>
      <div className="p-6 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.daycares.name}</h3>
          <div className="flex items-center gap-2 mt-1 mb-3"><p className="text-slate-500 text-sm">{item.daycares.address}</p>{distance && <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">📍 {distance} km</span>}</div>
          <div className="flex flex-wrap gap-2 mb-3">
             {item.daycares.website && <a href={item.daycares.website} target="_blank" className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">🌐 Website</a>}
             {item.daycares.email && <a href={`mailto:${item.daycares.email}`} className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">✉️ Email</a>}
             {item.daycares.phone && <a href={`tel:${item.daycares.phone}`} className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">📞 Call</a>}
          </div>
          {data.on_waitlist && <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">🎉 On Waitlist!</span>}
          {isOverdue && <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded ml-2">⚠ Follow Up Due</span>}
        </div>
        <div className="flex flex-col gap-2 shrink-0"><Link href={`/daycare/${item.daycares.id}`} className="text-xs font-bold text-center text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-lg transition-all">Details</Link><button onClick={onRemove} className="text-xs font-bold text-red-400 hover:text-red-600 px-4 py-2 transition-colors">Remove</button></div>
      </div>

      <div className={`bg-slate-50 border-t-4 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 ${data.on_waitlist ? 'border-green-400' : 'border-yellow-400'}`}>
        <div className="space-y-4">
          <div className={`p-3 rounded-xl border transition-all ${data.contacted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
               <label className="text-sm font-bold text-slate-700 flex items-center gap-3 w-full cursor-pointer"><input type="checkbox" checked={data.contacted} onChange={(e) => updateField('contacted', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"/> Contacted?</label>
               {data.contacted && <input type="date" value={data.contacted_date} onChange={(e) => updateField('contacted_date', e.target.value)} className="text-xs font-medium border-none bg-transparent text-blue-600 focus:ring-0 text-right p-0"/>}
            </div>
            {data.contacted && (
               <div className="mt-3 pt-3 border-t border-blue-200/50">
                  <input type="text" placeholder="Who did you speak to? (e.g. Sarah)" value={data.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} className="w-full text-xs text-slate-700 bg-white/50 border border-blue-100 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-blue-300"/>
               </div>
            )}
          </div>
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${data.on_waitlist ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}>
             <label className="text-sm font-bold text-slate-700 flex items-center gap-3 w-full cursor-pointer"><input type="checkbox" checked={data.on_waitlist} onChange={(e) => updateField('on_waitlist', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"/> On Waitlist?</label>
          </div>
        </div>
        <div className="space-y-4">
           <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <span className={`text-xs font-bold uppercase shrink-0 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>Follow Up:</span>
              <input type="date" value={data.follow_up_date || ''} onChange={(e) => updateField('follow_up_date', e.target.value)} className={`flex-1 text-sm font-bold border-none bg-transparent focus:ring-0 p-0 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}/>
              {data.follow_up_date && <button onClick={clearFollowUp} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2 py-1 rounded">✓ Done</button>}
           </div>
           <textarea placeholder="Notes..." value={data.notes} onChange={(e) => updateField('notes', e.target.value)} className="w-full text-sm text-slate-900 p-3 rounded-xl border border-gray-200 bg-white resize-none h-24"/>
        </div>
      </div>
    </div>
  )
}

function CompactRow({ item, onRemove, isOverdue, distance }) {
  const [data, setData] = useState({ contacted: item.contacted || false, on_waitlist: item.on_waitlist || false, follow_up_date: item.follow_up_date || '' })
  const updateField = async (f, v) => { setData(p=>({...p,[f]:v})); await supabase.from('saved_daycares').update({[f]:v}).eq('id',item.id) }
  const clearFollowUp = () => updateField('follow_up_date', null)
  const rowClass = data.on_waitlist ? 'bg-green-50/50' : isOverdue ? 'bg-red-50' : ''

  return (
    <tr className={`hover:bg-stone-50 transition-colors group ${rowClass}`}>
      <td className="px-6 py-4">
        <Link href={`/daycare/${item.daycares.id}`} className="font-bold text-slate-900 hover:text-blue-600 block">{item.daycares.name}</Link>
        <span className="text-xs text-slate-500">{item.daycares.address}</span>
        {distance && <div className="text-[10px] font-bold text-yellow-600 mt-1">📍 {distance} km away</div>}
      </td>
      <td className="px-6 py-4 text-center">
         <input type="checkbox" checked={data.contacted} onChange={(e) => updateField('contacted', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"/>
      </td>
      <td className="px-6 py-4 text-center">
         <div className={`inline-flex p-2 rounded-lg ${data.on_waitlist ? 'bg-green-100' : ''}`}>
             <input type="checkbox" checked={data.on_waitlist} onChange={(e) => updateField('on_waitlist', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300 cursor-pointer"/>
         </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
           <input type="date" value={data.follow_up_date || ''} onChange={(e) => updateField('follow_up_date', e.target.value)} className={`text-xs font-bold border-stone-200 rounded p-1 ${isOverdue ? 'text-red-600 bg-red-100' : 'text-slate-600'}`}/>
           {data.follow_up_date && <button onClick={clearFollowUp} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">✓</button>}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button onClick={onRemove} className="text-xs font-bold text-red-400 hover:text-red-600 bg-white border border-stone-200 hover:border-red-200 px-3 py-1.5 rounded transition-colors">Remove</button>
      </td>
    </tr>
  )
}
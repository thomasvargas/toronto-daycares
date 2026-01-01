'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('../../../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-stone-100 animate-pulse flex items-center justify-center text-stone-400 text-sm font-bold rounded-xl">Loading Map...</div>
})

export default function DaycareDetails() {
  const { id } = useParams()
  const router = useRouter()
  const [daycare, setDaycare] = useState(null)
  const [user, setUser] = useState(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  const [claimData, setClaimData] = useState({ business_email: '', phone: '' })
  const [claimStatus, setClaimStatus] = useState('idle')
  const [reportData, setReportData] = useState({ type: 'Wrong Info', description: '' })
  const [reportStatus, setReportStatus] = useState('idle')

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('daycares').select('*').eq('id', id).single()
      setDaycare(data)
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    if (id) fetchData()
  }, [id])

  // NEW: Sign Out Handler
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setUser(null)
  }

  const handleSave = async () => {
    if (!user) return alert("Please sign in to save!")
    const { error } = await supabase.from('saved_daycares').insert([{ user_id: user.id, daycare_id: daycare.id }])
    if (!error) alert("Saved to your shortlist! ❤️")
    else alert("Already in your shortlist.")
  }

  const submitClaim = async (e) => {
    e.preventDefault(); setClaimStatus('submitting')
    const { error } = await supabase.from('claim_requests').insert([{ user_id: user.id, daycare_id: daycare.id, user_email: user.email, business_email: claimData.business_email, phone: claimData.phone }])
    if (error) { setClaimStatus('error'); alert(error.message) } else { setClaimStatus('success') }
  }

  const submitReport = async (e) => {
    e.preventDefault(); setReportStatus('submitting')
    const { error } = await supabase.from('reports').insert([{ daycare_id: daycare.id, issue_type: reportData.type, description: reportData.description }])
    if (error) { setReportStatus('error'); alert(error.message) } else { setReportStatus('success') }
  }

  if (!daycare) return <div className="p-20 text-center text-slate-400 bg-[#FDFBF7] min-h-screen pt-40">Loading Profile...</div>

  // Map Data Setup
  const mapData = [{ ...daycare, lat: daycare.lat || daycare.latitude, lon: daycare.lon || daycare.longitude, name: daycare.name }]

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      
      {/* HEADER (Exact Replica) */}
      <div className="w-full relative z-50 shrink-0 bg-[#FDFBF7] shadow-sm border-b border-stone-100 px-4 py-3 sticky top-0">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative h-24 w-64 shrink-0 -my-4"> 
              <Link href="/"><Image src="/logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" priority /></Link>
            </div>
            <div className="flex-1 text-center lg:text-left"></div>
            <div className="shrink-0 flex items-center gap-3">
               {/* NEW: Sign Out (visible if logged in) */}
               {user && <button onClick={handleSignOut} className="text-sm font-bold text-slate-400 hover:text-red-500 px-3 transition-colors">Sign Out</button>}

               <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 bg-white border border-stone-200 px-4 py-2 rounded-lg shadow-sm">← Back to Map</Link>
               {user ? (
                 <button onClick={handleSave} className="text-sm font-bold bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-700 shadow-sm whitespace-nowrap">Save ❤️</button>
               ) : (
                 <Link href="/login" className="text-sm font-bold bg-yellow-400 text-slate-900 px-5 py-2 rounded-full hover:bg-yellow-300 shadow-sm whitespace-nowrap">Log In to Save</Link>
               )}
            </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-yellow-400"></div>
                    <div className="mb-4 mt-2 flex items-center gap-3 flex-wrap">
                        {daycare.owner_id ? (
                           <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">✅ Verified Owner</span>
                        ) : (
                           <>
                             <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-500 text-xs font-bold px-3 py-1 rounded-full border border-stone-200">🏛️ City Data (Unclaimed)</span>
                             <button onClick={() => { if(!user) return alert("Please log in to claim."); setShowClaimModal(true) }} className="text-xs font-bold text-slate-400 hover:text-blue-600 underline decoration-dotted underline-offset-2 transition-colors">Is this your business? Claim Profile</button>
                           </>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{daycare.name}</h1>
                    <p className="text-lg text-slate-500 font-medium">{daycare.address}</p>
                    <div className="flex flex-wrap gap-2 mt-6">
                        <span className="px-4 py-1.5 bg-stone-100 rounded-lg text-sm font-bold text-stone-600">{daycare.type}</span>
                        {daycare.accepts_infant && <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">👶 Infants</span>}
                        {daycare.accepts_toddler && <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-bold">🧸 Toddlers</span>}
                        {daycare.is_cwelcc_participant && <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-bold">🇨🇦 $10/Day Program</span>}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span>ℹ️</span> About this Center</h2>
                    <p className="text-slate-600 leading-relaxed text-base">{daycare.owner_id ? "This profile is managed by the owner. Please contact them directly using the information provided for the most accurate details regarding availability, tour schedules, and programming." : "This listing was sourced from the City of Toronto Open Data dataset. While we strive for accuracy, information such as hours of operation and contact details may have changed. We recommend calling to confirm."}</p>
                </div>

                <div className="bg-white p-2 rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                    {(mapData[0].lat && mapData[0].lon) ? <div className="h-[400px] w-full relative z-0 rounded-2xl overflow-hidden block"><Map key={`map-${id}`} daycares={mapData} /></div> : <div className="h-48 flex items-center justify-center text-slate-400 bg-stone-50 rounded-2xl">Location data unavailable</div>}
                </div>
            </div>

            <div className="lg:col-span-4 relative">
                <div className="sticky top-28 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 relative group">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span>📞</span> Contact</h3>
                        <div className="space-y-4">
                            {daycare.phone ? (
                                <a href={`tel:${daycare.phone}`} className="flex items-center gap-4 p-4 rounded-xl bg-[#FDFBF7] hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all group/item">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-lg group-hover/item:scale-110 transition-transform">📞</div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p><p className="font-bold text-slate-900">{daycare.phone}</p></div>
                                </a>
                            ) : (<div className="p-4 rounded-xl bg-stone-50 opacity-50 border border-stone-100"><p className="text-sm font-bold text-stone-400">No phone listed</p></div>)}

                            {daycare.email ? (
                                <a href={`mailto:${daycare.email}`} className="flex items-center gap-4 p-4 rounded-xl bg-[#FDFBF7] hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all group/item">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-lg group-hover/item:scale-110 transition-transform">✉️</div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p><p className="font-bold text-slate-900 truncate max-w-[160px]">{daycare.email}</p></div>
                                </a>
                            ) : (<div className="p-4 rounded-xl bg-stone-50 opacity-50 border border-stone-100"><p className="text-sm font-bold text-stone-400">No email listed</p></div>)}

                            {daycare.website && (
                                <a href={daycare.website} target="_blank" className="flex items-center gap-4 p-4 rounded-xl bg-[#FDFBF7] hover:bg-green-50 hover:border-green-200 border border-transparent transition-all group/item">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-lg group-hover/item:scale-110 transition-transform">🌐</div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</p><p className="font-bold text-blue-600 underline decoration-2 underline-offset-2">Visit Site</p></div>
                                </a>
                            )}
                        </div>
                        <div className="mt-6 text-center border-t border-stone-100 pt-4"><button onClick={() => setShowReportModal(true)} className="text-xs font-bold text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mx-auto"><span>⚐</span> Report Incorrect Info</button></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 border border-stone-200">
              <h2 className="text-xl font-bold mb-2 text-slate-900">Claim {daycare.name}</h2>
              {claimStatus === 'success' ? (<div className="text-center py-6"><div className="text-5xl mb-4">🎉</div><h3 className="font-bold text-green-600 text-lg">Request Sent!</h3><button onClick={() => setShowClaimModal(false)} className="mt-6 bg-stone-100 text-stone-600 font-bold px-6 py-2 rounded-lg">Close</button></div>) : (<form onSubmit={submitClaim} className="space-y-4"><p className="text-sm text-slate-500 leading-relaxed">Please provide your official business contact info for verification.</p><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Business Phone</label><input required type="tel" value={claimData.phone} onChange={e => setClaimData({...claimData, phone: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-[#FDFBF7] focus:ring-2 focus:ring-yellow-400 outline-none transition-all"/></div><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Official Email</label><input required type="email" value={claimData.business_email} onChange={e => setClaimData({...claimData, business_email: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-[#FDFBF7] focus:ring-2 focus:ring-yellow-400 outline-none transition-all"/></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowClaimModal(false)} className="flex-1 text-slate-500 font-bold hover:bg-stone-100 py-3 rounded-xl">Cancel</button><button type="submit" disabled={claimStatus === 'submitting'} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-700">{claimStatus === 'submitting' ? '...' : 'Submit'}</button></div></form>)}
           </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 border border-stone-200">
              <h2 className="text-xl font-bold mb-2 text-red-600">Report Issue</h2>
              {reportStatus === 'success' ? (<div className="text-center py-6"><div className="text-5xl mb-4">👍</div><h3 className="font-bold text-slate-900">Thanks for the tip!</h3><button onClick={() => setShowReportModal(false)} className="mt-6 bg-stone-100 text-stone-600 font-bold px-6 py-2 rounded-lg">Close</button></div>) : (<form onSubmit={submitReport} className="space-y-4"><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Issue Type</label><select value={reportData.type} onChange={e => setReportData({...reportData, type: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-[#FDFBF7]"><option>Wrong Phone / Email</option><option>Permanently Closed</option><option>Wrong Address</option><option>Duplicate Listing</option></select></div><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Details</label><textarea rows="3" value={reportData.description} onChange={e => setReportData({...reportData, description: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-[#FDFBF7] resize-none"/></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowReportModal(false)} className="flex-1 text-slate-500 font-bold hover:bg-stone-100 py-3 rounded-xl">Cancel</button><button type="submit" disabled={reportStatus === 'submitting'} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700">{reportStatus === 'submitting' ? '...' : 'Send Report'}</button></div></form>)}
           </div>
        </div>
      )}
    </div>
  )
}
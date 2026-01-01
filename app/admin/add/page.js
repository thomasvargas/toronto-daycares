'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AddDaycare() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // --- 1. SET YOUR ADMIN EMAIL HERE ---
  const ADMIN_EMAIL = 'thomasvargasc@gmail.com' // <--- CHANGE THIS TO YOUR EMAIL!

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    type: 'Center', // Default
    accepts_infant: false,
    accepts_toddler: false,
    is_cwelcc_participant: true,
    has_subsidy: false,
    website: '',
    email: '',
    latitude: '',
    longitude: ''
  })

  // 2. SECURITY CHECK
  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Not logged in? Go to login.
        router.push('/login')
      } else if (session.user.email !== ADMIN_EMAIL) {
        // Logged in, but WRONG email? Kick them out.
        alert("⛔ Access Denied: You do not have admin permissions.")
        router.push('/') 
      } else {
        // Logged in AND email matches? Welcome.
        setSession(session)
      }
    }
    checkAdmin()
  }, [router])

  // 3. AUTO-GEOCODING (Get Lat/Lon from Address)
  const handleAddressBlur = async () => {
    if (!formData.address) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.address} Toronto Canada`)
      const data = await res.json()
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon
        }))
      }
    } catch (e) {
      console.error("Geocoding failed", e)
    }
  }

  // 4. SUBMIT TO SUPABASE
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('daycares')
      .insert([formData])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Daycare Added Successfully!')
      setFormData({ 
        ...formData, 
        name: '', address: '', phone: '', 
        latitude: '', longitude: '', website: '', email: '' 
      })
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  // Prevent flashing content before check finishes
  if (!session) return null

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Admin: Add New Daycare</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Name</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded-lg">
                <option>Center</option>
                <option>Home</option>
              </select>
            </div>
          </div>

          {/* ADDRESS + GEOCODER */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Address (Auto-fills Lat/Lon)</label>
            <input 
              required 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              onBlur={handleAddressBlur} // Triggers geocode on exit
              placeholder="e.g. 123 Queen St West"
              className="w-full border p-2 rounded-lg" 
            />
            <div className="flex gap-2 mt-2 text-xs text-slate-400">
              <span className={formData.latitude ? "text-green-600 font-bold" : ""}>Lat: {formData.latitude || '...'}</span>
              <span className={formData.longitude ? "text-green-600 font-bold" : ""}>Lon: {formData.longitude || '...'}</span>
            </div>
          </div>

          {/* TOGGLES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="accepts_infant" checked={formData.accepts_infant} onChange={handleChange} className="w-5 h-5 text-slate-900" />
              Infants
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="accepts_toddler" checked={formData.accepts_toddler} onChange={handleChange} className="w-5 h-5 text-slate-900" />
              Toddlers
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="is_cwelcc_participant" checked={formData.is_cwelcc_participant} onChange={handleChange} className="w-5 h-5 text-slate-900" />
              $10/Day
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="has_subsidy" checked={formData.has_subsidy} onChange={handleChange} className="w-5 h-5 text-slate-900" />
              Subsidy
            </label>
          </div>

          {/* CONTACT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded-lg" />
             <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 rounded-lg" />
             <input name="website" placeholder="Website URL" value={formData.website} onChange={handleChange} className="border p-2 rounded-lg" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-all"
          >
            {loading ? 'Saving...' : 'Add Daycare'}
          </button>

        </form>
      </div>
    </div>
  )
}
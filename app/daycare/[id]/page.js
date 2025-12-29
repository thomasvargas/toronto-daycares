'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient' // Note the extra ../ because we are deeper in folders
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function DaycareProfile() {
  const params = useParams()
  const [daycare, setDaycare] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDaycare() {
      // Fetch the single row where the ID matches the URL
      const { data, error } = await supabase
        .from('daycares')
        .select('*')
        .eq('id', params.id)
        .single() // We expect only one result

      if (error) console.error('Error:', error)
      else setDaycare(data)
      setLoading(false)
    }

    if (params.id) {
      fetchDaycare()
    }
  }, [params.id])

  if (loading) return <div className="p-8 text-center">Loading profile...</div>
  if (!daycare) return <div className="p-8 text-center">Daycare not found.</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Navigation Bar */}
      <div className="bg-white shadow p-4 mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Map</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{daycare.name}</h1>
          <p className="text-gray-600 text-lg">{daycare.address}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {daycare.is_cwelcc_participant && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200">
                $10/Day Program
              </span>
            )}
            {daycare.has_subsidy && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200">
                Subsidies Accepted
              </span>
            )}
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200">
              {daycare.type}
            </span>
          </div>
        </div>

        {/* Capacity Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Space & Capacity</h2>
          <div className="grid grid-cols-2 gap-4">
            
            <CapacityItem label="Infant (0-18m)" count={daycare.capacity_total} active={daycare.accepts_infant} />
            <CapacityItem label="Toddler (18m-2.5y)" count={daycare.capacity_total} active={daycare.accepts_toddler} />
            <CapacityItem label="Preschool (2.5y-4y)" count={daycare.capacity_total} active={daycare.accepts_preschool} />
            <CapacityItem label="Kindergarten (4y-6y)" count={daycare.capacity_total} active={daycare.accepts_kindergarten} />
            
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            *Note: "Count" represents total licensed capacity for the facility, not necessarily current vacancies.
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <p className="text-gray-700"><strong>Phone:</strong> {daycare.phone || "Not Listed"}</p>
        </div>

      </div>
    </div>
  )
}

// Simple helper component for the grid
function CapacityItem({ label, active }) {
  return (
    <div className={`p-3 rounded border ${active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
      <p className="font-semibold text-sm">{label}</p>
      <p className={`text-sm ${active ? 'text-green-700' : 'text-gray-400'}`}>
        {active ? "✅ Licensed" : "❌ Not Offered"}
      </p>
    </div>
  )
}
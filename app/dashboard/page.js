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
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 2. Fetch Saved Daycares AND the details (JOIN)
      const { data, error } = await supabase
        .from('saved_daycares')
        .select(`
          id,
          daycares (
            id,
            name,
            address,
            phone,
            type,
            rating
          )
        `)
      
      if (error) console.error('Error:', error)
      else setSavedItems(data || [])
      
      setLoading(false)
    }
    fetchSaved()
  }, [router])

  if (loading) return <div className="p-8 text-center text-slate-400">Loading your list...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">My Shortlist</h1>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            ← Back to Map
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {savedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-slate-500 mb-4">You haven't saved any daycares yet.</p>
            <Link href="/" className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
              Browse the Map
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/daycare/${item.daycares.id}`}
                className="block bg-white p-6 rounded-xl border border-gray-200 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.daycares.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{item.daycares.address}</p>
                    
                    <div className="flex gap-2 mt-3">
                       <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                         {item.daycares.type}
                       </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                       View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
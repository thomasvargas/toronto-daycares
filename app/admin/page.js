'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminHome() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // --- UPDATE WITH YOUR EMAIL ---
  const ADMIN_EMAIL = 'thomasvargasc@gmail.com' 

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If not logged in, go to login
      if (!session) {
        router.push('/login')
        return
      }

      // If logged in but wrong email, we let the render handle the message 
      // instead of redirecting instantly, which is easier for debugging.
      
      setSession(session)
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Admin Portal...</div>

  // Access Denied View
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-6 max-w-md">
          You are logged in as <span className="font-mono font-bold text-slate-700">{session?.user?.email}</span>, 
          but this page requires Admin permissions.
        </p>
        <Link href="/" className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors">
          Return Home
        </Link>
      </div>
    )
  }

  // Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center">👑 Admin Portal</h1>
        <p className="text-slate-500 text-center mb-10">Manage the Lola's List ecosystem.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Add Daycare */}
          <Link href="/admin/add" className="block group">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 hover:border-yellow-400 hover:shadow-md transition-all text-center h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📍</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Add Daycare</h2>
              <p className="text-slate-500 text-sm">Manually add new locations to the map.</p>
            </div>
          </Link>

          {/* Card 2: Review Claims */}
          <Link href="/admin/claims" className="block group">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 hover:border-blue-400 hover:shadow-md transition-all text-center h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✅</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Review Claims</h2>
              <p className="text-slate-500 text-sm">Approve or reject ownership requests.</p>
            </div>
          </Link>

          {/* Card 3: User Reports (NEW) */}
          <Link href="/admin/reports" className="block group">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 hover:border-red-400 hover:shadow-md transition-all text-center h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚩</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">User Reports</h2>
              <p className="text-slate-500 text-sm">Review flagged issues (wrong phone, closed, etc).</p>
            </div>
          </Link>

        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-slate-400 font-bold hover:text-slate-600 text-sm transition-colors">
            ← Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  )
}
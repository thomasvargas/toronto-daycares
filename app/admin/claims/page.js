'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ReviewClaims() {
  const [session, setSession] = useState(null)
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const ADMIN_EMAIL = 'thomasvargasc@gmail.com' // <--- UPDATE THIS

  // 1. SECURITY & DATA FETCH
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || session.user.email !== ADMIN_EMAIL) {
        alert("⛔ Access Denied")
        router.push('/')
        return
      }
      setSession(session)
      fetchClaims()
    }
    init()
  }, [router])

  async function fetchClaims() {
    // Fetch pending claims AND the daycare name
    const { data, error } = await supabase
      .from('claim_requests')
      .select(`
        *,
        daycares ( name, address )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setClaims(data || [])
    setLoading(false)
  }

  // 2. APPROVE LOGIC
  const handleApprove = async (claim) => {
    if (!confirm(`Approve claim for ${claim.daycares.name}?`)) return

    // A. Assign Owner to Daycare
    const { error: updateError } = await supabase
      .from('daycares')
      .update({ owner_id: claim.user_id })
      .eq('id', claim.daycare_id)

    if (updateError) {
      alert("Error updating daycare owner: " + updateError.message)
      return
    }

    // B. Mark Request as Approved
    await supabase
      .from('claim_requests')
      .update({ status: 'approved' })
      .eq('id', claim.id)

    alert("✅ Approved! User now owns this profile.")
    fetchClaims() // Refresh list
  }

  // 3. REJECT LOGIC
  const handleReject = async (id) => {
    if (!confirm("Reject this claim?")) return
    await supabase.from('claim_requests').update({ status: 'rejected' }).eq('id', id)
    fetchClaims()
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Review Claims</h1>
            <button onClick={() => router.push('/admin/add')} className="text-sm font-bold text-slate-500 hover:text-slate-900">
                Go to Add Daycare →
            </button>
        </div>

        {loading ? (
            <div className="text-center py-20 text-slate-400">Loading requests...</div>
        ) : claims.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-stone-300 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-bold text-slate-900">All caught up!</h3>
                <p className="text-slate-500 text-sm">No pending claims.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {claims.map((claim) => (
                    <div key={claim.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col md:flex-row justify-between gap-6">
                        
                        {/* INFO */}
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {claim.daycares?.name || 'Unknown Daycare'}
                            </h3>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Claimant Details:</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>📧 <strong>User Email:</strong> {claim.user_email}</li>
                                <li>🏢 <strong>Biz Email:</strong> {claim.business_email}</li>
                                <li>📞 <strong>Phone:</strong> {claim.phone}</li>
                            </ul>
                            <div className="text-xs text-slate-400 mt-2">Requested: {new Date(claim.created_at).toLocaleDateString()}</div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button 
                                onClick={() => handleReject(claim.id)}
                                className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => handleApprove(claim)}
                                className="px-6 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-lg shadow-sm transition-all"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
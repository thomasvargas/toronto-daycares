'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminReports() {
  const [session, setSession] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const ADMIN_EMAIL = 'thomasvargasc@gmail.com' // <--- UPDATE THIS

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== ADMIN_EMAIL) {
        alert("⛔ Access Denied")
        router.push('/')
        return
      }
      setSession(session)
      fetchReports()
    }
    init()
  }, [router])

  async function fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        daycares ( name, id )
      `)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setReports(data || [])
    setLoading(false)
  }

  const handleDismiss = async (id) => {
    if (!confirm("Dismiss this report?")) return
    await supabase.from('reports').delete().eq('id', id)
    fetchReports()
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">User Reports</h1>
            <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-slate-900">
                ← Admin Home
            </Link>
        </div>

        {loading ? (
            <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : reports.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-stone-300 text-center">
                <div className="text-4xl mb-4">👍</div>
                <h3 className="font-bold text-slate-900">No issues reported!</h3>
            </div>
        ) : (
            <div className="space-y-4">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col md:flex-row justify-between gap-6">
                        
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{report.issue_type}</span>
                                <span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                             </div>
                             <h3 className="font-bold text-slate-900">
                                <Link href={`/daycare/${report.daycares?.id}`} className="hover:underline hover:text-blue-600">
                                    {report.daycares?.name || 'Unknown Daycare'}
                                </Link>
                             </h3>
                             <p className="text-sm text-slate-600 bg-stone-50 p-3 rounded-lg border border-stone-100">
                                "{report.description || 'No details provided'}"
                             </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {/* In a real app, you might have an 'Edit Daycare' button here */}
                            <button 
                                onClick={() => handleDismiss(report.id)}
                                className="px-4 py-2 text-sm font-bold text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                            >
                                Dismiss
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
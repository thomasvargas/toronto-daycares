'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleAuth = async (e, type) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    let result
    if (type === 'signup') {
      result = await supabase.auth.signUp({ email, password })
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
    }

    const { error } = result

    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else {
      setIsError(false)
      setMessage(type === 'signup' ? 'Success! Account created. Logging you in...' : 'Welcome back!')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] px-4">
      
      {/* BRANDING: Big Logo */}
      <div className="relative h-40 w-80 mb-6">
        <Image 
            src="/logo.png" 
            alt="Lola's List" 
            fill
            className="object-contain mix-blend-multiply"
            priority
        />
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-stone-100 p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2 text-sm">Sign in to manage your childcare shortlist.</p>
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div className={`mb-6 p-3 text-sm rounded-xl font-bold text-center ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <form className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-slate-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all font-medium"
              placeholder="parent@example.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-slate-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {/* PRIMARY ACTION: Sign In (Yellow) */}
            <button
              onClick={(e) => handleAuth(e, 'signin')}
              disabled={loading}
              className="w-full bg-yellow-400 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-yellow-300 hover:scale-[1.02] transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            
            {/* SECONDARY ACTION: Sign Up (Ghost) */}
            <button
              onClick={(e) => handleAuth(e, 'signup')}
              disabled={loading}
              className="w-full bg-white text-slate-500 border-2 border-slate-100 py-3.5 rounded-xl font-bold hover:border-slate-300 hover:text-slate-700 transition-all disabled:opacity-50"
            >
              Create an Account
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
           <Link href="/" className="text-sm font-bold text-blue-500 hover:text-blue-700 hover:underline">
             ← Back to Map
           </Link>
        </div>

      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

    // FIXED: Call the functions directly to preserve "this" context
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome</h1>
          <p className="text-slate-500 mt-2">Sign in to save your favorite daycares.</p>
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div className={`mb-6 p-3 text-sm rounded-lg font-medium text-center ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="tom@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={(e) => handleAuth(e, 'signin')}
              disabled={loading}
              className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Sign In'}
            </button>
            <button
              onClick={(e) => handleAuth(e, 'signup')}
              disabled={loading}
              className="flex-1 bg-white text-slate-900 border border-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
           <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
             ← Back to Map
           </Link>
        </div>

      </div>
    </div>
  )
}
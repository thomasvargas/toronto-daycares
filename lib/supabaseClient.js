import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase Keys are missing!")
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // explicit instructions to save the user
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
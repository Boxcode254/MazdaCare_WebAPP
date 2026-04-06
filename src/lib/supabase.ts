import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

required.forEach((key) => {
  if (!import.meta.env[key]) {
    console.error(`Missing required env var: ${key}`)
  }
})

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

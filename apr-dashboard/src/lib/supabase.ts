import { createClient } from '@supabase/supabase-js'

export interface APRData {
  id: number
  date: string
  apr: number
  protocol: string
  pool_name: string
  created_at: string
}

export interface AerodromePool {
  id: number
  pool_name: string
  base_token_symbol: string
  base_token_volume: number | null
  base_token_fees: number | null
  base_token_tvl: number | null
  quote_token_symbol: string
  quote_token_volume: number | null
  quote_token_fees: number | null
  quote_token_tvl: number | null
  total_volume: number | null
  total_fees: number | null
  total_tvl: number | null
  apr: number | null
  scraped_at: string
  created_at: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Create client with placeholder values if env vars are missing
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if we have real credentials
export const hasValidCredentials = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
}

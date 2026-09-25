import { createClient } from '@supabase/supabase-js'

// Không cần sửa file này — chỉ cần điền đúng .env.local (xem README.md)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

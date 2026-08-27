import { createBrowserClient } from '@supabase/ssr';

// TODO: Make sure you pnpm run gen_all
import { Database } from '@/types/schema';

// TODO: Make your .env.local and or .env.test.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

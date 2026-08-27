import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/schema';

// Supabase client for server components, actions, and route handlers.
// Note: setAll() will fail silently in Server Components (intended),
// but works successfully in server actions and route handlers.

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // setAll is included to satisfy the Supabase SSR client API, but this client is read only so it can't set
          // Thus it will always fail when setting, but it's harmless and expected so we don't want to bloat our errors by logging.
        }
      },
    },
  });
}

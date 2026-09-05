import 'server-only';

import { createClient } from '@supabase/supabase-js';

// Service-role client for privileged server-side operations (e.g. recovery links).
// Never expose this to the client. It bypasses all RLS.
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

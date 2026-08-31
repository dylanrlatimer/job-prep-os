import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const TRANSACTION_POOLER = process.env.TRANSACTION_POOLER;
if (!TRANSACTION_POOLER) throw new Error('TRANSACTION_POOLER is not set');

// NOTE: Pretty sure we can get a cert from Supabase and handle SSL explicitly.

export default defineConfig({
  schema: './src/lib/drizzle/schema.ts',
  out: './src/lib/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: TRANSACTION_POOLER + '?sslmode=no-verify',
  },
  schemaFilter: ['public', 'app', 'auth'],
});

// npx drizzle-kit pull

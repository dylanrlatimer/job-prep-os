import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const TRANSACTION_POOLER = process.env.TRANSACTION_POOLER;
if (!TRANSACTION_POOLER) throw new Error('TRANSACTION_POOLER is not set');

// TODO: Verify SSL eventually, because this is a an attack vector

export default defineConfig({
  schema: './src/lib/drizzle/schema.ts',
  out: './src/lib/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: TRANSACTION_POOLER + '?sslmode=no-verify',
  },
  schemaFilter: ['public', 'auth'],
});

// npx drizzle-kit pull

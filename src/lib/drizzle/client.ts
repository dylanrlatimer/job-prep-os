import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const TRANSACTION_POOLER = process.env.TRANSACTION_POOLER;
if (!TRANSACTION_POOLER) {
  throw new Error('TRANSACTION_POOLER is not set');
}

const pool = new pg.Pool({
  connectionString: TRANSACTION_POOLER,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

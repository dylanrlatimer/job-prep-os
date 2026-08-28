import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const TRANSACTION_POOLER = process.env.TRANSACTION_POOLER;
if (!TRANSACTION_POOLER) {
  throw new Error('TRANSACTION_POOLER is not set');
}

const { hostname } = new URL(TRANSACTION_POOLER);
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

const pool = new pg.Pool({
  connectionString: TRANSACTION_POOLER,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

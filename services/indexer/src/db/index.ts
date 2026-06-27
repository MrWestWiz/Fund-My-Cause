import { Pool } from 'pg';
import { createLogger } from '../logger.js';

const logger = createLogger('database');

let pool: Pool;

export function initializePool(connectionString: string) {
  pool = new Pool({ connectionString });
  logger.info('Database pool initialized');
  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return pool;
}

export async function query(text: string, values?: unknown[]) {
  return pool.query(text, values);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}

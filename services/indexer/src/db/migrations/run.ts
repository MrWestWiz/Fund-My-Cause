import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../index.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('migrations');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Migration {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

async function getMigrations(): Promise<Migration[]> {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.ts') && f !== 'run.ts');
  const migrations: Migration[] = [];
  
  for (const file of files.sort()) {
    const mod = await import(`./${file}`);
    migrations.push({
      name: file.replace('.ts', ''),
      up: mod.up,
      down: mod.down
    });
  }
  
  return migrations;
}

export async function runMigrations() {
  const pool = getPool();
  const migrations = await getMigrations();
  
  // Create migrations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name VARCHAR(255) PRIMARY KEY,
      run_at TIMESTAMP DEFAULT NOW()
    );
  `);

  for (const migration of migrations) {
    const result = await pool.query('SELECT * FROM migrations WHERE name = $1', [migration.name]);
    
    if (result.rows.length === 0) {
      logger.info(`Running migration: ${migration.name}`);
      await migration.up();
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      logger.info(`Completed migration: ${migration.name}`);
    }
  }
}

export async function rollbackMigration() {
  const pool = getPool();
  const migrations = (await getMigrations()).reverse();
  
  for (const migration of migrations) {
    const result = await pool.query('SELECT * FROM migrations WHERE name = $1', [migration.name]);
    
    if (result.rows.length > 0) {
      logger.info(`Rolling back migration: ${migration.name}`);
      await migration.down();
      await pool.query('DELETE FROM migrations WHERE name = $1', [migration.name]);
      logger.info(`Rolled back migration: ${migration.name}`);
      break;
    }
  }
}

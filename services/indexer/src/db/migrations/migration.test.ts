import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { initializePool, closePool } from '../index.js';
import { runMigrations } from './run.js';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('DB migrations', () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
    await pool?.end();
  });

  it('runs all migrations and creates expected schema', async () => {
    pool = new Pool({ connectionString: DATABASE_URL });

    // Wire up the shared pool used by migration helpers
    initializePool(DATABASE_URL!);

    await runMigrations();

    // Verify tables exist
    const { rows: tables } = await pool.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const tableNames = tables.map(r => r.table_name);

    expect(tableNames).toContain('campaigns');
    expect(tableNames).toContain('contributions');

    // Verify campaigns columns
    const { rows: campaignCols } = await pool.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'campaigns'
    `);
    const campaignColNames = campaignCols.map(r => r.column_name);
    for (const col of ['id', 'creator_address', 'contract_address', 'goal', 'deadline', 'status', 'total_raised']) {
      expect(campaignColNames, `campaigns.${col} should exist`).toContain(col);
    }

    // Verify contributions columns
    const { rows: contribCols } = await pool.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contributions'
    `);
    const contribColNames = contribCols.map(r => r.column_name);
    for (const col of ['id', 'campaign_id', 'contributor_address', 'amount', 'tx_hash']) {
      expect(contribColNames, `contributions.${col} should exist`).toContain(col);
    }

    // Verify indexes exist
    const { rows: indexes } = await pool.query<{ indexname: string }>(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname
    `);
    const indexNames = indexes.map(r => r.indexname);

    for (const idx of [
      'idx_campaigns_creator',
      'idx_campaigns_status',
      'idx_contributions_campaign',
      'idx_contributions_contributor',
      'idx_contributions_campaign_time',
      'idx_campaigns_status_time',
    ]) {
      expect(indexNames, `index ${idx} should exist`).toContain(idx);
    }
  });
});

import { query } from '../index.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('migration:001-schema');

export async function up() {
  logger.info('Running migration 001-schema');
  
  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY,
      creator_address VARCHAR(56) NOT NULL,
      contract_address VARCHAR(56) NOT NULL UNIQUE,
      token_address VARCHAR(56) NOT NULL,
      goal BIGINT NOT NULL,
      deadline BIGINT NOT NULL,
      min_contribution BIGINT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active',
      total_raised BIGINT DEFAULT 0,
      contributor_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      indexed_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_campaigns_creator ON campaigns(creator_address);
    CREATE INDEX idx_campaigns_status ON campaigns(status);
    CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id UUID PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      contributor_address VARCHAR(56) NOT NULL,
      amount BIGINT NOT NULL,
      token_amount BIGINT NOT NULL,
      contributed_at TIMESTAMP DEFAULT NOW(),
      tx_hash VARCHAR(64),
      indexed_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_contributions_campaign ON contributions(campaign_id);
    CREATE INDEX idx_contributions_contributor ON contributions(contributor_address);
    CREATE INDEX idx_contributions_contributed_at ON contributions(contributed_at DESC);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id UUID PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      contributor_address VARCHAR(56) NOT NULL,
      amount BIGINT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      claimed_at TIMESTAMP,
      tx_hash VARCHAR(64),
      indexed_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_refunds_campaign ON refunds(campaign_id);
    CREATE INDEX idx_refunds_contributor ON refunds(contributor_address);
    CREATE INDEX idx_refunds_status ON refunds(status);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      target_amount BIGINT NOT NULL,
      achieved BOOLEAN DEFAULT FALSE,
      achieved_at TIMESTAMP,
      indexed_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_milestones_campaign ON milestones(campaign_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS raw_events (
      id UUID PRIMARY KEY,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
      event_type VARCHAR(50) NOT NULL,
      ledger_sequence INT NOT NULL,
      tx_hash VARCHAR(64),
      event_data JSONB NOT NULL,
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      indexed_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_raw_events_campaign ON raw_events(campaign_id);
    CREATE INDEX idx_raw_events_type ON raw_events(event_type);
    CREATE INDEX idx_raw_events_ledger ON raw_events(ledger_sequence);
    CREATE INDEX idx_raw_events_processed ON raw_events(processed);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id SERIAL PRIMARY KEY,
      last_processed_ledger INT DEFAULT 0,
      last_updated TIMESTAMP DEFAULT NOW()
    );
    
    INSERT INTO sync_state (last_processed_ledger) VALUES (0) ON CONFLICT DO NOTHING;
  `);

  logger.info('Migration 001-schema completed');
}

export async function down() {
  logger.info('Rolling back migration 001-schema');
  
  await query(`
    DROP TABLE IF EXISTS sync_state;
    DROP TABLE IF EXISTS raw_events;
    DROP TABLE IF EXISTS milestones;
    DROP TABLE IF EXISTS refunds;
    DROP TABLE IF EXISTS contributions;
    DROP TABLE IF EXISTS campaigns;
  `);

  logger.info('Migration 001-schema rolled back');
}

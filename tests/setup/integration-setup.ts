/**
 * Integration Test Setup - SQLite In-Memory Database
 * 
 * This setup creates an in-memory SQLite database that mimics
 * the Supabase PostgreSQL schema for Docker-free integration testing
 */

import Database from 'better-sqlite3'
import { beforeAll, afterAll, afterEach } from 'vitest'

// Global database instance for all integration tests
export let testDb: Database.Database

// SQL schema creation scripts
const CREATE_TABLES_SQL = `
-- Users table for auth simulation
CREATE TABLE auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Organizations table
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  organization_type TEXT CHECK (organization_type IN ('CORPORATE', 'SMALL_BUSINESS', 'GOVERNMENT', 'NON_PROFIT', 'STARTUP')),
  industry TEXT,
  size_category TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  notes TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER
);

-- Contacts table
CREATE TABLE contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  organization_id TEXT,
  contact_type TEXT DEFAULT 'BUSINESS' CHECK (contact_type IN ('BUSINESS', 'PERSONAL')),
  is_primary_contact INTEGER DEFAULT 0 CHECK (is_primary_contact IN (0, 1)),
  preferred_contact_method TEXT DEFAULT 'EMAIL' CHECK (preferred_contact_method IN ('EMAIL', 'PHONE', 'TEXT')),
  notes TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Principals table
CREATE TABLE principals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  principal_status TEXT DEFAULT 'ACTIVE' CHECK (principal_status IN ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED')),
  geographic_region TEXT,
  market_segment TEXT,
  tier_level INTEGER DEFAULT 1 CHECK (tier_level BETWEEN 1 AND 5),
  is_vip INTEGER DEFAULT 0 CHECK (is_vip IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER
);

-- Opportunities table
CREATE TABLE opportunities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'NEW_LEAD' CHECK (stage IN ('NEW_LEAD', 'INITIAL_OUTREACH', 'SAMPLE_VISIT_OFFERED', 'AWAITING_RESPONSE', 'FEEDBACK_LOGGED', 'DEMO_SCHEDULED', 'CLOSED_WON')),
  probability_percent INTEGER CHECK (probability_percent >= 0 AND probability_percent <= 100),
  expected_close_date INTEGER,
  organization_id TEXT,
  principal_id TEXT,
  product_id TEXT,
  deal_owner TEXT,
  notes TEXT,
  name_template TEXT,
  context TEXT,
  custom_context TEXT,
  is_won INTEGER DEFAULT 0 CHECK (is_won IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (principal_id) REFERENCES principals(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Interactions table
CREATE TABLE interactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('PHONE_CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'SAMPLE_DELIVERY', 'DEMO', 'FOLLOW_UP', 'OTHER')),
  subject TEXT NOT NULL,
  description TEXT,
  interaction_date INTEGER NOT NULL,
  duration_minutes INTEGER,
  contact_id TEXT,
  organization_id TEXT,
  principal_id TEXT,
  opportunity_id TEXT,
  outcome TEXT,
  follow_up_required INTEGER DEFAULT 0 CHECK (follow_up_required IN (0, 1)),
  follow_up_date INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  deleted_at INTEGER,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (principal_id) REFERENCES principals(id),
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);

-- Principal Activity Summary View (materialized as table for SQLite)
CREATE TABLE principal_activity_summary (
  principal_id TEXT PRIMARY KEY,
  principal_name TEXT NOT NULL,
  principal_status TEXT NOT NULL,
  organization_type TEXT,
  industry TEXT,
  organization_size TEXT,
  is_active INTEGER DEFAULT 1,
  lead_score INTEGER DEFAULT 0,
  contact_count INTEGER DEFAULT 0,
  active_contacts INTEGER DEFAULT 0,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  last_contact_update TEXT,
  total_interactions INTEGER DEFAULT 0,
  interactions_last_30_days INTEGER DEFAULT 0,
  interactions_last_90_days INTEGER DEFAULT 0,
  last_interaction_date TEXT,
  last_interaction_type TEXT,
  next_follow_up_date TEXT,
  avg_interaction_rating REAL DEFAULT 0,
  positive_interactions INTEGER DEFAULT 0,
  follow_ups_required INTEGER DEFAULT 0,
  total_opportunities INTEGER DEFAULT 0,
  active_opportunities INTEGER DEFAULT 0,
  won_opportunities INTEGER DEFAULT 0,
  opportunities_last_30_days INTEGER DEFAULT 0,
  latest_opportunity_stage TEXT,
  latest_opportunity_date TEXT,
  avg_probability_percent REAL DEFAULT 0,
  highest_value_opportunity TEXT,
  product_count INTEGER DEFAULT 0,
  active_product_count INTEGER DEFAULT 0,
  product_categories TEXT, -- JSON array as string
  primary_product_category TEXT,
  is_principal INTEGER DEFAULT 1,
  is_distributor INTEGER DEFAULT 0,
  last_activity_date TEXT,
  activity_status TEXT DEFAULT 'ACTIVE',
  engagement_score INTEGER DEFAULT 0,
  principal_created_at TEXT,
  principal_updated_at TEXT,
  summary_generated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (principal_id) REFERENCES principals(id)
);
`

const CREATE_INDEXES_SQL = `
-- Performance indexes
CREATE INDEX idx_organizations_active ON organizations(is_active);
CREATE INDEX idx_organizations_type ON organizations(organization_type);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_active ON contacts(is_active);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_principals_org ON principals(organization_id);
CREATE INDEX idx_principals_status ON principals(principal_status);
CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_principal ON opportunities(principal_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_org ON interactions(organization_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_principal_summary_status ON principal_activity_summary(activity_status);
CREATE INDEX idx_principal_summary_engagement ON principal_activity_summary(engagement_score);
`

const INSERT_SAMPLE_DATA_SQL = `
-- Sample organizations
INSERT INTO organizations (id, name, organization_type, industry, size_category) VALUES 
('test-org-1', 'Acme Corporation', 'CORPORATE', 'Technology', 'LARGE'),
('test-org-2', 'Beta Industries', 'CORPORATE', 'Manufacturing', 'MEDIUM'),
('test-org-3', 'Gamma Solutions', 'SMALL_BUSINESS', 'Consulting', 'SMALL');

-- Sample principals
INSERT INTO principals (id, name, organization_id, principal_status, geographic_region) VALUES
('test-principal-1', 'Acme Corporation', 'test-org-1', 'ACTIVE', 'North America'),
('test-principal-2', 'Beta Industries', 'test-org-2', 'ACTIVE', 'North America'),
('test-principal-3', 'Gamma Solutions', 'test-org-3', 'INACTIVE', 'Europe');

-- Sample contacts
INSERT INTO contacts (id, first_name, last_name, email, organization_id, is_primary_contact) VALUES
('test-contact-1', 'John', 'Doe', 'john@acme.com', 'test-org-1', 1),
('test-contact-2', 'Jane', 'Smith', 'jane@beta.com', 'test-org-2', 1),
('test-contact-3', 'Bob', 'Wilson', 'bob@gamma.com', 'test-org-3', 1);

-- Sample products
INSERT INTO products (id, name, category) VALUES
('test-product-1', 'Software Solution A', 'SOFTWARE'),
('test-product-2', 'Hardware Device B', 'HARDWARE'),
('test-product-3', 'Consulting Service C', 'SERVICES');

-- Sample opportunities
INSERT INTO opportunities (id, name, stage, organization_id, principal_id, product_id, probability_percent) VALUES
('test-opp-1', 'Acme Software Deal', 'DEMO_SCHEDULED', 'test-org-1', 'test-principal-1', 'test-product-1', 75),
('test-opp-2', 'Beta Hardware Upgrade', 'AWAITING_RESPONSE', 'test-org-2', 'test-principal-2', 'test-product-2', 50),
('test-opp-3', 'Gamma Consulting Project', 'NEW_LEAD', 'test-org-3', 'test-principal-3', 'test-product-3', 25);

-- Sample principal activity summary
INSERT INTO principal_activity_summary (
  principal_id, principal_name, principal_status, organization_type, industry,
  lead_score, contact_count, active_contacts, primary_contact_name, primary_contact_email,
  total_interactions, interactions_last_30_days, interactions_last_90_days,
  total_opportunities, active_opportunities, engagement_score, activity_status
) VALUES
('test-principal-1', 'Acme Corporation', 'ACTIVE', 'CORPORATE', 'Technology',
 85, 1, 1, 'John Doe', 'john@acme.com',
 15, 5, 12,
 1, 1, 87, 'ACTIVE'),
('test-principal-2', 'Beta Industries', 'ACTIVE', 'CORPORATE', 'Manufacturing',
 70, 1, 1, 'Jane Smith', 'jane@beta.com',
 8, 2, 6,
 1, 1, 72, 'ACTIVE'),
('test-principal-3', 'Gamma Solutions', 'INACTIVE', 'SMALL_BUSINESS', 'Consulting',
 45, 1, 0, 'Bob Wilson', 'bob@gamma.com',
 3, 0, 1,
 1, 0, 35, 'INACTIVE');
`

beforeAll(async () => {
  console.log('🔧 Setting up SQLite in-memory database for integration tests...')
  
  try {
    // Create in-memory database
    testDb = new Database(':memory:')
    
    // Configure for better performance
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('synchronous = NORMAL')
    testDb.pragma('cache_size = 10000')
    testDb.pragma('temp_store = MEMORY')
    
    // Create all tables and indexes
    testDb.exec(CREATE_TABLES_SQL)
    testDb.exec(CREATE_INDEXES_SQL)
    testDb.exec(INSERT_SAMPLE_DATA_SQL)
    
    console.log('✅ SQLite database initialized successfully')
    console.log(`📊 Sample data: ${testDb.prepare('SELECT COUNT(*) as count FROM organizations').get().count} organizations`)
    console.log(`📊 Sample data: ${testDb.prepare('SELECT COUNT(*) as count FROM principals').get().count} principals`)
    
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error)
    throw error
  }
})

afterEach(() => {
  // Clean up any test-specific data but keep sample data
  const tables = [
    'interactions', 'opportunities', 'contacts', 'principals', 'organizations', 
    'products', 'principal_activity_summary'
  ]
  
  tables.forEach(table => {
    try {
      // Delete only records created during tests (not the sample data)
      testDb.prepare(`DELETE FROM ${table} WHERE created_at > strftime('%s', 'now', '-1 minute')`).run()
    } catch (error) {
      // Ignore errors for tables that don't have created_at
    }
  })
})

afterAll(async () => {
  console.log('🧹 Cleaning up integration test database...')
  
  if (testDb) {
    try {
      testDb.close()
      console.log('✅ Database connection closed')
    } catch (error) {
      console.error('❌ Error closing database:', error)
    }
  }
})

// Utility functions for test data management
export const testUtils = {
  // Reset database to clean state
  resetDatabase() {
    // Disable foreign key constraints temporarily for cleanup
    testDb.prepare('PRAGMA foreign_keys = OFF').run()
    
    const tables = [
      'principal_activity_summary', 'interactions', 'opportunities', 
      'contacts', 'principals', 'organizations', 'products'
    ]
    
    tables.forEach(table => {
      testDb.prepare(`DELETE FROM ${table}`).run()
    })
    
    // Re-enable foreign key constraints
    testDb.prepare('PRAGMA foreign_keys = ON').run()
    
    // Re-insert sample data
    testDb.exec(INSERT_SAMPLE_DATA_SQL)
  },
  
  // Get database statistics
  getStats() {
    return {
      organizations: testDb.prepare('SELECT COUNT(*) as count FROM organizations').get().count,
      principals: testDb.prepare('SELECT COUNT(*) as count FROM principals').get().count,
      contacts: testDb.prepare('SELECT COUNT(*) as count FROM contacts').get().count,
      opportunities: testDb.prepare('SELECT COUNT(*) as count FROM opportunities').get().count,
      interactions: testDb.prepare('SELECT COUNT(*) as count FROM interactions').get().count,
    }
  },
  
  // Create test organization
  createTestOrganization(data: Partial<any> = {}) {
    const stmt = testDb.prepare(`
      INSERT INTO organizations (name, organization_type, industry, size_category)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      data.name || 'Test Organization',
      data.organization_type || 'CORPORATE',
      data.industry || 'Technology',
      data.size_category || 'MEDIUM'
    )
    
    return testDb.prepare('SELECT * FROM organizations WHERE rowid = ?').get(result.lastInsertRowid)
  },
  
  // Direct SQL execution for advanced test scenarios
  query(sql: string, params: any[] = []) {
    return testDb.prepare(sql).all(...params)
  },
  
  // Execute raw SQL
  exec(sql: string) {
    return testDb.exec(sql)
  }
}
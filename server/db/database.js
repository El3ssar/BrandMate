import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/braid.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Brand sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      provider TEXT NOT NULL DEFAULT 'gemini',
      brand_colors TEXT NOT NULL DEFAULT '[]',
      text_guidelines TEXT NOT NULL DEFAULT '',
      label_description TEXT NOT NULL DEFAULT '',
      visual_analysis TEXT NOT NULL DEFAULT '',
      design_system_pdf TEXT NOT NULL DEFAULT '[]',
      few_shot_images TEXT NOT NULL DEFAULT '[]',
      correct_label_images TEXT NOT NULL DEFAULT '[]',
      incorrect_label_images TEXT NOT NULL DEFAULT '[]',
      custom_distill_prompt TEXT NOT NULL DEFAULT '',
      custom_review_prompt TEXT NOT NULL DEFAULT '',
      ai_parameters TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add missing columns if they don't exist (for existing databases)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(brand_sessions)").all();
    const columnNames = tableInfo.map(col => col.name);
    
    if (!columnNames.includes('custom_distill_prompt')) {
      db.exec('ALTER TABLE brand_sessions ADD COLUMN custom_distill_prompt TEXT NOT NULL DEFAULT ""');
      console.log('✓ Added custom_distill_prompt column');
    }
    if (!columnNames.includes('custom_review_prompt')) {
      db.exec('ALTER TABLE brand_sessions ADD COLUMN custom_review_prompt TEXT NOT NULL DEFAULT ""');
      console.log('✓ Added custom_review_prompt column');
    }
    if (!columnNames.includes('ai_parameters')) {
      db.exec('ALTER TABLE brand_sessions ADD COLUMN ai_parameters TEXT NOT NULL DEFAULT "{}"');
      console.log('✓ Added ai_parameters column');
    }
  } catch (migrationError) {
    console.warn('Migration warning:', migrationError.message);
  }

  // Audit history table (optional, for tracking reviews)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      audit_result TEXT NOT NULL,
      assets_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES brand_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON brand_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_session_id ON audit_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_history(user_id);
  `);

  console.log('✓ Database initialized successfully');
}

export default db;



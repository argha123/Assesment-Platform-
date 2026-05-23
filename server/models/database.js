const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'assessment.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  database.exec(`
    -- Accounts/Organizations
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      company_size TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Assessment Scopes
    CREATE TABLE IF NOT EXISTS assessment_scopes (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      assessment_type TEXT NOT NULL DEFAULT 'comprehensive',
      technology_stack TEXT,
      infrastructure_type TEXT,
      team_size TEXT,
      departments TEXT,
      focus_areas TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Question Bank
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'rating',
      options TEXT,
      weight REAL DEFAULT 1.0,
      maturity_level TEXT,
      applicable_to TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Assessments (actual assessment sessions)
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      overall_score REAL,
      people_score REAL,
      process_score REAL,
      technology_score REAL,
      FOREIGN KEY (scope_id) REFERENCES assessment_scopes(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Assessment Responses
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT,
      score REAL,
      notes TEXT,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    -- Reports
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      report_data TEXT,
      recommendations TEXT,
      action_plan TEXT,
      executive_summary TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized successfully');
  return database;
}

module.exports = { getDb, initializeDatabase };

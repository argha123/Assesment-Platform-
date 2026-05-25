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

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'assessor',
      avatar TEXT,
      department TEXT,
      last_login DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Comments (Collaborative Assessment)
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      question_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      content TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    -- Assessment Assignments
    CREATE TABLE IF NOT EXISTS assessment_assignments (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      category TEXT,
      status TEXT DEFAULT 'assigned',
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    -- Evidence/Attachments
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      question_id TEXT,
      user_id TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    -- Compliance Frameworks
    CREATE TABLE IF NOT EXISTS compliance_frameworks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      version TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Compliance Controls (mapped to questions)
    CREATE TABLE IF NOT EXISTS compliance_controls (
      id TEXT PRIMARY KEY,
      framework_id TEXT NOT NULL,
      control_id TEXT NOT NULL,
      control_name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE
    );

    -- Question-to-Control Mapping
    CREATE TABLE IF NOT EXISTS question_control_mapping (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      control_id TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE
    );

    -- Action Items (from action plans)
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      report_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      assignee_id TEXT,
      assignee_name TEXT,
      due_date TEXT,
      effort TEXT,
      impact TEXT,
      phase TEXT,
      progress INTEGER DEFAULT 0,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    -- Action Item Activity Logs
    CREATE TABLE IF NOT EXISTS action_item_logs (
      id TEXT PRIMARY KEY,
      action_item_id TEXT NOT NULL,
      action TEXT NOT NULL,
      from_value TEXT,
      to_value TEXT,
      user_name TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (action_item_id) REFERENCES action_items(id) ON DELETE CASCADE
    );

    -- Webhooks
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      secret TEXT,
      is_active INTEGER DEFAULT 1,
      last_triggered DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Badges/Achievements (Gamification)
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      criteria TEXT,
      points INTEGER DEFAULT 0
    );

    -- User Badges
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    );

    -- Knowledge Base Articles
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      tags TEXT,
      author_id TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Assessment Templates (Specialized Modules)
    CREATE TABLE IF NOT EXISTS assessment_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      template_type TEXT NOT NULL,
      industry TEXT,
      question_ids TEXT,
      focus_areas TEXT,
      compliance_frameworks TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Scheduled Assessments (Continuous Assessment)
    CREATE TABLE IF NOT EXISTS scheduled_assessments (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      frequency TEXT NOT NULL,
      next_run DATETIME,
      last_run DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scope_id) REFERENCES assessment_scopes(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Industry Benchmarks
    CREATE TABLE IF NOT EXISTS industry_benchmarks (
      id TEXT PRIMARY KEY,
      industry TEXT NOT NULL,
      company_size TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      avg_score REAL,
      median_score REAL,
      top_quartile REAL,
      bottom_quartile REAL,
      sample_size INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Risk Register
    CREATE TABLE IF NOT EXISTS risk_register (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      risk_title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      likelihood INTEGER,
      impact INTEGER,
      risk_score REAL,
      financial_impact REAL,
      mitigation TEXT,
      status TEXT DEFAULT 'open',
      owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized successfully');

  // Lightweight migrations for existing databases (best-effort: ignore if column already exists)
  try { database.exec(`ALTER TABLE assessment_scopes ADD COLUMN framework_id TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE users ADD COLUMN privileges TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE accounts ADD COLUMN sdm_name TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE accounts ADD COLUMN du_head_name TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE accounts ADD COLUMN ssh_name TEXT`); } catch (e) { /* exists */ }

  // Password reset tokens
  database.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations: add columns/tables that may not exist in older databases
  try {
    database.exec(`ALTER TABLE action_items ADD COLUMN created_by TEXT`);
  } catch (e) { /* column already exists */ }

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS action_item_logs (
        id TEXT PRIMARY KEY,
        action_item_id TEXT NOT NULL,
        action TEXT NOT NULL,
        from_value TEXT,
        to_value TEXT,
        user_name TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (action_item_id) REFERENCES action_items(id) ON DELETE CASCADE
      )
    `);
  } catch (e) { /* table already exists */ }

  return database;
}

module.exports = { getDb, initializeDatabase };

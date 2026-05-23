const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, getDb } = require('./models/database');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const assessmentRoutes = require('./routes/assessments');
const questionRoutes = require('./routes/questions');
const reportRoutes = require('./routes/reports');
const collaborationRoutes = require('./routes/collaboration');
const evidenceRoutes = require('./routes/evidence');
const complianceRoutes = require('./routes/compliance');
const actionItemRoutes = require('./routes/actionItems');
const benchmarkRoutes = require('./routes/benchmarks');
const integrationRoutes = require('./routes/integrations');
const riskRegisterRoutes = require('./routes/riskRegister');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const templateRoutes = require('./routes/templates');
const gamificationRoutes = require('./routes/gamification');
const exportRoutes = require('./routes/exportReport');
const auditLogRoutes = require('./routes/auditLog');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initializeDatabase();

// Seed default admin user
const db = getDb();
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@assessment.local');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), 'System Admin', 'admin@assessment.local', hash, 'admin');
  console.log('Default admin user created (admin@assessment.local / admin123)');
}

// Seed compliance frameworks
const existingFramework = db.prepare('SELECT id FROM compliance_frameworks WHERE code = ?').get('NIST_CSF');
if (!existingFramework) {
  seedComplianceFrameworks();
}

// Seed badges
const existingBadge = db.prepare('SELECT id FROM badges LIMIT 1').get();
if (!existingBadge) {
  seedBadges();
}

// Seed industry benchmarks
const existingBenchmark = db.prepare('SELECT id FROM industry_benchmarks LIMIT 1').get();
if (!existingBenchmark) {
  seedBenchmarks();
}

// Seed knowledge base
const existingKb = db.prepare('SELECT id FROM knowledge_base LIMIT 1').get();
if (!existingKb) {
  seedKnowledgeBase();
}

// Seed assessment templates
const existingTemplate = db.prepare('SELECT id FROM assessment_templates LIMIT 1').get();
if (!existingTemplate) {
  seedTemplates();
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/risks', riskRegisterRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit-log', auditLogRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Seed Functions
function seedComplianceFrameworks() {
  const frameworks = [
    { code: 'NIST_CSF', name: 'NIST Cybersecurity Framework', description: 'Framework for improving critical infrastructure cybersecurity', version: '2.0' },
    { code: 'ISO_27001', name: 'ISO/IEC 27001', description: 'Information security management systems', version: '2022' },
    { code: 'CIS_CONTROLS', name: 'CIS Critical Security Controls', description: 'Prioritized set of actions for cyber defense', version: 'v8' },
    { code: 'SOC2', name: 'SOC 2', description: 'Service Organization Control 2 - Trust Services Criteria', version: '2017' },
    { code: 'HIPAA', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act', version: '2013' },
    { code: 'PCI_DSS', name: 'PCI DSS', description: 'Payment Card Industry Data Security Standard', version: '4.0' },
    { code: 'GDPR', name: 'GDPR', description: 'General Data Protection Regulation', version: '2018' },
    { code: 'COBIT', name: 'COBIT', description: 'Control Objectives for Information and Related Technologies', version: '2019' }
  ];
  const insertFw = db.prepare('INSERT INTO compliance_frameworks (id, name, code, description, version) VALUES (?, ?, ?, ?, ?)');
  const insertCtrl = db.prepare('INSERT INTO compliance_controls (id, framework_id, control_id, control_name, description, category) VALUES (?, ?, ?, ?, ?, ?)');
  
  frameworks.forEach(fw => {
    const fwId = uuidv4();
    insertFw.run(fwId, fw.name, fw.code, fw.description, fw.version);
    
    // Add sample controls
    const controls = getControlsForFramework(fw.code);
    controls.forEach(ctrl => {
      insertCtrl.run(uuidv4(), fwId, ctrl.id, ctrl.name, ctrl.description, ctrl.category);
    });
  });
  console.log('Compliance frameworks seeded');
}

function getControlsForFramework(code) {
  const controlSets = {
    'NIST_CSF': [
      { id: 'ID.AM', name: 'Asset Management', description: 'Data, personnel, devices identified and managed', category: 'Identify' },
      { id: 'ID.RA', name: 'Risk Assessment', description: 'Organization understands cybersecurity risk', category: 'Identify' },
      { id: 'PR.AC', name: 'Access Control', description: 'Access to assets and facilities is limited', category: 'Protect' },
      { id: 'PR.AT', name: 'Awareness and Training', description: 'Personnel are trained in security', category: 'Protect' },
      { id: 'PR.DS', name: 'Data Security', description: 'Data managed consistent with risk strategy', category: 'Protect' },
      { id: 'PR.IP', name: 'Protective Processes', description: 'Security policies maintained', category: 'Protect' },
      { id: 'DE.AE', name: 'Anomalies and Events', description: 'Anomalous activity detected', category: 'Detect' },
      { id: 'DE.CM', name: 'Continuous Monitoring', description: 'System monitored for cybersecurity events', category: 'Detect' },
      { id: 'RS.RP', name: 'Response Planning', description: 'Response plan executed during/after event', category: 'Respond' },
      { id: 'RC.RP', name: 'Recovery Planning', description: 'Recovery plan executed during/after event', category: 'Recover' }
    ],
    'ISO_27001': [
      { id: 'A.5', name: 'Information Security Policies', description: 'Management direction for information security', category: 'Organizational' },
      { id: 'A.6', name: 'Organization of Information Security', description: 'Internal organization and mobile/telework', category: 'Organizational' },
      { id: 'A.7', name: 'Human Resource Security', description: 'Before, during and after employment', category: 'People' },
      { id: 'A.8', name: 'Asset Management', description: 'Responsibility for assets and classification', category: 'Technology' },
      { id: 'A.9', name: 'Access Control', description: 'Business requirements and user access management', category: 'Technology' },
      { id: 'A.12', name: 'Operations Security', description: 'Operational procedures and responsibilities', category: 'Process' },
      { id: 'A.14', name: 'System Development', description: 'Security requirements and development processes', category: 'Technology' },
      { id: 'A.16', name: 'Incident Management', description: 'Management of security incidents', category: 'Process' },
      { id: 'A.17', name: 'Business Continuity', description: 'Information security continuity', category: 'Process' },
      { id: 'A.18', name: 'Compliance', description: 'Compliance with legal and contractual requirements', category: 'Process' }
    ],
    'CIS_CONTROLS': [
      { id: 'CIS-1', name: 'Inventory of Enterprise Assets', description: 'Actively manage all enterprise assets', category: 'Basic' },
      { id: 'CIS-2', name: 'Inventory of Software Assets', description: 'Actively manage all software', category: 'Basic' },
      { id: 'CIS-3', name: 'Data Protection', description: 'Develop processes to identify and protect sensitive data', category: 'Basic' },
      { id: 'CIS-4', name: 'Secure Configuration', description: 'Establish and maintain secure configuration', category: 'Basic' },
      { id: 'CIS-5', name: 'Account Management', description: 'Use processes to assign and manage credentials', category: 'Basic' },
      { id: 'CIS-6', name: 'Access Control Management', description: 'Use processes to create and manage access', category: 'Foundational' },
      { id: 'CIS-8', name: 'Audit Log Management', description: 'Collect and retain audit logs', category: 'Foundational' },
      { id: 'CIS-11', name: 'Data Recovery', description: 'Establish and maintain data recovery practices', category: 'Foundational' },
      { id: 'CIS-14', name: 'Security Awareness Training', description: 'Establish security awareness program', category: 'Organizational' },
      { id: 'CIS-17', name: 'Incident Response', description: 'Establish and maintain incident response program', category: 'Organizational' }
    ]
  };
  return controlSets[code] || [
    { id: `${code}-1`, name: 'General Control 1', description: 'Primary control requirement', category: 'General' },
    { id: `${code}-2`, name: 'General Control 2', description: 'Secondary control requirement', category: 'General' }
  ];
}

function seedBadges() {
  const badges = [
    { name: 'First Assessment', description: 'Completed your first assessment', icon: 'trophy', points: 50, criteria: { type: 'first_assessment' } },
    { name: 'Assessment Pro', description: 'Completed 5 assessments', icon: 'star', points: 200, criteria: { type: 'assessments_completed', count: 5 } },
    { name: 'Assessment Master', description: 'Completed 10 assessments', icon: 'crown', points: 500, criteria: { type: 'assessments_completed', count: 10 } },
    { name: 'High Achiever', description: 'Scored 8+ overall on an assessment', icon: 'rocket', points: 300, criteria: { type: 'score_above', threshold: 8 } },
    { name: 'Perfect Score', description: 'Scored 10 overall on an assessment', icon: 'diamond', points: 1000, criteria: { type: 'score_above', threshold: 10 } },
    { name: 'Collaborator', description: 'Added 10 comments to assessments', icon: 'chat', points: 100, criteria: { type: 'comments_added', count: 10 } },
    { name: 'Evidence Collector', description: 'Uploaded 20 evidence documents', icon: 'folder', points: 150, criteria: { type: 'evidence_uploaded', count: 20 } },
    { name: 'Quick Start', description: 'Completed an assessment in under 1 hour', icon: 'lightning', points: 100, criteria: { type: 'fast_completion' } }
  ];
  const insert = db.prepare('INSERT INTO badges (id, name, description, icon, points, criteria) VALUES (?, ?, ?, ?, ?, ?)');
  badges.forEach(b => insert.run(uuidv4(), b.name, b.description, b.icon, b.points, JSON.stringify(b.criteria)));
  console.log('Badges seeded');
}

function seedBenchmarks() {
  const industries = ['Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 'Retail'];
  const categories = ['people', 'process', 'technology'];
  const insert = db.prepare('INSERT INTO industry_benchmarks (id, industry, company_size, category, subcategory, avg_score, median_score, top_quartile, bottom_quartile, sample_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  industries.forEach(industry => {
    categories.forEach(cat => {
      const base = cat === 'technology' ? 6.5 : cat === 'process' ? 5.8 : 5.5;
      const variance = industry === 'Technology' ? 0.5 : industry === 'Financial Services' ? 0.3 : 0;
      insert.run(uuidv4(), industry, null, cat, null,
        +(base + variance).toFixed(1), +(base + variance - 0.3).toFixed(1),
        +(base + variance + 1.5).toFixed(1), +(base + variance - 1.5).toFixed(1),
        Math.floor(Math.random() * 500) + 100);
    });
  });
  console.log('Industry benchmarks seeded');
}

function seedKnowledgeBase() {
  const articles = [
    { title: 'Getting Started with IT Assessments', content: 'IT assessments help organizations understand their current state across People, Process, and Technology dimensions. This guide walks you through the basics of conducting an effective assessment.\\n\\nKey steps:\\n1. Define scope and objectives\\n2. Identify stakeholders\\n3. Select appropriate assessment framework\\n4. Gather evidence and conduct interviews\\n5. Score and analyze results\\n6. Generate recommendations\\n7. Create action plan', category: 'Getting Started', subcategory: 'Basics' },
    { title: 'ITSM Best Practices', content: 'IT Service Management (ITSM) encompasses the policies, processes, and procedures used to design, deliver, manage, and improve IT services. Key frameworks include ITIL, COBIT, and ISO 20000.\\n\\nTop practices:\\n- Implement incident management with clear escalation paths\\n- Establish change advisory board (CAB)\\n- Define and measure SLAs\\n- Maintain a Configuration Management Database (CMDB)\\n- Conduct regular service reviews', category: 'Process', subcategory: 'ITSM' },
    { title: 'Cloud Migration Assessment Guide', content: 'When assessing cloud readiness, evaluate:\\n\\n1. Current infrastructure state\\n2. Application portfolio (cloud-native vs legacy)\\n3. Data classification and compliance requirements\\n4. Network architecture and connectivity\\n5. Skills and training needs\\n6. Cost modeling (TCO vs cloud costs)\\n7. Security and governance requirements\\n\\nUse the 6 Rs: Rehost, Replatform, Repurchase, Refactor, Retire, Retain', category: 'Technology', subcategory: 'Cloud' },
    { title: 'Security Maturity Assessment Framework', content: 'A robust security assessment evaluates:\\n\\n- Identity and Access Management (IAM)\\n- Network Security\\n- Endpoint Protection\\n- Data Protection\\n- Security Operations (SOC)\\n- Vulnerability Management\\n- Incident Response\\n- Security Awareness\\n\\nMap findings to NIST CSF or CIS Controls for standardized reporting.', category: 'Technology', subcategory: 'Security' },
    { title: 'Building High-Performance IT Teams', content: 'Key factors for IT team excellence:\\n\\n1. Clear roles and responsibilities\\n2. Skills development and certification paths\\n3. Knowledge management and documentation\\n4. Cross-functional collaboration\\n5. Regular retrospectives and improvement\\n6. Appropriate tooling and automation\\n7. Work-life balance and culture', category: 'People', subcategory: 'Team Building' }
  ];
  const insert = db.prepare('INSERT INTO knowledge_base (id, title, content, category, subcategory, tags) VALUES (?, ?, ?, ?, ?, ?)');
  articles.forEach(a => insert.run(uuidv4(), a.title, a.content, a.category, a.subcategory, '[]'));
  console.log('Knowledge base seeded');
}

function seedTemplates() {
  const templates = [
    { name: 'Comprehensive IT Assessment', description: 'Full assessment covering People, Process & Technology', template_type: 'comprehensive', focus_areas: ['people', 'process', 'technology'] },
    { name: 'Cloud Maturity Assessment', description: 'Focused on cloud adoption and optimization', template_type: 'cloud', focus_areas: ['technology', 'process'] },
    { name: 'Cybersecurity Assessment', description: 'Security-focused assessment aligned with NIST CSF', template_type: 'security', focus_areas: ['technology', 'process'] },
    { name: 'DevOps Maturity Assessment', description: 'Evaluate DevOps practices and CI/CD maturity', template_type: 'devops', focus_areas: ['process', 'technology'] },
    { name: 'Vendor Risk Assessment', description: 'Third-party vendor security and risk evaluation', template_type: 'vendor_risk', focus_areas: ['process', 'technology'] },
    { name: 'Digital Transformation Readiness', description: 'Assess readiness for digital transformation initiatives', template_type: 'digital_transformation', focus_areas: ['people', 'process', 'technology'] }
  ];
  const insert = db.prepare('INSERT INTO assessment_templates (id, name, description, template_type, focus_areas, is_default) VALUES (?, ?, ?, ?, ?, ?)');
  templates.forEach((t, i) => insert.run(uuidv4(), t.name, t.description, t.template_type, JSON.stringify(t.focus_areas), i === 0 ? 1 : 0));
  console.log('Assessment templates seeded');
}

app.listen(PORT, () => {
  console.log(`IT Assessment Platform Server running on port ${PORT}`);
});

module.exports = app;

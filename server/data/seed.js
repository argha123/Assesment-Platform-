const { initializeDatabase, getDb } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

// Initialize database
initializeDatabase();
const db = getDb();

console.log('Seeding question bank...');

const questions = [
  // ==================== PEOPLE CATEGORY ====================
  // Leadership & Governance
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'How well-defined are IT leadership roles and responsibilities?', weight: 1.5, maturity_level: 'all' },
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'Is there a dedicated CIO/CTO or equivalent role with clear authority?', weight: 1.5, maturity_level: 'all' },
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'How effective is IT governance in aligning technology with business objectives?', weight: 1.5, maturity_level: 'all' },
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'Are IT decisions made through a structured governance framework?', weight: 1.2, maturity_level: 'all' },
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'How well does leadership communicate IT strategy to the organization?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Leadership & Governance', question_text: 'Is there executive sponsorship for major IT initiatives?', weight: 1.3, maturity_level: 'all' },
  
  // Skills & Competencies
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'How well does the IT team skills match current technology requirements?', weight: 1.5, maturity_level: 'all' },
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'Is there a formal skills assessment and gap analysis process?', weight: 1.2, maturity_level: 'all' },
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'Are certifications and professional development actively supported?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'How well prepared is the team for emerging technologies (cloud, AI, automation)?', weight: 1.3, maturity_level: 'all' },
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'Are there defined career paths for IT professionals?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Skills & Competencies', question_text: 'How effective is cross-training to reduce key-person dependencies?', weight: 1.2, maturity_level: 'all' },
  
  // Team Structure & Organization
  { category: 'People', subcategory: 'Team Structure', question_text: 'Is the IT organizational structure aligned with service delivery needs?', weight: 1.3, maturity_level: 'all' },
  { category: 'People', subcategory: 'Team Structure', question_text: 'Are team sizes appropriate for workload and responsibilities?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Team Structure', question_text: 'How effective is collaboration between IT teams (dev, ops, security)?', weight: 1.2, maturity_level: 'all' },
  { category: 'People', subcategory: 'Team Structure', question_text: 'Is there clear escalation and decision-making hierarchy?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Team Structure', question_text: 'How well is IT integrated with business units?', weight: 1.2, maturity_level: 'all' },
  
  // Culture & Change Management
  { category: 'People', subcategory: 'Culture & Change', question_text: 'How receptive is the organization to technological change?', weight: 1.2, maturity_level: 'all' },
  { category: 'People', subcategory: 'Culture & Change', question_text: 'Is there a formal change management methodology in use?', weight: 1.3, maturity_level: 'all' },
  { category: 'People', subcategory: 'Culture & Change', question_text: 'How effective is communication about IT changes to end users?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Culture & Change', question_text: 'Is there a culture of continuous improvement and innovation?', weight: 1.2, maturity_level: 'all' },
  { category: 'People', subcategory: 'Culture & Change', question_text: 'How well are lessons learned captured and applied?', weight: 1.0, maturity_level: 'all' },
  
  // Training & Development
  { category: 'People', subcategory: 'Training & Development', question_text: 'Is there a structured IT training program with annual budgets?', weight: 1.3, maturity_level: 'all' },
  { category: 'People', subcategory: 'Training & Development', question_text: 'How effective is onboarding for new IT team members?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Training & Development', question_text: 'Are security awareness training programs conducted regularly?', weight: 1.5, maturity_level: 'all' },
  { category: 'People', subcategory: 'Training & Development', question_text: 'Is there mentoring and knowledge transfer between senior and junior staff?', weight: 1.0, maturity_level: 'all' },
  { category: 'People', subcategory: 'Training & Development', question_text: 'How well does training align with technology roadmap needs?', weight: 1.2, maturity_level: 'all' },

  // ==================== PROCESS CATEGORY ====================
  // ITSM & Service Management
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'How mature is the incident management process?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'Is there a formal change management process with CAB reviews?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'How effective is the problem management process at identifying root causes?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'Are service level agreements (SLAs) defined and measured?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'Is there a service catalog with clearly defined offerings?', weight: 1.0, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'How well is the service desk performing against KPIs?', weight: 1.2, maturity_level: 'all' },
  { category: 'Process', subcategory: 'ITSM & Service Management', question_text: 'Is there a configuration management database (CMDB) in use?', weight: 1.0, maturity_level: 'all' },
  
  // Project Management
  { category: 'Process', subcategory: 'Project Management', question_text: 'Is there a standardized project management methodology?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Project Management', question_text: 'How effective is IT project portfolio management?', weight: 1.2, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Project Management', question_text: 'Are projects consistently delivered on time and within budget?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Project Management', question_text: 'Is there resource capacity planning for IT projects?', weight: 1.0, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Project Management', question_text: 'How well are project risks identified and managed?', weight: 1.2, maturity_level: 'all' },
  
  // Security Processes
  { category: 'Process', subcategory: 'Security Processes', question_text: 'Is there a comprehensive information security policy?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Security Processes', question_text: 'How mature is the vulnerability management process?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Security Processes', question_text: 'Is there a documented incident response plan?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Security Processes', question_text: 'Are regular security audits and penetration tests conducted?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Security Processes', question_text: 'How effective is access management and identity governance?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Security Processes', question_text: 'Is there a data classification and protection framework?', weight: 1.2, maturity_level: 'all' },
  
  // DevOps & Automation
  { category: 'Process', subcategory: 'DevOps & Automation', question_text: 'How mature is the CI/CD pipeline implementation?', weight: 1.3, maturity_level: 'all', applicable_to: ['cloud', 'devops', 'software'] },
  { category: 'Process', subcategory: 'DevOps & Automation', question_text: 'Is infrastructure-as-code practiced consistently?', weight: 1.2, maturity_level: 'all', applicable_to: ['cloud', 'devops'] },
  { category: 'Process', subcategory: 'DevOps & Automation', question_text: 'How automated are testing and deployment processes?', weight: 1.3, maturity_level: 'all', applicable_to: ['devops', 'software'] },
  { category: 'Process', subcategory: 'DevOps & Automation', question_text: 'Is there automated monitoring and alerting for critical systems?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'DevOps & Automation', question_text: 'How well is configuration management automated?', weight: 1.0, maturity_level: 'all' },
  
  // Compliance & Risk
  { category: 'Process', subcategory: 'Compliance & Risk', question_text: 'Is there a formal IT risk management framework?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Compliance & Risk', question_text: 'How well does IT comply with relevant regulations (GDPR, HIPAA, SOX)?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Compliance & Risk', question_text: 'Are regular compliance audits conducted?', weight: 1.3, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Compliance & Risk', question_text: 'Is there a documented business continuity plan?', weight: 1.5, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Compliance & Risk', question_text: 'How effective is vendor/third-party risk management?', weight: 1.2, maturity_level: 'all' },
  
  // Documentation & Knowledge Management
  { category: 'Process', subcategory: 'Documentation', question_text: 'How comprehensive is IT documentation (runbooks, architecture diagrams)?', weight: 1.2, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Documentation', question_text: 'Is there a centralized knowledge base accessible to all IT staff?', weight: 1.0, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Documentation', question_text: 'Are processes and procedures regularly reviewed and updated?', weight: 1.0, maturity_level: 'all' },
  { category: 'Process', subcategory: 'Documentation', question_text: 'How well documented are disaster recovery procedures?', weight: 1.3, maturity_level: 'all' },

  // ==================== TECHNOLOGY CATEGORY ====================
  // Infrastructure & Network
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'How current and well-maintained is the network infrastructure?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'Is there network redundancy and failover capability?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'How effective is network monitoring and performance management?', weight: 1.3, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'Is network segmentation implemented for security?', weight: 1.3, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'How well does the network handle current and projected capacity needs?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Infrastructure & Network', question_text: 'Is there a documented network architecture with up-to-date diagrams?', weight: 1.0, maturity_level: 'all' },
  
  // Cloud & Virtualization
  { category: 'Technology', subcategory: 'Cloud & Virtualization', question_text: 'What is the level of cloud adoption maturity?', weight: 1.3, maturity_level: 'all', applicable_to: ['cloud', 'aws', 'azure', 'gcp'] },
  { category: 'Technology', subcategory: 'Cloud & Virtualization', question_text: 'Is there a defined cloud strategy (hybrid, multi-cloud, cloud-first)?', weight: 1.2, maturity_level: 'all', applicable_to: ['cloud'] },
  { category: 'Technology', subcategory: 'Cloud & Virtualization', question_text: 'How well optimized are cloud costs and resource utilization?', weight: 1.2, maturity_level: 'all', applicable_to: ['cloud', 'aws', 'azure', 'gcp'] },
  { category: 'Technology', subcategory: 'Cloud & Virtualization', question_text: 'Is virtualization used effectively across the infrastructure?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Cloud & Virtualization', question_text: 'How mature is container orchestration (Kubernetes, Docker)?', weight: 1.2, maturity_level: 'all', applicable_to: ['containers', 'kubernetes', 'docker', 'cloud'] },
  
  // Security Technology
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'How comprehensive is the endpoint protection solution?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'Is there a SIEM or security monitoring platform in place?', weight: 1.3, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'How effective are firewall and intrusion detection/prevention systems?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'Is multi-factor authentication implemented for critical systems?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'How mature is the data loss prevention (DLP) implementation?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Security Technology', question_text: 'Is email security (anti-phishing, encryption) adequately implemented?', weight: 1.3, maturity_level: 'all' },
  
  // Data Management & Storage
  { category: 'Technology', subcategory: 'Data Management', question_text: 'How robust is the backup and recovery infrastructure?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Data Management', question_text: 'Are backup recovery objectives (RPO/RTO) defined and tested?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Data Management', question_text: 'How well managed is data storage capacity and growth?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Data Management', question_text: 'Is there a data lifecycle management strategy?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Data Management', question_text: 'How effective is database management and performance?', weight: 1.2, maturity_level: 'all', applicable_to: ['database', 'sql', 'oracle', 'postgresql'] },
  
  // Applications & Software
  { category: 'Technology', subcategory: 'Applications', question_text: 'How well maintained is the application portfolio?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Applications', question_text: 'Is there an application rationalization strategy?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Applications', question_text: 'How effective is application performance monitoring?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Applications', question_text: 'Are applications regularly patched and updated?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Applications', question_text: 'How well integrated are business applications?', weight: 1.0, maturity_level: 'all' },
  
  // Disaster Recovery & Business Continuity
  { category: 'Technology', subcategory: 'Disaster Recovery', question_text: 'Is there a tested disaster recovery solution for critical systems?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Disaster Recovery', question_text: 'How frequently are DR tests conducted?', weight: 1.3, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Disaster Recovery', question_text: 'Is there geographic redundancy for critical infrastructure?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Disaster Recovery', question_text: 'Are failover procedures automated where possible?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Disaster Recovery', question_text: 'How current is the disaster recovery documentation?', weight: 1.0, maturity_level: 'all' },
  
  // Monitoring & Observability
  { category: 'Technology', subcategory: 'Monitoring & Observability', question_text: 'How comprehensive is infrastructure monitoring coverage?', weight: 1.5, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Monitoring & Observability', question_text: 'Are alerts properly configured to avoid noise and catch critical issues?', weight: 1.3, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Monitoring & Observability', question_text: 'Is there centralized log management and analysis?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Monitoring & Observability', question_text: 'How effective are dashboards for real-time operational visibility?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'Monitoring & Observability', question_text: 'Is there capacity planning based on monitoring data?', weight: 1.0, maturity_level: 'all' },
  
  // End User Computing
  { category: 'Technology', subcategory: 'End User Computing', question_text: 'How standardized and managed is the end-user device fleet?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'End User Computing', question_text: 'Is there mobile device management (MDM) in place?', weight: 1.0, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'End User Computing', question_text: 'How effective are collaboration tools and remote work capabilities?', weight: 1.2, maturity_level: 'all' },
  { category: 'Technology', subcategory: 'End User Computing', question_text: 'Is there an effective patch management process for endpoints?', weight: 1.3, maturity_level: 'all' },
];

// Insert questions
const insert = db.prepare(`
  INSERT OR IGNORE INTO questions (id, category, subcategory, question_text, question_type, weight, maturity_level, applicable_to, tags)
  VALUES (?, ?, ?, ?, 'rating', ?, ?, ?, ?)
`);

const insertAll = db.transaction((items) => {
  for (const item of items) {
    insert.run(
      uuidv4(),
      item.category,
      item.subcategory,
      item.question_text,
      item.weight,
      item.maturity_level || 'all',
      JSON.stringify(item.applicable_to || []),
      JSON.stringify(item.tags || [])
    );
  }
});

insertAll(questions);

console.log(`Seeded ${questions.length} questions successfully!`);
console.log('Question distribution:');
console.log(`  People: ${questions.filter(q => q.category === 'People').length}`);
console.log(`  Process: ${questions.filter(q => q.category === 'Process').length}`);
console.log(`  Technology: ${questions.filter(q => q.category === 'Technology').length}`);

process.exit(0);

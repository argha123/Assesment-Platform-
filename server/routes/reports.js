const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { generateReport } = require('../services/reportEngine');

// Generate report for an assessment
router.post('/generate/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const assessmentId = req.params.assessmentId;
    
    const assessment = db.prepare(`
      SELECT a.*, s.name as scope_name, s.technology_stack, s.focus_areas, s.departments,
        s.infrastructure_type, s.team_size, acc.name as account_name, acc.industry
      FROM assessments a
      JOIN assessment_scopes s ON a.scope_id = s.id
      JOIN accounts acc ON a.account_id = acc.id
      WHERE a.id = ?
    `).get(assessmentId);
    
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.status !== 'completed') return res.status(400).json({ error: 'Assessment must be completed before generating report' });
    
    const responses = db.prepare(`
      SELECT r.*, q.category, q.subcategory, q.question_text, q.weight, q.maturity_level
      FROM responses r 
      JOIN questions q ON r.question_id = q.id 
      WHERE r.assessment_id = ?
    `).all(assessmentId);
    
    const report = generateReport(assessment, responses);
    
    const reportId = uuidv4();
    db.prepare(`
      INSERT INTO reports (id, assessment_id, account_id, report_data, recommendations, action_plan, executive_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reportId, assessmentId, assessment.account_id,
      JSON.stringify(report.data), JSON.stringify(report.recommendations),
      JSON.stringify(report.actionPlan), report.executiveSummary);
    
    res.status(201).json({ id: reportId, ...report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get report by ID
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const report = db.prepare(`
      SELECT r.*, a.title as assessment_title, a.overall_score, a.people_score, a.process_score, a.technology_score,
        acc.name as account_name, acc.industry
      FROM reports r
      JOIN assessments a ON r.assessment_id = a.id
      JOIN accounts acc ON r.account_id = acc.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    // Parse JSON fields
    report.report_data = JSON.parse(report.report_data || '{}');
    report.recommendations = JSON.parse(report.recommendations || '[]');
    report.action_plan = JSON.parse(report.action_plan || '{}');
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reports
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const reports = db.prepare(`
      SELECT r.id, r.generated_at, r.executive_summary, 
        a.title as assessment_title, a.overall_score,
        acc.name as account_name
      FROM reports r
      JOIN assessments a ON r.assessment_id = a.id
      JOIN accounts acc ON r.account_id = acc.id
      ORDER BY r.generated_at DESC
    `).all();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

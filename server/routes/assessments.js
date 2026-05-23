const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { generateAssessmentQuestions, calculateScores } = require('../services/assessmentEngine');

// Get all assessment scopes
router.get('/scopes', (req, res) => {
  try {
    const db = getDb();
    const scopes = db.prepare(`
      SELECT s.*, a.name as account_name 
      FROM assessment_scopes s 
      JOIN accounts a ON s.account_id = a.id 
      ORDER BY s.created_at DESC
    `).all();
    res.json(scopes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assessment scope
router.post('/scopes', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { account_id, name, description, assessment_type, technology_stack, infrastructure_type, team_size, departments, focus_areas } = req.body;
    
    db.prepare(`
      INSERT INTO assessment_scopes (id, account_id, name, description, assessment_type, technology_stack, infrastructure_type, team_size, departments, focus_areas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, account_id, name, description, assessment_type, 
      JSON.stringify(technology_stack), infrastructure_type, team_size, 
      JSON.stringify(departments), JSON.stringify(focus_areas));
    
    const scope = db.prepare('SELECT * FROM assessment_scopes WHERE id = ?').get(id);
    res.status(201).json(scope);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scope by ID
router.get('/scopes/:id', (req, res) => {
  try {
    const db = getDb();
    const scope = db.prepare(`
      SELECT s.*, a.name as account_name 
      FROM assessment_scopes s 
      JOIN accounts a ON s.account_id = a.id 
      WHERE s.id = ?
    `).get(req.params.id);
    if (!scope) return res.status(404).json({ error: 'Scope not found' });
    res.json(scope);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start an assessment
router.post('/start', (req, res) => {
  try {
    const db = getDb();
    const { scope_id } = req.body;
    
    const scope = db.prepare('SELECT * FROM assessment_scopes WHERE id = ?').get(scope_id);
    if (!scope) return res.status(404).json({ error: 'Scope not found' });
    
    const id = uuidv4();
    const title = `Assessment - ${scope.name} - ${new Date().toLocaleDateString()}`;
    
    db.prepare(`
      INSERT INTO assessments (id, scope_id, account_id, title, status)
      VALUES (?, ?, ?, ?, 'in_progress')
    `).run(id, scope_id, scope.account_id, title);
    
    // Generate questions based on scope
    const questions = generateAssessmentQuestions(scope);
    
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    res.status(201).json({ ...assessment, questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assessment details
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const assessment = db.prepare(`
      SELECT a.*, s.name as scope_name, s.technology_stack, s.focus_areas, s.departments,
        acc.name as account_name
      FROM assessments a
      JOIN assessment_scopes s ON a.scope_id = s.id
      JOIN accounts acc ON a.account_id = acc.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    
    const responses = db.prepare('SELECT * FROM responses WHERE assessment_id = ?').all(req.params.id);
    const scope = db.prepare('SELECT * FROM assessment_scopes WHERE id = ?').get(assessment.scope_id);
    const questions = generateAssessmentQuestions(scope);
    
    res.json({ ...assessment, responses, questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all assessments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const assessments = db.prepare(`
      SELECT a.*, s.name as scope_name, acc.name as account_name
      FROM assessments a
      JOIN assessment_scopes s ON a.scope_id = s.id
      JOIN accounts acc ON a.account_id = acc.id
      ORDER BY a.started_at DESC
    `).all();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit responses
router.post('/:id/responses', (req, res) => {
  try {
    const db = getDb();
    const { responses } = req.body;
    const assessmentId = req.params.id;
    
    const insert = db.prepare(`
      INSERT OR REPLACE INTO responses (id, assessment_id, question_id, answer, score, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(
          item.id || uuidv4(),
          assessmentId,
          item.question_id,
          item.answer,
          item.score,
          item.notes || ''
        );
      }
    });
    
    insertMany(responses);
    res.json({ message: 'Responses saved successfully', count: responses.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete assessment
router.post('/:id/complete', (req, res) => {
  try {
    const db = getDb();
    const assessmentId = req.params.id;
    
    const responses = db.prepare('SELECT r.*, q.category, q.weight FROM responses r JOIN questions q ON r.question_id = q.id WHERE r.assessment_id = ?').all(assessmentId);
    
    const scores = calculateScores(responses);
    
    db.prepare(`
      UPDATE assessments SET status='completed', completed_at=CURRENT_TIMESTAMP,
        overall_score=?, people_score=?, process_score=?, technology_score=?
      WHERE id=?
    `).run(scores.overall, scores.people, scores.process, scores.technology, assessmentId);
    
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId);
    res.json({ ...assessment, scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get comments for an assessment
router.get('/comments/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const comments = db.prepare(`
      SELECT * FROM comments WHERE assessment_id = ? ORDER BY created_at DESC
    `).all(req.params.assessmentId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/comments', (req, res) => {
  try {
    const db = getDb();
    const { assessment_id, question_id, user_name, content, parent_id } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, assessment_id, question_id, user_id, user_name, content, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, assessment_id, question_id || null, req.body.user_id || 'system', user_name || 'Anonymous', content, parent_id || null);
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignments for an assessment
router.get('/assignments/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const assignments = db.prepare(`
      SELECT * FROM assessment_assignments WHERE assessment_id = ? ORDER BY assigned_at DESC
    `).all(req.params.assessmentId);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assignment
router.post('/assignments', (req, res) => {
  try {
    const db = getDb();
    const { assessment_id, user_id, user_name, category } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO assessment_assignments (id, assessment_id, user_id, user_name, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, assessment_id, user_id, user_name, category);
    const assignment = db.prepare('SELECT * FROM assessment_assignments WHERE id = ?').get(id);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update assignment status
router.put('/assignments/:id', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare(`UPDATE assessment_assignments SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?`).run(status, status, req.params.id);
    const assignment = db.prepare('SELECT * FROM assessment_assignments WHERE id = ?').get(req.params.id);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for user
router.get('/notifications/:userId', (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.params.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

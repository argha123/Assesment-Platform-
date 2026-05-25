const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all action items (with filters)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { assessment_id, status, priority, assignee_id, phase } = req.query;
    let query = 'SELECT * FROM action_items WHERE 1=1';
    const params = [];
    if (assessment_id) { query += ' AND assessment_id = ?'; params.push(assessment_id); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (assignee_id) { query += ' AND assignee_id = ?'; params.push(assignee_id); }
    if (phase) { query += ' AND phase = ?'; params.push(phase); }
    query += ' ORDER BY CASE priority WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, due_date';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create action item
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { assessment_id, report_id, title, description, category, priority, assignee_id, assignee_name, due_date, effort, impact, phase } = req.body;
    db.prepare(`
      INSERT INTO action_items (id, assessment_id, report_id, title, description, category, priority, assignee_id, assignee_name, due_date, effort, impact, phase)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, assessment_id, report_id || null, title, description || '', category || '', priority || 'medium', assignee_id || null, assignee_name || null, due_date || null, effort || '', impact || '', phase || '');
    const item = db.prepare('SELECT * FROM action_items WHERE id = ?').get(id);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update action item
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { title, description, priority, status, assignee_id, assignee_name, due_date, progress, notes } = req.body;
    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (assignee_id !== undefined) { updates.push('assignee_id = ?'); values.push(assignee_id); }
    if (assignee_name !== undefined) { updates.push('assignee_name = ?'); values.push(assignee_name); }
    if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
    if (progress !== undefined) { updates.push('progress = ?'); values.push(progress); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (status === 'done') { updates.push('completed_at = CURRENT_TIMESTAMP'); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    db.prepare(`UPDATE action_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const item = db.prepare('SELECT * FROM action_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get burn-down data
router.get('/burndown/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM action_items WHERE assessment_id = ? ORDER BY created_at').all(req.params.assessmentId);
    const total = items.length;
    const completed = items.filter(i => i.status === 'done').length;
    const byPhase = {
      thirtyDays: items.filter(i => i.phase === '30'),
      sixtyDays: items.filter(i => i.phase === '60'),
      ninetyDays: items.filter(i => i.phase === '90')
    };
    const byStatus = {
      todo: items.filter(i => i.status === 'todo').length,
      in_progress: items.filter(i => i.status === 'in_progress').length,
      review: items.filter(i => i.status === 'review').length,
      done: completed
    };
    res.json({ total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0, byPhase, byStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete action item
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM action_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Action item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

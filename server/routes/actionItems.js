const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all action items (with filters)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { assessment_id, status, priority, assignee_id, phase } = req.query;
    let query = `SELECT ai.*, a.title as assessment_title, acc.name as account_name 
      FROM action_items ai 
      LEFT JOIN assessments a ON ai.assessment_id = a.id 
      LEFT JOIN accounts acc ON a.account_id = acc.id 
      WHERE 1=1`;
    const params = [];
    if (assessment_id) { query += ' AND ai.assessment_id = ?'; params.push(assessment_id); }
    if (status) { query += ' AND ai.status = ?'; params.push(status); }
    if (priority) { query += ' AND ai.priority = ?'; params.push(priority); }
    if (assignee_id) { query += ' AND ai.assignee_id = ?'; params.push(assignee_id); }
    if (phase) { query += ' AND ai.phase = ?'; params.push(phase); }
    query += " ORDER BY CASE ai.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, ai.due_date";
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
    const { assessment_id, report_id, title, description, category, priority, assignee_id, assignee_name, due_date, effort, impact, phase, created_by } = req.body;
    db.prepare(`
      INSERT INTO action_items (id, assessment_id, report_id, title, description, category, priority, assignee_id, assignee_name, due_date, effort, impact, phase, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, assessment_id, report_id || null, title, description || '', category || '', priority || 'medium', assignee_id || null, assignee_name || null, due_date || null, effort || '', impact || '', phase || '', created_by || null);
    
    // Log creation
    db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), id, 'created', 'todo', created_by || 'System', `Action item created: "${title}"`);
    
    if (assignee_name) {
      db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), id, 'assigned', assignee_name, created_by || 'System', `Assigned to ${assignee_name}`);
    }
    
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
    const { title, description, priority, status, assignee_id, assignee_name, due_date, progress, notes, updated_by } = req.body;
    
    // Get current item for comparison (logging)
    const current = db.prepare('SELECT * FROM action_items WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Action item not found' });
    
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
    
    // Log changes
    const userName = updated_by || 'System';
    
    if (status !== undefined && status !== current.status) {
      db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, from_value, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, 'status_change', current.status, status, userName, `Status changed from "${current.status}" to "${status}"`);
    }
    
    if (assignee_name !== undefined && assignee_name !== current.assignee_name) {
      db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, from_value, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, 'assigned', current.assignee_name || 'Unassigned', assignee_name || 'Unassigned', userName, `Reassigned from "${current.assignee_name || 'Unassigned'}" to "${assignee_name || 'Unassigned'}"`);
    }
    
    if (priority !== undefined && priority !== current.priority) {
      db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, from_value, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, 'priority_change', current.priority, priority, userName, `Priority changed from "${current.priority}" to "${priority}"`);
    }
    
    if (notes !== undefined && notes !== current.notes && notes) {
      db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, to_value, user_name, note) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, 'note_added', notes, userName, `Note added`);
    }
    
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

// Get activity logs for an action item
router.get('/:id/logs', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM action_item_logs WHERE action_item_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a manual note/log entry
router.post('/:id/notes', (req, res) => {
  try {
    const db = getDb();
    const { note, user_name } = req.body;
    if (!note) return res.status(400).json({ error: 'Note is required' });
    const id = uuidv4();
    db.prepare(`INSERT INTO action_item_logs (id, action_item_id, action, user_name, note) VALUES (?, ?, ?, ?, ?)`)
      .run(id, req.params.id, 'note_added', user_name || 'System', note);
    // Also update the notes field on the action item
    const current = db.prepare('SELECT notes FROM action_items WHERE id = ?').get(req.params.id);
    const existingNotes = current?.notes || '';
    const timestamp = new Date().toISOString().split('T')[0];
    const updatedNotes = existingNotes ? `${existingNotes}\n[${timestamp}] ${note}` : `[${timestamp}] ${note}`;
    db.prepare('UPDATE action_items SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updatedNotes, req.params.id);
    const log = db.prepare('SELECT * FROM action_item_logs WHERE id = ?').get(id);
    res.status(201).json(log);
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

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get audit logs (with filters)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { entity_type, user_id, action, limit: lmt } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (user_id) { query += ' AND user_id = ?'; params.push(user_id); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(lmt) || 100);
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create audit log entry (internal use)
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { user_id, user_name, action, entity_type, entity_id, details, ip_address } = req.body;
    db.prepare(`
      INSERT INTO audit_log (id, user_id, user_name, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id || null, user_name || null, action, entity_type || null, entity_id || null, details || null, ip_address || null);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

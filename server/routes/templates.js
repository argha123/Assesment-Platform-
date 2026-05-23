const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all templates
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { template_type, industry } = req.query;
    let query = 'SELECT * FROM assessment_templates WHERE 1=1';
    const params = [];
    if (template_type) { query += ' AND template_type = ?'; params.push(template_type); }
    if (industry) { query += ' AND (industry = ? OR industry IS NULL)'; params.push(industry); }
    query += ' ORDER BY is_default DESC, name';
    const templates = db.prepare(query).all(...params);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const template = db.prepare('SELECT * FROM assessment_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { name, description, template_type, industry, question_ids, focus_areas, compliance_frameworks } = req.body;
    db.prepare(`
      INSERT INTO assessment_templates (id, name, description, template_type, industry, question_ids, focus_areas, compliance_frameworks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', template_type, industry || null, JSON.stringify(question_ids || []), JSON.stringify(focus_areas || []), JSON.stringify(compliance_frameworks || []));
    const template = db.prepare('SELECT * FROM assessment_templates WHERE id = ?').get(id);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

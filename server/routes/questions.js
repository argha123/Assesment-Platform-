const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all questions
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, subcategory, search } = req.query;
    
    let query = 'SELECT * FROM questions';
    const params = [];
    const conditions = [];
    
    if (category) {
      conditions.push('LOWER(category) = ?');
      params.push(category.toLowerCase());
    }
    if (subcategory) {
      conditions.push('subcategory = ?');
      params.push(subcategory);
    }
    if (search) {
      conditions.push('(question_text LIKE ? OR subcategory LIKE ? OR tags LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY category, subcategory, weight DESC';
    
    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get question categories
router.get('/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT category, subcategory, COUNT(*) as count 
      FROM questions 
      GROUP BY category, subcategory 
      ORDER BY category, subcategory
    `).all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single question
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create question
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { category, subcategory, question_text, question_type, options, weight, maturity_level, applicable_to, tags } = req.body;
    
    if (!category || !subcategory || !question_text) {
      return res.status(400).json({ error: 'category, subcategory, and question_text are required.' });
    }

    db.prepare(`
      INSERT INTO questions (id, category, subcategory, question_text, question_type, options, weight, maturity_level, applicable_to, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, category, subcategory, question_text, question_type || 'rating', 
      JSON.stringify(options || []), weight || 1.0, maturity_level || null, 
      JSON.stringify(applicable_to || []), JSON.stringify(tags || []));
    
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    req.audit({ action: 'create', entity_type: 'question', entity_id: id, details: `Question created in ${category}/${subcategory}` });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update question
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { category, subcategory, question_text, question_type, options, weight, maturity_level, applicable_to, tags } = req.body;
    
    const updates = [];
    const values = [];

    if (category !== undefined)      { updates.push('category = ?');      values.push(category); }
    if (subcategory !== undefined)   { updates.push('subcategory = ?');   values.push(subcategory); }
    if (question_text !== undefined) { updates.push('question_text = ?'); values.push(question_text); }
    if (question_type !== undefined) { updates.push('question_type = ?'); values.push(question_type); }
    if (options !== undefined)       { updates.push('options = ?');       values.push(JSON.stringify(options)); }
    if (weight !== undefined)        { updates.push('weight = ?');        values.push(weight); }
    if (maturity_level !== undefined){ updates.push('maturity_level = ?');values.push(maturity_level); }
    if (applicable_to !== undefined) { updates.push('applicable_to = ?'); values.push(JSON.stringify(applicable_to)); }
    if (tags !== undefined)          { updates.push('tags = ?');          values.push(JSON.stringify(tags)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(req.params.id);
    db.prepare(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    req.audit({ action: 'update', entity_type: 'question', entity_id: req.params.id, details: `Question updated in ${question.category}/${question.subcategory}` });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete question
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const q = db.prepare('SELECT category, subcategory FROM questions WHERE id = ?').get(req.params.id);
    const result = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Question not found' });
    req.audit({ action: 'delete', entity_type: 'question', entity_id: req.params.id, details: `Question deleted from ${q?.category || '?'}/${q?.subcategory || '?'}` });
    res.json({ message: 'Question deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

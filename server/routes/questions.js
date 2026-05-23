const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all questions
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, subcategory } = req.query;
    
    let query = 'SELECT * FROM questions';
    const params = [];
    const conditions = [];
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (subcategory) {
      conditions.push('subcategory = ?');
      params.push(subcategory);
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

// Create question
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { category, subcategory, question_text, question_type, options, weight, maturity_level, applicable_to, tags } = req.body;
    
    db.prepare(`
      INSERT INTO questions (id, category, subcategory, question_text, question_type, options, weight, maturity_level, applicable_to, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, category, subcategory, question_text, question_type || 'rating', 
      JSON.stringify(options), weight || 1.0, maturity_level, 
      JSON.stringify(applicable_to), JSON.stringify(tags));
    
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

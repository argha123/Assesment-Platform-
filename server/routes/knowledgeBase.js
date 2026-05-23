const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all articles
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, subcategory, search } = req.query;
    let query = 'SELECT * FROM knowledge_base WHERE is_published = 1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (subcategory) { query += ' AND subcategory = ?'; params.push(subcategory); }
    if (search) { query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY updated_at DESC';
    const articles = db.prepare(query).all(...params);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create article
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { title, content, category, subcategory, tags, author_id } = req.body;
    db.prepare(`
      INSERT INTO knowledge_base (id, title, content, category, subcategory, tags, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content, category, subcategory || '', JSON.stringify(tags || []), author_id || null);
    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id);
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { title, content, category, subcategory, tags } = req.body;
    db.prepare(`UPDATE knowledge_base SET title=COALESCE(?,title), content=COALESCE(?,content), category=COALESCE(?,category), subcategory=COALESCE(?,subcategory), tags=COALESCE(?,tags), updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(title, content, category, subcategory, tags ? JSON.stringify(tags) : null, req.params.id);
    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.id);
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete article
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT DISTINCT category, subcategory, COUNT(*) as count FROM knowledge_base WHERE is_published = 1 GROUP BY category, subcategory').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

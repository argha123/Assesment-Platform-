const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../models/database');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// Upload evidence
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const db = getDb();
    const id = uuidv4();
    const { assessment_id, question_id, user_id, description } = req.body;
    
    db.prepare(`
      INSERT INTO evidence (id, assessment_id, question_id, user_id, filename, original_name, mime_type, file_size, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, assessment_id, question_id || null, user_id || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, description || '');
    
    const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get evidence for assessment
router.get('/assessment/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const evidence = db.prepare('SELECT * FROM evidence WHERE assessment_id = ? ORDER BY uploaded_at DESC').all(req.params.assessmentId);
    res.json(evidence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get evidence for a specific question
router.get('/question/:assessmentId/:questionId', (req, res) => {
  try {
    const db = getDb();
    const evidence = db.prepare('SELECT * FROM evidence WHERE assessment_id = ? AND question_id = ?').all(req.params.assessmentId, req.params.questionId);
    res.json(evidence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download evidence file
router.get('/download/:id', (req, res) => {
  try {
    const db = getDb();
    const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    if (!evidence) return res.status(404).json({ error: 'File not found' });
    const filePath = path.join(uploadDir, evidence.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(filePath, evidence.original_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete evidence
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' });
    const filePath = path.join(uploadDir, evidence.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
    res.json({ message: 'Evidence deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all accounts
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single account
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    const scopes = db.prepare('SELECT * FROM assessment_scopes WHERE account_id = ?').all(req.params.id);
    const assessments = db.prepare('SELECT * FROM assessments WHERE account_id = ?').all(req.params.id);
    
    res.json({ ...account, scopes, assessments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create account
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { name, industry, company_size, contact_name, contact_email, contact_phone, sdm_name, du_head_name, ssh_name, description } = req.body;
    
    db.prepare(`
      INSERT INTO accounts (id, name, industry, company_size, contact_name, contact_email, contact_phone, sdm_name, du_head_name, ssh_name, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, industry, company_size, contact_name, contact_email, contact_phone, sdm_name || null, du_head_name || null, ssh_name || null, description);
    
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    req.audit({ action: 'create', entity_type: 'account', entity_id: id, details: `Account created: "${name}"` });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, industry, company_size, contact_name, contact_email, contact_phone, sdm_name, du_head_name, ssh_name, description } = req.body;
    
    db.prepare(`
      UPDATE accounts SET name=?, industry=?, company_size=?, contact_name=?, contact_email=?, contact_phone=?, sdm_name=?, du_head_name=?, ssh_name=?, description=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, industry, company_size, contact_name, contact_email, contact_phone, sdm_name || null, du_head_name || null, ssh_name || null, description, req.params.id);
    
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare('SELECT name FROM accounts WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
    req.audit({ action: 'delete', entity_type: 'account', entity_id: req.params.id, details: `Account deleted: "${account?.name || 'unknown'}"` });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

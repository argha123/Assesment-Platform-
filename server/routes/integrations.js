const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// === WEBHOOKS ===
router.get('/webhooks', (req, res) => {
  try {
    const db = getDb();
    const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all();
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhooks', (req, res) => {
  try {
    const db = getDb();
    const { name, url, events, secret } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO webhooks (id, name, url, events, secret) VALUES (?, ?, ?, ?, ?)').run(id, name, url, JSON.stringify(events), secret || '');
    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/webhooks/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger webhook (internal use)
router.post('/webhooks/trigger', (req, res) => {
  try {
    const db = getDb();
    const { event, payload } = req.body;
    const webhooks = db.prepare('SELECT * FROM webhooks WHERE is_active = 1').all();
    const triggered = [];
    webhooks.forEach(webhook => {
      const events = JSON.parse(webhook.events || '[]');
      if (events.includes(event) || events.includes('*')) {
        // In production, this would make HTTP POST to webhook.url
        triggered.push({ id: webhook.id, name: webhook.name, url: webhook.url });
        db.prepare('UPDATE webhooks SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?').run(webhook.id);
      }
    });
    res.json({ triggered, count: triggered.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === JIRA INTEGRATION (Config & Mock) ===
router.post('/jira/create-issue', (req, res) => {
  try {
    const { title, description, priority, assignee, project_key } = req.body;
    // Mock Jira issue creation - in production would call Jira REST API
    const mockIssue = {
      key: `${project_key || 'ASSESS'}-${Math.floor(Math.random() * 9000) + 1000}`,
      summary: title,
      description,
      priority: priority || 'Medium',
      assignee: assignee || 'Unassigned',
      status: 'To Do',
      created: new Date().toISOString(),
      url: `https://jira.example.com/browse/${project_key || 'ASSESS'}-${Math.floor(Math.random() * 9000) + 1000}`
    };
    res.status(201).json({ message: 'Jira issue created (mock)', issue: mockIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === SLACK INTEGRATION (Mock) ===
router.post('/slack/notify', (req, res) => {
  try {
    const { channel, message, webhook_url } = req.body;
    // Mock Slack notification - in production would POST to Slack webhook
    res.json({ 
      message: 'Slack notification sent (mock)', 
      payload: { channel: channel || '#assessments', text: message, sent_at: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === EXPORT INTEGRATIONS ===
router.get('/export/json/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const assessment = db.prepare(`
      SELECT a.*, s.name as scope_name, s.technology_stack, s.focus_areas,
        acc.name as account_name, acc.industry
      FROM assessments a
      JOIN assessment_scopes s ON a.scope_id = s.id
      JOIN accounts acc ON a.account_id = acc.id WHERE a.id = ?
    `).get(req.params.assessmentId);
    const responses = db.prepare('SELECT r.*, q.question_text, q.category, q.subcategory FROM responses r JOIN questions q ON r.question_id = q.id WHERE r.assessment_id = ?').all(req.params.assessmentId);
    res.json({ assessment, responses, exported_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

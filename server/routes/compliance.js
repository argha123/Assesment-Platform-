const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all frameworks
router.get('/frameworks', (req, res) => {
  try {
    const db = getDb();
    const frameworks = db.prepare(`
      SELECT cf.*, 
        (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = cf.id) as control_count,
        (SELECT COUNT(*) FROM compliance_controls cc JOIN question_control_mapping qcm ON cc.id = qcm.control_id WHERE cc.framework_id = cf.id) as mapped_count
      FROM compliance_frameworks cf ORDER BY cf.name
    `).all();
    res.json(frameworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get framework detail (with controls)
router.get('/frameworks/:id', (req, res) => {
  try {
    const db = getDb();
    const framework = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(req.params.id);
    if (!framework) return res.status(404).json({ error: 'Framework not found' });
    const controls = db.prepare(`
      SELECT cc.*,
        (SELECT COUNT(*) FROM question_control_mapping WHERE control_id = cc.id) as mapping_count
      FROM compliance_controls cc
      WHERE cc.framework_id = ? ORDER BY cc.control_id
    `).all(req.params.id);
    res.json({ ...framework, controls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update framework metadata
router.put('/frameworks/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, description, version } = req.body;
    db.prepare(`UPDATE compliance_frameworks SET name=COALESCE(?,name), description=COALESCE(?,description), version=COALESCE(?,version) WHERE id=?`)
      .run(name, description, version, req.params.id);
    const fw = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(req.params.id);
    res.json(fw);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get controls for a framework
router.get('/frameworks/:id/controls', (req, res) => {
  try {
    const db = getDb();
    const controls = db.prepare('SELECT * FROM compliance_controls WHERE framework_id = ? ORDER BY control_id').all(req.params.id);
    res.json(controls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance gap report for an assessment
router.get('/gap-report/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const { framework_id } = req.query;
    
    // Get all controls for the framework
    let controls;
    if (framework_id) {
      controls = db.prepare(`
        SELECT cc.*, cf.name as framework_name, cf.code as framework_code
        FROM compliance_controls cc
        JOIN compliance_frameworks cf ON cc.framework_id = cf.id
        WHERE cc.framework_id = ?
      `).all(framework_id);
    } else {
      controls = db.prepare(`
        SELECT cc.*, cf.name as framework_name, cf.code as framework_code
        FROM compliance_controls cc
        JOIN compliance_frameworks cf ON cc.framework_id = cf.id
      `).all();
    }

    // Get responses for the assessment
    const responses = db.prepare(`
      SELECT r.*, q.category, q.subcategory 
      FROM responses r 
      JOIN questions q ON r.question_id = q.id 
      WHERE r.assessment_id = ?
    `).all(req.params.assessmentId);

    // Map controls to question scores
    const mappings = db.prepare(`
      SELECT qcm.*, cc.control_id as ctrl_id, cc.control_name, cc.framework_id,
        cf.name as framework_name, cf.code as framework_code
      FROM question_control_mapping qcm
      JOIN compliance_controls cc ON qcm.control_id = cc.id
      JOIN compliance_frameworks cf ON cc.framework_id = cf.id
    `).all();

    const responseMap = {};
    responses.forEach(r => { responseMap[r.question_id] = r; });

    const controlScores = controls.map(control => {
      const relevantMappings = mappings.filter(m => m.control_id === control.id);
      const scores = relevantMappings
        .map(m => responseMap[m.question_id]?.score)
        .filter(s => s !== undefined);
      
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return {
        ...control,
        score: avgScore ? Math.round(avgScore * 100) / 100 : null,
        status: avgScore === null ? 'not_assessed' : avgScore >= 7 ? 'compliant' : avgScore >= 5 ? 'partial' : 'non_compliant',
        questions_mapped: relevantMappings.length,
        questions_answered: scores.length
      };
    });

    const summary = {
      total_controls: controls.length,
      compliant: controlScores.filter(c => c.status === 'compliant').length,
      partial: controlScores.filter(c => c.status === 'partial').length,
      non_compliant: controlScores.filter(c => c.status === 'non_compliant').length,
      not_assessed: controlScores.filter(c => c.status === 'not_assessed').length,
      compliance_percentage: controls.length > 0 ? Math.round((controlScores.filter(c => c.status === 'compliant').length / controls.length) * 100) : 0
    };

    res.json({ summary, controls: controlScores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Map question to control
router.post('/mapping', (req, res) => {
  try {
    const db = getDb();
    const { question_id, control_id } = req.body;
    const id = uuidv4();
    db.prepare('INSERT OR IGNORE INTO question_control_mapping (id, question_id, control_id) VALUES (?, ?, ?)').run(id, question_id, control_id);
    res.status(201).json({ id, question_id, control_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk replace mappings for a control
router.put('/controls/:id/mappings', (req, res) => {
  try {
    const db = getDb();
    const { question_ids } = req.body;
    if (!Array.isArray(question_ids)) {
      return res.status(400).json({ error: 'question_ids must be an array' });
    }
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM question_control_mapping WHERE control_id = ?').run(req.params.id);
      const insert = db.prepare('INSERT INTO question_control_mapping (id, question_id, control_id) VALUES (?, ?, ?)');
      question_ids.forEach(qid => insert.run(uuidv4(), qid, req.params.id));
    });
    tx();
    const mappings = db.prepare('SELECT * FROM question_control_mapping WHERE control_id = ?').all(req.params.id);
    res.json({ count: mappings.length, mappings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mappings for a control (with question detail)
router.get('/controls/:id/mappings', (req, res) => {
  try {
    const db = getDb();
    const mappings = db.prepare(`
      SELECT qcm.*, q.question_text, q.category, q.subcategory
      FROM question_control_mapping qcm
      JOIN questions q ON qcm.question_id = q.id
      WHERE qcm.control_id = ?
    `).all(req.params.id);
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a control
router.put('/controls/:id', (req, res) => {
  try {
    const db = getDb();
    const { control_id, control_name, description, category } = req.body;
    db.prepare(`UPDATE compliance_controls SET 
      control_id=COALESCE(?,control_id), 
      control_name=COALESCE(?,control_name), 
      description=COALESCE(?,description), 
      category=COALESCE(?,category) WHERE id=?`)
      .run(control_id, control_name, description, category, req.params.id);
    const ctrl = db.prepare('SELECT * FROM compliance_controls WHERE id = ?').get(req.params.id);
    res.json(ctrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a control
router.post('/frameworks/:id/controls', (req, res) => {
  try {
    const db = getDb();
    const { control_id, control_name, description, category } = req.body;
    if (!control_id || !control_name) return res.status(400).json({ error: 'control_id and control_name required' });
    const id = uuidv4();
    db.prepare(`INSERT INTO compliance_controls (id, framework_id, control_id, control_name, description, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, req.params.id, control_id, control_name, description || '', category || '');
    const ctrl = db.prepare('SELECT * FROM compliance_controls WHERE id = ?').get(id);
    res.status(201).json(ctrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a control
router.delete('/controls/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM compliance_controls WHERE id = ?').run(req.params.id);
    res.json({ message: 'Control deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

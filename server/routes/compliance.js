const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all frameworks
router.get('/frameworks', (req, res) => {
  try {
    const db = getDb();
    const frameworks = db.prepare('SELECT * FROM compliance_frameworks ORDER BY name').all();
    res.json(frameworks);
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

module.exports = router;

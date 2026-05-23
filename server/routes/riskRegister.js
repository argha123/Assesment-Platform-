const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get risk register for assessment
router.get('/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const risks = db.prepare('SELECT * FROM risk_register WHERE assessment_id = ? ORDER BY risk_score DESC').all(req.params.assessmentId);
    
    const summary = {
      total: risks.length,
      critical: risks.filter(r => r.risk_score >= 8).length,
      high: risks.filter(r => r.risk_score >= 6 && r.risk_score < 8).length,
      medium: risks.filter(r => r.risk_score >= 4 && r.risk_score < 6).length,
      low: risks.filter(r => r.risk_score < 4).length,
      total_financial_exposure: risks.reduce((sum, r) => sum + (r.financial_impact || 0), 0),
      open: risks.filter(r => r.status === 'open').length,
      mitigated: risks.filter(r => r.status === 'mitigated').length
    };

    res.json({ summary, risks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create risk
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const { assessment_id, risk_title, description, category, likelihood, impact, financial_impact, mitigation, owner_id } = req.body;
    const risk_score = ((likelihood || 5) * (impact || 5)) / 10; // Normalized 1-10

    db.prepare(`
      INSERT INTO risk_register (id, assessment_id, risk_title, description, category, likelihood, impact, risk_score, financial_impact, mitigation, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, assessment_id, risk_title, description || '', category || '', likelihood || 5, impact || 5, risk_score, financial_impact || 0, mitigation || '', owner_id || null);

    const risk = db.prepare('SELECT * FROM risk_register WHERE id = ?').get(id);
    res.status(201).json(risk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update risk
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { risk_title, description, likelihood, impact, financial_impact, mitigation, status, owner_id } = req.body;
    const risk_score = ((likelihood || 5) * (impact || 5)) / 10;
    
    db.prepare(`
      UPDATE risk_register SET risk_title=COALESCE(?,risk_title), description=COALESCE(?,description), 
        likelihood=COALESCE(?,likelihood), impact=COALESCE(?,impact), risk_score=?,
        financial_impact=COALESCE(?,financial_impact), mitigation=COALESCE(?,mitigation),
        status=COALESCE(?,status), owner_id=COALESCE(?,owner_id) WHERE id=?
    `).run(risk_title, description, likelihood, impact, risk_score, financial_impact, mitigation, status, owner_id, req.params.id);

    const risk = db.prepare('SELECT * FROM risk_register WHERE id = ?').get(req.params.id);
    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROI Calculator
router.post('/roi-calculate', (req, res) => {
  try {
    const { risks, investments } = req.body;
    // Simple ROI calculation: Risk Reduction / Investment Cost
    const totalRiskExposure = (risks || []).reduce((sum, r) => sum + (r.financial_impact || 0), 0);
    const totalInvestment = (investments || []).reduce((sum, i) => sum + (i.cost || 0), 0);
    const estimatedRiskReduction = totalRiskExposure * 0.6; // Assume 60% reduction with mitigation
    const roi = totalInvestment > 0 ? ((estimatedRiskReduction - totalInvestment) / totalInvestment) * 100 : 0;
    const paybackMonths = totalInvestment > 0 ? Math.ceil(totalInvestment / (estimatedRiskReduction / 12)) : 0;

    res.json({
      total_risk_exposure: totalRiskExposure,
      total_investment: totalInvestment,
      estimated_risk_reduction: estimatedRiskReduction,
      net_benefit: estimatedRiskReduction - totalInvestment,
      roi_percentage: Math.round(roi),
      payback_months: paybackMonths,
      recommendation: roi > 100 ? 'Strongly recommended' : roi > 50 ? 'Recommended' : roi > 0 ? 'Consider' : 'Needs justification'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

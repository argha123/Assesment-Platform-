const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get benchmarks for an industry
router.get('/:industry', (req, res) => {
  try {
    const db = getDb();
    const { company_size } = req.query;
    let query = 'SELECT * FROM industry_benchmarks WHERE industry = ?';
    const params = [req.params.industry];
    if (company_size) { query += ' AND company_size = ?'; params.push(company_size); }
    const benchmarks = db.prepare(query).all(...params);
    res.json(benchmarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare assessment against benchmarks
router.get('/compare/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const assessment = db.prepare(`
      SELECT a.*, acc.industry, acc.company_size FROM assessments a
      JOIN accounts acc ON a.account_id = acc.id WHERE a.id = ?
    `).get(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const benchmarks = db.prepare('SELECT * FROM industry_benchmarks WHERE industry = ?').all(assessment.industry || 'Technology');
    
    const comparison = {
      assessment_scores: {
        overall: assessment.overall_score,
        people: assessment.people_score,
        process: assessment.process_score,
        technology: assessment.technology_score
      },
      industry: assessment.industry,
      benchmarks: benchmarks.reduce((acc, b) => {
        acc[`${b.category}_${b.subcategory || 'overall'}`] = {
          avg: b.avg_score, median: b.median_score,
          top_quartile: b.top_quartile, bottom_quartile: b.bottom_quartile,
          sample_size: b.sample_size
        };
        return acc;
      }, {}),
      position: {}
    };

    // Calculate position relative to benchmarks
    ['people', 'process', 'technology'].forEach(cat => {
      const benchmark = benchmarks.find(b => b.category === cat && !b.subcategory);
      if (benchmark && assessment[`${cat}_score`]) {
        const score = assessment[`${cat}_score`];
        comparison.position[cat] = {
          score,
          vs_avg: score - (benchmark.avg_score || 0),
          percentile: score >= (benchmark.top_quartile || 10) ? 'top_25' : score >= (benchmark.median_score || 5) ? 'above_median' : score >= (benchmark.bottom_quartile || 3) ? 'below_median' : 'bottom_25'
        };
      }
    });

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update benchmarks (admin - typically from aggregated data)
router.post('/update', (req, res) => {
  try {
    const db = getDb();
    const { industry, company_size, category, subcategory, avg_score, median_score, top_quartile, bottom_quartile, sample_size } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO industry_benchmarks (id, industry, company_size, category, subcategory, avg_score, median_score, top_quartile, bottom_quartile, sample_size, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, industry, company_size, category, subcategory, avg_score, median_score, top_quartile, bottom_quartile, sample_size || 0);
    res.status(201).json({ id, message: 'Benchmark updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

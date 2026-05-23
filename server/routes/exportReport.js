const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { getDb } = require('../models/database');

// PDF Export
router.get('/pdf/:reportId', (req, res) => {
  try {
    const db = getDb();
    const report = db.prepare(`
      SELECT r.*, a.title as assessment_title, a.overall_score, a.people_score, a.process_score, a.technology_score,
        acc.name as account_name, acc.industry
      FROM reports r JOIN assessments a ON r.assessment_id = a.id JOIN accounts acc ON r.account_id = acc.id WHERE r.id = ?
    `).get(req.params.reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.account_name}-assessment-report.pdf"`);
    doc.pipe(res);

    // Title page
    doc.fontSize(24).font('Helvetica-Bold').text('IT Infrastructure Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).font('Helvetica').text(report.account_name, { align: 'center' });
    doc.fontSize(12).text(report.assessment_title, { align: 'center' });
    doc.moveDown();
    doc.text(`Generated: ${new Date(report.generated_at).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(3);

    // Scores
    doc.fontSize(18).font('Helvetica-Bold').text('Assessment Scores');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Overall Score: ${report.overall_score}/10`);
    doc.text(`People: ${report.people_score}/10`);
    doc.text(`Process: ${report.process_score}/10`);
    doc.text(`Technology: ${report.technology_score}/10`);
    doc.moveDown(2);

    // Executive Summary
    doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica').text(report.executive_summary || 'No summary available');
    doc.moveDown(2);

    // Recommendations
    const recommendations = JSON.parse(report.recommendations || '[]');
    if (recommendations.length > 0) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('Recommendations');
      doc.moveDown();
      recommendations.forEach((rec, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        doc.fontSize(10).font('Helvetica').text(rec.description);
        doc.text(`Category: ${rec.category} | Effort: ${rec.effort} | Timeline: ${rec.timeline}`);
        doc.moveDown();
      });
    }

    // Action Plan
    const actionPlan = JSON.parse(report.action_plan || '{}');
    if (actionPlan.thirtyDays) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('30-60-90 Day Action Plan');
      doc.moveDown();
      
      ['thirtyDays', 'sixtyDays', 'ninetyDays'].forEach(phase => {
        const plan = actionPlan[phase];
        if (plan) {
          doc.fontSize(14).font('Helvetica-Bold').text(plan.title);
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica');
          (plan.objectives || []).forEach(obj => doc.text(`  • ${obj}`));
          doc.moveDown();
          (plan.actions || []).forEach(action => {
            doc.text(`  → ${action.title} (${action.category}, ${action.effort} effort)`);
          });
          doc.moveDown();
        }
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excel Export
router.get('/excel/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const assessment = db.prepare(`
      SELECT a.*, acc.name as account_name FROM assessments a 
      JOIN accounts acc ON a.account_id = acc.id WHERE a.id = ?
    `).get(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const responses = db.prepare(`
      SELECT r.score, r.notes, r.answered_at, q.category, q.subcategory, q.question_text, q.weight
      FROM responses r JOIN questions q ON r.question_id = q.id WHERE r.assessment_id = ?
    `).all(req.params.assessmentId);

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['IT Infrastructure Assessment Report'],
      ['Account', assessment.account_name],
      ['Assessment', assessment.title],
      ['Status', assessment.status],
      ['Overall Score', assessment.overall_score],
      ['People Score', assessment.people_score],
      ['Process Score', assessment.process_score],
      ['Technology Score', assessment.technology_score],
      ['Started', assessment.started_at],
      ['Completed', assessment.completed_at || 'In Progress']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    // Responses sheet
    const responseData = [['Category', 'Subcategory', 'Question', 'Score', 'Weight', 'Notes', 'Answered At']];
    responses.forEach(r => responseData.push([r.category, r.subcategory, r.question_text, r.score, r.weight, r.notes, r.answered_at]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(responseData), 'Responses');

    // Category Summary sheet
    const categories = ['People', 'Process', 'Technology'];
    const catData = [['Category', 'Avg Score', 'Questions', 'Min', 'Max']];
    categories.forEach(cat => {
      const catResponses = responses.filter(r => r.category === cat);
      if (catResponses.length > 0) {
        const scores = catResponses.map(r => r.score).filter(s => s);
        catData.push([cat, (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2), scores.length, Math.min(...scores), Math.max(...scores)]);
      }
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), 'Category Summary');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${assessment.account_name}-assessment.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV Export
router.get('/csv/:assessmentId', (req, res) => {
  try {
    const db = getDb();
    const responses = db.prepare(`
      SELECT r.score, r.notes, q.category, q.subcategory, q.question_text, q.weight
      FROM responses r JOIN questions q ON r.question_id = q.id WHERE r.assessment_id = ?
    `).all(req.params.assessmentId);

    let csv = 'Category,Subcategory,Question,Score,Weight,Notes\n';
    responses.forEach(r => {
      csv += `"${r.category}","${r.subcategory}","${r.question_text}",${r.score},${r.weight},"${(r.notes || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-responses.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

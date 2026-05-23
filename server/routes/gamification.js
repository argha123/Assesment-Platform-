const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

// Get all badges
router.get('/badges', (req, res) => {
  try {
    const db = getDb();
    const badges = db.prepare('SELECT * FROM badges ORDER BY points DESC').all();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user badges
router.get('/user/:userId', (req, res) => {
  try {
    const db = getDb();
    const userBadges = db.prepare(`
      SELECT ub.*, b.name, b.description, b.icon, b.points 
      FROM user_badges ub JOIN badges b ON ub.badge_id = b.id 
      WHERE ub.user_id = ? ORDER BY ub.earned_at DESC
    `).all(req.params.userId);
    const totalPoints = userBadges.reduce((sum, b) => sum + (b.points || 0), 0);
    res.json({ badges: userBadges, totalPoints, level: Math.floor(totalPoints / 100) + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Award badge to user
router.post('/award', (req, res) => {
  try {
    const db = getDb();
    const { user_id, badge_id } = req.body;
    const existing = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?').get(user_id, badge_id);
    if (existing) return res.status(409).json({ message: 'Badge already awarded' });
    const id = uuidv4();
    db.prepare('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)').run(id, user_id, badge_id);
    res.status(201).json({ message: 'Badge awarded', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const db = getDb();
    const leaderboard = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.department, 
        COUNT(ub.id) as badge_count,
        COALESCE(SUM(b.points), 0) as total_points
      FROM users u
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      LEFT JOIN badges b ON ub.badge_id = b.id
      WHERE u.is_active = 1
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT 20
    `).all();
    res.json(leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check and auto-award badges based on activity
router.post('/check-achievements/:userId', (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.userId;
    const awarded = [];

    // Count completed assessments
    const assessmentCount = db.prepare(`SELECT COUNT(*) as count FROM assessments WHERE status = 'completed'`).get();
    const badges = db.prepare('SELECT * FROM badges').all();

    badges.forEach(badge => {
      const criteria = JSON.parse(badge.criteria || '{}');
      let earned = false;

      if (criteria.type === 'assessments_completed' && assessmentCount.count >= criteria.count) earned = true;
      if (criteria.type === 'first_assessment' && assessmentCount.count >= 1) earned = true;
      if (criteria.type === 'score_above' && criteria.threshold) {
        const highScoreAssessment = db.prepare(`SELECT id FROM assessments WHERE overall_score >= ? AND status = 'completed' LIMIT 1`).get(criteria.threshold);
        if (highScoreAssessment) earned = true;
      }

      if (earned) {
        const existing = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badge.id);
        if (!existing) {
          const id = uuidv4();
          db.prepare('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)').run(id, userId, badge.id);
          awarded.push(badge);
        }
      }
    });

    res.json({ awarded, count: awarded.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

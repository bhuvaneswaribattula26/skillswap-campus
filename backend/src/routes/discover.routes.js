const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getRecommendations } = require('../utils/matching');
const { attachSkills } = require('./users.routes');

const router = express.Router();

// AI-based recommendations, ranked by the SkillSwap Match Score.
router.get('/recommendations', requireAuth, asyncHandler(async (req, res) => {
  const recs = getRecommendations(req.user.id, 20);
  const shaped = recs.map(r => ({
    user: attachSkills(db.prepare('SELECT * FROM users WHERE id = ?').get(r.user.id)),
    score: r.score,
    matchReasons: r.matchReasons,
  }));
  res.json({ recommendations: shaped });
}));

// Plain browse/search with optional skill and text filters.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { skill = '', q = '' } = req.query;
  let users = db.prepare(`SELECT * FROM users WHERE id != ? AND is_banned = 0`).all(req.user.id);

  if (skill) {
    const ids = db.prepare(`
      SELECT DISTINCT us.user_id FROM user_skills us
      JOIN skills s ON s.id = us.skill_id
      WHERE s.name LIKE ? AND us.type = 'teach'
    `).all(`%${skill}%`).map(r => r.user_id);
    users = users.filter(u => ids.includes(u.id));
  }

  if (q) {
    const needle = q.toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(needle) || (u.bio || '').toLowerCase().includes(needle)
    );
  }

  res.json({ users: users.map(attachSkills) });
}));

module.exports = router;

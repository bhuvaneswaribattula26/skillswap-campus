const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  let skills;
  if (q) {
    skills = db.prepare('SELECT * FROM skills WHERE name LIKE ? ORDER BY name LIMIT 20')
      .all(`%${q}%`);
  } else {
    skills = db.prepare('SELECT * FROM skills ORDER BY category, name').all();
  }
  res.json({ skills });
}));

module.exports = router;

const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
  const transactions = db.prepare(`
    SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `).all(req.user.id);
  res.json({ balance: user.credits, transactions });
}));

module.exports = router;

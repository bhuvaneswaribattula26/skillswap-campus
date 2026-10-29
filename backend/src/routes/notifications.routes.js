const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  const unreadCount = db.prepare(`
    SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(req.user.id).c;
  res.json({ notifications, unreadCount });
}));

router.patch('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`)
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

router.patch('/read-all', requireAuth, asyncHandler(async (req, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.user.id);
  res.json({ ok: true });
}));

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', asyncHandler(async (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const skillCount = db.prepare('SELECT COUNT(*) as c FROM skills').get().c;
  const swapCounts = db.prepare(`
    SELECT status, COUNT(*) as c FROM swap_requests GROUP BY status
  `).all();
  const sessionCount = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;
  const reviewStats = db.prepare('SELECT COUNT(*) as c, AVG(rating) as avg FROM reviews').get();
  const openReports = db.prepare(`SELECT COUNT(*) as c FROM reports WHERE status = 'open'`).get().c;

  res.json({
    userCount, skillCount, sessionCount,
    swapCounts: Object.fromEntries(swapCounts.map(r => [r.status, r.c])),
    avgRating: reviewStats.avg ? Number(reviewStats.avg.toFixed(2)) : null,
    reviewCount: reviewStats.c,
    openReports,
  });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, college, year, credits, is_admin, is_banned, created_at FROM users
    ORDER BY created_at DESC
  `).all();
  res.json({ users });
}));

router.patch('/users/:id/ban', [body('banned').isBoolean()], validate, asyncHandler(async (req, res) => {
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(req.body.banned ? 1 : 0, req.params.id);
  res.json({ ok: true });
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, u1.name as reporter_name, u2.name as reported_name
    FROM reports r
    JOIN users u1 ON u1.id = r.reporter_id
    JOIN users u2 ON u2.id = r.reported_user_id
    ORDER BY r.created_at DESC
  `).all();
  res.json({ reports });
}));

router.patch('/reports/:id', [body('status').isIn(['open', 'reviewed', 'dismissed'])], validate, asyncHandler(async (req, res) => {
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ ok: true });
}));

module.exports = router;

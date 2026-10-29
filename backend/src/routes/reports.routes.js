const express = require('express');
const { v4: uuid } = require('uuid');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/', requireAuth, [
  body('reportedUserId').isString().notEmpty(),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Please describe the issue (min 5 characters).'),
], validate, asyncHandler(async (req, res) => {
  if (req.body.reportedUserId === req.user.id) {
    return res.status(400).json({ error: 'You cannot report yourself.' });
  }
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.body.reportedUserId);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  const id = uuid();
  db.prepare(`INSERT INTO reports (id, reporter_id, reported_user_id, reason) VALUES (?,?,?,?)`)
    .run(id, req.user.id, req.body.reportedUserId, req.body.reason);
  res.status(201).json({ ok: true });
}));

module.exports = router;

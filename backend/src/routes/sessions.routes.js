const express = require('express');
const { v4: uuid } = require('uuid');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');
const { notify } = require('../utils/notify');

const router = express.Router();

function getSwapOrFail(swapId, userId) {
  const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swapId);
  if (!swap) { const e = new Error('Swap not found.'); e.status = 404; throw e; }
  if (swap.requester_id !== userId && swap.recipient_id !== userId) {
    const e = new Error('Not part of this swap.'); e.status = 403; throw e;
  }
  return swap;
}

router.post('/', requireAuth, [
  body('swapId').isString().notEmpty(),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date/time.'),
  body('durationMinutes').optional().isInt({ min: 15, max: 480 }),
  body('notes').optional().trim().isLength({ max: 500 }),
], validate, asyncHandler(async (req, res) => {
  const swap = getSwapOrFail(req.body.swapId, req.user.id);
  if (swap.status !== 'accepted') {
    return res.status(400).json({ error: 'Sessions can only be scheduled for accepted swaps.' });
  }
  const id = uuid();
  db.prepare(`INSERT INTO sessions (id, swap_id, scheduled_at, duration_minutes, notes)
    VALUES (?,?,?,?,?)`)
    .run(id, swap.id, req.body.scheduledAt, req.body.durationMinutes || 60, req.body.notes || '');

  const otherUserId = swap.requester_id === req.user.id ? swap.recipient_id : swap.requester_id;
  notify(otherUserId, 'session_scheduled', `${req.user.name} scheduled a learning session.`, `/swaps/${swap.id}`);

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json({ session });
}));

router.get('/swap/:swapId', requireAuth, asyncHandler(async (req, res) => {
  getSwapOrFail(req.params.swapId, req.user.id);
  const sessions = db.prepare('SELECT * FROM sessions WHERE swap_id = ? ORDER BY scheduled_at').all(req.params.swapId);
  res.json({ sessions });
}));

router.patch('/:id/status', requireAuth, [
  body('status').isIn(['scheduled', 'completed', 'cancelled']),
], validate, asyncHandler(async (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  getSwapOrFail(session.swap_id, req.user.id);

  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(req.body.status, session.id);
  const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id);
  res.json({ session: updated });
}));

module.exports = router;

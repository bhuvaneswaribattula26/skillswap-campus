const express = require('express');
const { v4: uuid } = require('uuid');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');
const { notify } = require('../utils/notify');

const router = express.Router();

function shapeSwap(row) {
  const requester = db.prepare('SELECT id, name, avatar, college FROM users WHERE id = ?').get(row.requester_id);
  const recipient = db.prepare('SELECT id, name, avatar, college FROM users WHERE id = ?').get(row.recipient_id);
  const requesterSkill = row.requester_skill_id
    ? db.prepare('SELECT id, name FROM skills WHERE id = ?').get(row.requester_skill_id) : null;
  const recipientSkill = row.recipient_skill_id
    ? db.prepare('SELECT id, name FROM skills WHERE id = ?').get(row.recipient_skill_id) : null;
  const sessions = db.prepare('SELECT * FROM sessions WHERE swap_id = ? ORDER BY scheduled_at').all(row.id);
  return {
    id: row.id, status: row.status, message: row.message,
    createdAt: row.created_at, updatedAt: row.updated_at,
    requester, recipient, requesterSkill, recipientSkill, sessions,
  };
}

// List swaps involving me (sent + received)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM swap_requests WHERE requester_id = ? OR recipient_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id, req.user.id);
  res.json({ swaps: rows.map(shapeSwap) });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Swap not found.' });
  if (row.requester_id !== req.user.id && row.recipient_id !== req.user.id) {
    return res.status(403).json({ error: 'Not part of this swap.' });
  }
  res.json({ swap: shapeSwap(row) });
}));

// Create a swap request
router.post('/', requireAuth, [
  body('recipientId').isString().notEmpty(),
  body('requesterSkillId').optional({ nullable: true }).isString(),
  body('recipientSkillId').optional({ nullable: true }).isString(),
  body('message').optional().trim().isLength({ max: 500 }),
], validate, asyncHandler(async (req, res) => {
  const { recipientId, requesterSkillId = null, recipientSkillId = null, message = '' } = req.body;
  if (recipientId === req.user.id) return res.status(400).json({ error: 'You cannot send a swap request to yourself.' });

  const recipient = db.prepare('SELECT * FROM users WHERE id = ?').get(recipientId);
  if (!recipient) return res.status(404).json({ error: 'Recipient not found.' });

  const id = uuid();
  db.prepare(`INSERT INTO swap_requests
    (id, requester_id, recipient_id, requester_skill_id, recipient_skill_id, message)
    VALUES (?,?,?,?,?,?)`)
    .run(id, req.user.id, recipientId, requesterSkillId, recipientSkillId, message);

  notify(recipientId, 'swap_request', `${req.user.name} sent you a skill-swap request.`, `/swaps/${id}`);

  const row = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id);
  res.status(201).json({ swap: shapeSwap(row) });
}));

// Respond to a swap request (accept/decline) - recipient only
router.patch('/:id/respond', requireAuth, [
  body('action').isIn(['accept', 'decline']),
], validate, asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Swap not found.' });
  if (row.recipient_id !== req.user.id) return res.status(403).json({ error: 'Only the recipient can respond.' });
  if (row.status !== 'pending') return res.status(400).json({ error: 'This request has already been handled.' });

  const newStatus = req.body.action === 'accept' ? 'accepted' : 'declined';
  db.prepare(`UPDATE swap_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(newStatus, row.id);

  notify(row.requester_id, 'swap_response',
    `${req.user.name} ${newStatus} your skill-swap request.`, `/swaps/${row.id}`);

  const updated = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(row.id);
  res.json({ swap: shapeSwap(updated) });
}));

// Cancel a swap (requester only, while pending)
router.patch('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Swap not found.' });
  if (row.requester_id !== req.user.id) return res.status(403).json({ error: 'Only the requester can cancel.' });
  if (row.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be cancelled.' });

  db.prepare(`UPDATE swap_requests SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(row.id);
  const updated = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(row.id);
  res.json({ swap: shapeSwap(updated) });
}));

// Mark a swap completed -> triggers credit transfer, both parties can then leave a review
router.patch('/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Swap not found.' });
  if (row.requester_id !== req.user.id && row.recipient_id !== req.user.id) {
    return res.status(403).json({ error: 'Not part of this swap.' });
  }
  if (row.status !== 'accepted') return res.status(400).json({ error: 'Only accepted swaps can be completed.' });

  const CREDIT_AMOUNT = 15;
  const txn = db.transaction(() => {
    db.prepare(`UPDATE swap_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?`)
      .run(row.id);

    // Both sides teach each other something in a swap -> both earn credits for teaching.
    for (const userId of [row.requester_id, row.recipient_id]) {
      db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(CREDIT_AMOUNT, userId);
      db.prepare(`INSERT INTO credit_transactions (id, user_id, amount, type, description)
        VALUES (?,?,?,?,?)`).run(uuid(), userId, CREDIT_AMOUNT, 'swap_completed', `Completed swap ${row.id}`);
    }
  });
  txn();

  notify(row.requester_id, 'swap_completed', 'A skill swap was marked complete. Leave a review!', `/swaps/${row.id}`);
  notify(row.recipient_id, 'swap_completed', 'A skill swap was marked complete. Leave a review!', `/swaps/${row.id}`);

  const updated = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(row.id);
  res.json({ swap: shapeSwap(updated) });
}));

module.exports = router;

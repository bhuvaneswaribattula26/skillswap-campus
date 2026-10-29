const express = require('express');
const { v4: uuid } = require('uuid');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');
const { notify } = require('../utils/notify');

const router = express.Router();

router.post('/', requireAuth, [
  body('swapId').isString().notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
], validate, asyncHandler(async (req, res) => {
  const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.body.swapId);
  if (!swap) return res.status(404).json({ error: 'Swap not found.' });
  if (swap.status !== 'completed') return res.status(400).json({ error: 'You can only review completed swaps.' });
  if (swap.requester_id !== req.user.id && swap.recipient_id !== req.user.id) {
    return res.status(403).json({ error: 'Not part of this swap.' });
  }

  const revieweeId = swap.requester_id === req.user.id ? swap.recipient_id : swap.requester_id;
  const id = uuid();
  try {
    db.prepare(`INSERT INTO reviews (id, swap_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?,?,?,?,?,?)`)
      .run(id, swap.id, req.user.id, revieweeId, req.body.rating, req.body.comment || '');
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You already reviewed this swap.' });
    }
    throw e;
  }

  notify(revieweeId, 'review', `${req.user.name} left you a ${req.body.rating}-star review.`, `/profile/${revieweeId}`);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.status(201).json({ review });
}));

router.get('/user/:userId', requireAuth, asyncHandler(async (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.reviewee_id = ? ORDER BY r.created_at DESC
  `).all(req.params.userId);
  res.json({ reviews });
}));

module.exports = router;

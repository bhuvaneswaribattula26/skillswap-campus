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
    const e = new Error('Not part of this conversation.'); e.status = 403; throw e;
  }
  return swap;
}

// Get message thread for a swap
router.get('/swap/:swapId', requireAuth, asyncHandler(async (req, res) => {
  getSwapOrFail(req.params.swapId, req.user.id);
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.swap_id = ? ORDER BY m.created_at ASC
  `).all(req.params.swapId);

  db.prepare(`UPDATE messages SET is_read = 1 WHERE swap_id = ? AND sender_id != ?`)
    .run(req.params.swapId, req.user.id);

  res.json({ messages });
}));

// Send a message
router.post('/', requireAuth, [
  body('swapId').isString().notEmpty(),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message cannot be empty.'),
], validate, asyncHandler(async (req, res) => {
  const swap = getSwapOrFail(req.body.swapId, req.user.id);
  const id = uuid();
  db.prepare(`INSERT INTO messages (id, swap_id, sender_id, content) VALUES (?,?,?,?)`)
    .run(id, swap.id, req.user.id, req.body.content);

  const otherUserId = swap.requester_id === req.user.id ? swap.recipient_id : swap.requester_id;
  notify(otherUserId, 'message', `${req.user.name} sent you a message.`, `/swaps/${swap.id}`);

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?
  `).get(id);
  res.status(201).json({ message });
}));

// List all my conversations (one per swap) with the latest message + unread count
router.get('/threads', requireAuth, asyncHandler(async (req, res) => {
  const swaps = db.prepare(`
    SELECT * FROM swap_requests WHERE (requester_id = ? OR recipient_id = ?) AND status IN ('accepted','completed')
    ORDER BY updated_at DESC
  `).all(req.user.id, req.user.id);

  const threads = swaps.map(swap => {
    const otherUserId = swap.requester_id === req.user.id ? swap.recipient_id : swap.requester_id;
    const otherUser = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(otherUserId);
    const lastMessage = db.prepare(`SELECT * FROM messages WHERE swap_id = ? ORDER BY created_at DESC LIMIT 1`).get(swap.id);
    const unread = db.prepare(`SELECT COUNT(*) as c FROM messages WHERE swap_id = ? AND sender_id != ? AND is_read = 0`)
      .get(swap.id, req.user.id).c;
    return { swapId: swap.id, otherUser, lastMessage, unread, swapStatus: swap.status };
  });

  res.json({ threads });
}));

module.exports = router;

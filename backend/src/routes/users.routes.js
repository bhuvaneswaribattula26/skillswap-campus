const express = require('express');
const { v4: uuid } = require('uuid');
const { body } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { validate, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

function attachSkills(user) {
  const teach = db.prepare(`
    SELECT us.id as user_skill_id, s.id as skill_id, s.name, s.category, us.level
    FROM user_skills us JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = ? AND us.type = 'teach'
  `).all(user.id);
  const learn = db.prepare(`
    SELECT us.id as user_skill_id, s.id as skill_id, s.name, s.category, us.level
    FROM user_skills us JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = ? AND us.type = 'learn'
  `).all(user.id);
  const ratingRow = db.prepare(`
    SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?
  `).get(user.id);

  return {
    id: user.id, name: user.name, email: user.email, bio: user.bio, avatar: user.avatar,
    college: user.college, year: user.year, credits: user.credits, isAdmin: !!user.is_admin,
    createdAt: user.created_at, teach, learn,
    rating: ratingRow.avgRating ? Number(ratingRow.avgRating.toFixed(1)) : null,
    ratingCount: ratingRow.count,
  };
}

router.get('/me/full', requireAuth, asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: attachSkills(user) });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: attachSkills(user) });
}));

router.put('/me', requireAuth, [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('college').optional().trim().isLength({ max: 120 }),
  body('year').optional().trim().isLength({ max: 40 }),
  body('avatar').optional().trim().isLength({ max: 2000 }),
], validate, asyncHandler(async (req, res) => {
  const fields = ['name', 'bio', 'college', 'year', 'avatar'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: attachSkills(user) });
}));

// --- Skills on the user's profile ---

router.post('/me/skills', requireAuth, [
  body('skillName').trim().isLength({ min: 2, max: 60 }).withMessage('Skill name is required.'),
  body('type').isIn(['teach', 'learn']).withMessage('Type must be teach or learn.'),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('category').optional().trim().isLength({ max: 40 }),
], validate, asyncHandler(async (req, res) => {
  const { skillName, type, level = 'Beginner', category = 'General' } = req.body;

  let skill = db.prepare('SELECT * FROM skills WHERE name = ? COLLATE NOCASE').get(skillName);
  if (!skill) {
    const id = uuid();
    db.prepare('INSERT INTO skills (id, name, category) VALUES (?,?,?)').run(id, skillName, category);
    skill = { id, name: skillName, category };
  }

  try {
    db.prepare(`INSERT INTO user_skills (id, user_id, skill_id, type, level) VALUES (?,?,?,?,?)`)
      .run(uuid(), req.user.id, skill.id, type, level);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You already have this skill listed under that type.' });
    }
    throw e;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.status(201).json({ user: attachSkills(user) });
}));

router.delete('/me/skills/:userSkillId', requireAuth, asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM user_skills WHERE id = ? AND user_id = ?')
    .get(req.params.userSkillId, req.user.id);
  if (!row) return res.status(404).json({ error: 'Skill entry not found.' });
  db.prepare('DELETE FROM user_skills WHERE id = ?').run(row.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: attachSkills(user) });
}));

module.exports = router;
module.exports.attachSkills = attachSkills;

const db = require('../db/init');

/**
 * Rule-based recommendation engine ("SkillSwap Match Score").
 *
 * For a given user we look at:
 *  - skills they want to LEARN -> find other users who TEACH those skills (primary signal)
 *  - skills they TEACH -> find other users who want to LEARN those skills (reciprocity bonus,
 *    since a mutual trade is more likely to actually happen)
 *
 * Score = 3 * (skills they teach that I want to learn)
 *       + 2 * (skills I teach that they want to learn)
 *       + 1 * shared "learn" interests (common ground / rapport bonus)
 *
 * Returns candidates sorted by score, highest first, capped at `limit`.
 */
function getRecommendations(userId, limit = 20) {
  const myLearn = db.prepare(`
    SELECT skill_id FROM user_skills WHERE user_id = ? AND type = 'learn'
  `).all(userId).map(r => r.skill_id);

  const myTeach = db.prepare(`
    SELECT skill_id FROM user_skills WHERE user_id = ? AND type = 'teach'
  `).all(userId).map(r => r.skill_id);

  if (myLearn.length === 0 && myTeach.length === 0) return [];

  const candidates = db.prepare(`
    SELECT id, name, bio, college, year, avatar, credits FROM users
    WHERE id != ? AND is_banned = 0
  `).all(userId);

  const results = [];

  for (const candidate of candidates) {
    const theirTeach = db.prepare(`
      SELECT s.id, s.name FROM user_skills us JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ? AND us.type = 'teach'
    `).all(candidate.id);

    const theirLearn = db.prepare(`
      SELECT s.id, s.name FROM user_skills us JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ? AND us.type = 'learn'
    `).all(candidate.id);

    const theyTeachWhatIWantToLearn = theirTeach.filter(s => myLearn.includes(s.id));
    const theyWantToLearnWhatITeach = theirLearn.filter(s => myTeach.includes(s.id));
    const sharedLearnInterests = theirLearn.filter(s => myLearn.includes(s.id));

    const score =
      theyTeachWhatIWantToLearn.length * 3 +
      theyWantToLearnWhatITeach.length * 2 +
      sharedLearnInterests.length * 1;

    if (score > 0) {
      results.push({
        user: candidate,
        score,
        matchReasons: {
          canTeachYou: theyTeachWhatIWantToLearn.map(s => s.name),
          wantsToLearnFromYou: theyWantToLearnWhatITeach.map(s => s.name),
          sharedInterests: sharedLearnInterests.map(s => s.name),
        },
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

module.exports = { getRecommendations };

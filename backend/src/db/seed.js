// Seeds the database with a master skill list and a couple of demo accounts.
// Run with: npm run seed
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./init');

const SKILLS = [
  ['JavaScript', 'Programming'], ['Python', 'Programming'], ['React', 'Programming'],
  ['Node.js', 'Programming'], ['Machine Learning', 'Programming'], ['SQL', 'Programming'],
  ['Public Speaking', 'Soft Skills'], ['Graphic Design', 'Design'], ['UI/UX Design', 'Design'],
  ['Photography', 'Creative'], ['Video Editing', 'Creative'], ['Guitar', 'Music'],
  ['Piano', 'Music'], ['Singing', 'Music'], ['Spanish', 'Language'], ['French', 'Language'],
  ['German', 'Language'], ['Mandarin', 'Language'], ['Creative Writing', 'Writing'],
  ['Academic Writing', 'Writing'], ['Calculus', 'Academics'], ['Statistics', 'Academics'],
  ['Chemistry', 'Academics'], ['Physics', 'Academics'], ['Resume Building', 'Career'],
  ['Interview Prep', 'Career'], ['Excel', 'Productivity'], ['Digital Marketing', 'Business'],
  ['Entrepreneurship', 'Business'], ['Yoga', 'Fitness'], ['Chess', 'Games'], ['Cooking', 'Life Skills'],
];

const insertSkill = db.prepare('INSERT OR IGNORE INTO skills (id, name, category) VALUES (?, ?, ?)');
const skillTx = db.transaction((skills) => {
  for (const [name, category] of skills) insertSkill.run(uuid(), name, category);
});
skillTx(SKILLS);

function getSkillId(name) {
  return db.prepare('SELECT id FROM skills WHERE name = ?').get(name).id;
}

function ensureUser({ name, email, password, bio, college, year, credits }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO users (id, name, email, password_hash, bio, college, year, credits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, name, email, hash, bio, college, year, credits ?? 100);
  return id;
}

function addUserSkill(userId, skillName, type, level = 'Intermediate') {
  const skillId = getSkillId(skillName);
  db.prepare(`INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, type, level) VALUES (?,?,?,?,?)`)
    .run(uuid(), userId, skillId, type, level);
}

const admin = ensureUser({
  name: 'Admin User', email: 'admin@skillswap.edu', password: 'Admin123!',
  bio: 'Platform administrator.', college: 'SkillSwap HQ', year: 'Staff', credits: 999,
});
db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(admin);

const alice = ensureUser({
  name: 'Alice Chen', email: 'alice@campus.edu', password: 'Password123!',
  bio: 'CS junior who loves teaching Python and learning guitar.', college: 'State University', year: 'Junior',
});
addUserSkill(alice, 'Python', 'teach', 'Advanced');
addUserSkill(alice, 'Machine Learning', 'teach', 'Intermediate');
addUserSkill(alice, 'Guitar', 'learn');
addUserSkill(alice, 'Spanish', 'learn');

const ben = ensureUser({
  name: 'Ben Okafor', email: 'ben@campus.edu', password: 'Password123!',
  bio: 'Music major, self-taught guitarist, learning to code on the side.', college: 'State University', year: 'Sophomore',
});
addUserSkill(ben, 'Guitar', 'teach', 'Advanced');
addUserSkill(ben, 'Piano', 'teach', 'Intermediate');
addUserSkill(ben, 'Python', 'learn');
addUserSkill(ben, 'Public Speaking', 'learn');

const carla = ensureUser({
  name: 'Carla Reyes', email: 'carla@campus.edu', password: 'Password123!',
  bio: 'Design student. Happy to trade Figma skills for language practice.', college: 'State University', year: 'Senior',
});
addUserSkill(carla, 'UI/UX Design', 'teach', 'Advanced');
addUserSkill(carla, 'Graphic Design', 'teach', 'Advanced');
addUserSkill(carla, 'Spanish', 'teach', 'Advanced');
addUserSkill(carla, 'React', 'learn');
addUserSkill(carla, 'Statistics', 'learn');

console.log('Seed complete.');
console.log('Demo logins (password shown for convenience):');
console.log('  admin@skillswap.edu / Admin123!  (admin)');
console.log('  alice@campus.edu    / Password123!');
console.log('  ben@campus.edu      / Password123!');
console.log('  carla@campus.edu    / Password123!');

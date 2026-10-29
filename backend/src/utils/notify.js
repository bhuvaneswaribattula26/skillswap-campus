const { v4: uuid } = require('uuid');
const db = require('../db/init');

function notify(userId, type, content, link = '') {
  db.prepare(`INSERT INTO notifications (id, user_id, type, content, link) VALUES (?,?,?,?,?)`)
    .run(uuid(), userId, type, content, link);
}

module.exports = { notify };

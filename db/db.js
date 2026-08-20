const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB_PATH lets you point the SQLite file at a mounted persistent Volume in
// production (e.g. Railway Volume mounted at /data -> DB_PATH=/data/automator.db).
// Without a Volume, files written on Railway/Render's free tier are wiped on
// every redeploy/restart, so you would lose all rules/history/tokens.
const dbPath = process.env.DB_PATH || path.join(__dirname, 'automator.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,           -- 'instagram' | 'facebook' | 'youtube'
  keyword TEXT NOT NULL,            -- keyword/phrase to match in a comment (use '*' for "any comment")
  reply_text TEXT NOT NULL,         -- the comment reply to post
  send_dm INTEGER DEFAULT 0,        -- 1 = also send a DM to the commenter
  dm_text TEXT,                     -- DM message text
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,           -- 'instagram' | 'facebook' | 'youtube'
  caption TEXT,
  media_path TEXT,                  -- local file path or public URL to image/video
  scheduled_time TEXT NOT NULL,     -- ISO datetime
  status TEXT DEFAULT 'pending',    -- pending | posted | failed
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reply_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT,
  comment_id TEXT,
  commenter TEXT,
  matched_rule_id INTEGER,
  action TEXT,                      -- 'comment_reply' | 'dm_sent' | 'error'
  detail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens (
  platform TEXT PRIMARY KEY,        -- 'youtube' etc (Meta uses .env page token directly)
  access_token TEXT,
  refresh_token TEXT,
  expiry TEXT
);
`);

module.exports = db;

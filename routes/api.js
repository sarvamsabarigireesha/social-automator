const express = require('express');
const router = express.Router();
const db = require('../db/db');

// ---- Auto-reply rules ----
router.get('/rules', (req, res) => {
  res.json(db.prepare('SELECT * FROM auto_reply_rules ORDER BY id DESC').all());
});

router.post('/rules', (req, res) => {
  const { platform, keyword, reply_text, send_dm, dm_text } = req.body;
  if (!platform || !keyword || !reply_text) {
    return res.status(400).json({ error: 'platform, keyword and reply_text are required' });
  }
  const info = db.prepare(`
    INSERT INTO auto_reply_rules (platform, keyword, reply_text, send_dm, dm_text)
    VALUES (?, ?, ?, ?, ?)
  `).run(platform, keyword, reply_text, send_dm ? 1 : 0, dm_text || null);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/rules/:id/toggle', (req, res) => {
  db.prepare(`UPDATE auto_reply_rules SET active = 1 - active WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

router.delete('/rules/:id', (req, res) => {
  db.prepare(`DELETE FROM auto_reply_rules WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ---- Scheduled posts ----
router.get('/posts', (req, res) => {
  res.json(db.prepare('SELECT * FROM scheduled_posts ORDER BY scheduled_time DESC').all());
});

router.post('/posts', (req, res) => {
  const { platform, caption, media_path, scheduled_time } = req.body;
  if (!platform || !scheduled_time) {
    return res.status(400).json({ error: 'platform and scheduled_time are required' });
  }
  const info = db.prepare(`
    INSERT INTO scheduled_posts (platform, caption, media_path, scheduled_time)
    VALUES (?, ?, ?, ?)
  `).run(platform, caption || '', media_path || null, scheduled_time);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM scheduled_posts WHERE id = ? AND status = 'pending'`).run(req.params.id);
  res.json({ ok: true });
});

// ---- Activity log ----
router.get('/logs', (req, res) => {
  res.json(db.prepare('SELECT * FROM reply_log ORDER BY id DESC LIMIT 100').all());
});

module.exports = router;

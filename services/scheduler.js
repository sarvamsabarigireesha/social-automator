const cron = require('node-cron');
const db = require('../db/db');
const meta = require('./metaService');
const youtube = require('./youtubeService');

async function publishDuePosts() {
  const now = new Date().toISOString();
  const due = db.prepare(
    `SELECT * FROM scheduled_posts WHERE status = 'pending' AND scheduled_time <= ?`
  ).all(now);

  for (const post of due) {
    try {
      let result;
      if (post.platform === 'facebook') result = await meta.publishFacebookPost(post);
      else if (post.platform === 'instagram') result = await meta.publishInstagramPost(post);
      else if (post.platform === 'youtube') result = await youtube.uploadVideo(post);
      else throw new Error(`Unknown platform: ${post.platform}`);

      db.prepare(`UPDATE scheduled_posts SET status = 'posted' WHERE id = ?`).run(post.id);
      console.log(`[scheduler] Published post #${post.id} on ${post.platform}`, result?.id || '');
    } catch (err) {
      db.prepare(`UPDATE scheduled_posts SET status = 'failed', error_message = ? WHERE id = ?`)
        .run(err.message, post.id);
      console.error(`[scheduler] Failed to publish post #${post.id}:`, err.message);
    }
  }
}

function startScheduler() {
  // runs every minute
  cron.schedule('* * * * *', publishDuePosts);
  console.log('[scheduler] Bulk post scheduler running (checks every minute)');
}

module.exports = { startScheduler, publishDuePosts };

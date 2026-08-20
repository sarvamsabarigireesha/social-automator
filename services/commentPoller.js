const cron = require('node-cron');
const youtube = require('./youtubeService');
const { findMatchingRule, logAction } = require('./autoReply');

const alreadyHandled = new Set(); // in-memory de-dupe for this run; fine for personal use

async function pollYoutubeComments() {
  try {
    const comments = await youtube.fetchRecentComments(20);
    for (const c of comments) {
      if (alreadyHandled.has(c.commentId)) continue;

      const rule = findMatchingRule('youtube', c.text);
      if (!rule) continue;

      try {
        await youtube.replyToComment(c.commentId, rule.reply_text);
        logAction({
          platform: 'youtube', comment_id: c.commentId, commenter: c.author,
          matched_rule_id: rule.id, action: 'comment_reply', detail: rule.reply_text
        });
      } catch (err) {
        logAction({
          platform: 'youtube', comment_id: c.commentId, commenter: c.author,
          matched_rule_id: rule.id, action: 'error', detail: err.message
        });
      }
      alreadyHandled.add(c.commentId);
    }
  } catch (err) {
    console.error('[commentPoller] YouTube poll failed:', err.message);
  }
}

function startPolling() {
  // every 5 minutes - stay well within YouTube's daily API quota
  cron.schedule('*/5 * * * *', pollYoutubeComments);
  console.log('[commentPoller] YouTube comment polling started (every 5 min)');
}

module.exports = { startPolling };

const express = require('express');
const router = express.Router();
const meta = require('../services/metaService');
const { findMatchingRule, logAction } = require('../services/autoReply');

// ---- Step 1: Meta calls this GET once, to verify your webhook URL ----
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ---- Step 2: Meta POSTs real-time events here (new comments, new DMs) ----
router.post('/meta', async (req, res) => {
  res.sendStatus(200); // acknowledge immediately, Meta requires a fast response

  try {
    const body = req.body;
    for (const entry of body.entry || []) {
      // Comments (Page or IG)
      for (const change of entry.changes || []) {
        if (change.field === 'feed' || change.field === 'comments') {
          const value = change.value;
          const commentId = value.comment_id || value.id;
          const text = value.message || value.text || '';
          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

          const rule = findMatchingRule(platform, text);
          if (!rule) continue;

          try {
            await meta.replyToComment(commentId, rule.reply_text);
            logAction({ platform, comment_id: commentId, commenter: value.from?.id,
              matched_rule_id: rule.id, action: 'comment_reply', detail: rule.reply_text });

            if (rule.send_dm && value.from?.id) {
              await meta.sendDM(platform, value.from.id, rule.dm_text || rule.reply_text);
              logAction({ platform, comment_id: commentId, commenter: value.from?.id,
                matched_rule_id: rule.id, action: 'dm_sent', detail: rule.dm_text });
            }
          } catch (err) {
            logAction({ platform, comment_id: commentId, commenter: value.from?.id,
              matched_rule_id: rule.id, action: 'error', detail: err.message });
          }
        }
      }

      // Direct messages (Messenger / IG Direct) - entry.messaging for real-time DMs
      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender?.id;
        const text = messaging.message?.text;
        if (!text || !senderId) continue;
        const platform = entry.messaging_type === 'instagram' ? 'instagram' : 'facebook';
        // You can add DM-specific auto-reply rules here the same way as comments if needed
      }
    }
  } catch (err) {
    console.error('[webhook:meta] processing error:', err.message);
  }
});

module.exports = router;

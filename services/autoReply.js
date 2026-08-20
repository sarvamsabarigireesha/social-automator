const db = require('../db/db');

/**
 * Finds the first active rule for a platform whose keyword matches the comment text.
 * '*' as keyword means "match any comment" - keep it as your last/fallback rule.
 */
function findMatchingRule(platform, commentText) {
  const rules = db.prepare(
    `SELECT * FROM auto_reply_rules WHERE platform = ? AND active = 1 ORDER BY id ASC`
  ).all(platform);

  const text = (commentText || '').toLowerCase();

  // exact keyword matches first
  for (const rule of rules) {
    if (rule.keyword !== '*' && text.includes(rule.keyword.toLowerCase())) {
      return rule;
    }
  }
  // fallback wildcard rule
  return rules.find(r => r.keyword === '*') || null;
}

function logAction({ platform, comment_id, commenter, matched_rule_id, action, detail }) {
  db.prepare(`
    INSERT INTO reply_log (platform, comment_id, commenter, matched_rule_id, action, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(platform, comment_id, commenter, matched_rule_id || null, action, detail || '');
}

module.exports = { findMatchingRule, logAction };

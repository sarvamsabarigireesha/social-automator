const { google } = require('googleapis');
const db = require('../db/db');
const fs = require('fs');

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const row = db.prepare(`SELECT * FROM tokens WHERE platform = 'youtube'`).get();
  if (row) {
    client.setCredentials({
      access_token: row.access_token,
      refresh_token: row.refresh_token
    });
  }
  return client;
}

function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.upload'
    ]
  });
}

async function saveTokensFromCode(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  db.prepare(`
    INSERT INTO tokens (platform, access_token, refresh_token, expiry)
    VALUES ('youtube', ?, ?, ?)
    ON CONFLICT(platform) DO UPDATE SET access_token=excluded.access_token,
      refresh_token=COALESCE(excluded.refresh_token, tokens.refresh_token), expiry=excluded.expiry
  `).run(tokens.access_token, tokens.refresh_token || null, String(tokens.expiry_date));
  return tokens;
}

// ---- Fetch recent comments across your channel's videos (polled, since YouTube has no webhook) ----
async function fetchRecentComments(maxResults = 20) {
  const auth = getOAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });
  const { data } = await youtube.commentThreads.list({
    part: 'snippet',
    allThreadsRelatedToChannelId: process.env.YOUTUBE_CHANNEL_ID,
    maxResults,
    order: 'time'
  });
  return (data.items || []).map(item => ({
    commentId: item.id,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    author: item.snippet.topLevelComment.snippet.authorDisplayName,
    authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value
  }));
}

async function replyToComment(commentId, text) {
  const auth = getOAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });
  const { data } = await youtube.comments.insert({
    part: 'snippet',
    requestBody: {
      snippet: { parentId: commentId, textOriginal: text }
    }
  });
  return data;
}

// ---- Upload a video (YouTube has no native "text/image post" like FB/IG - video only) ----
async function uploadVideo({ caption, media_path }) {
  if (!media_path || !fs.existsSync(media_path)) {
    throw new Error('YouTube upload requires a valid local video file path (media_path)');
  }
  const auth = getOAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });
  const { data } = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: { title: caption?.slice(0, 100) || 'New video', description: caption || '' },
      status: { privacyStatus: 'public' }
    },
    media: { body: fs.createReadStream(media_path) }
  });
  return data;
}

module.exports = { getAuthUrl, saveTokensFromCode, fetchRecentComments, replyToComment, uploadVideo };

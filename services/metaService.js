const axios = require('axios');

const GRAPH_URL = 'https://graph.facebook.com/v20.0';
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const IG_ID = process.env.META_IG_BUSINESS_ID;

// ---- Reply to a comment (works for both FB Page posts and IG posts) ----
async function replyToComment(commentId, message) {
  const url = `${GRAPH_URL}/${commentId}/comments`;
  const { data } = await axios.post(url, null, {
    params: { message, access_token: PAGE_TOKEN }
  });
  return data;
}

// ---- Send a DM (Messenger for Facebook, Instagram Direct for IG) ----
// NOTE: Meta only allows sending within a 24-hour window after the user messages/comments
// on your Page/IG account (the "24-hour standard messaging window"). Do not use this to
// cold-message people who haven't interacted with your account.
async function sendDM(platform, recipientId, message) {
  const url = platform === 'instagram'
    ? `${GRAPH_URL}/${IG_ID}/messages`
    : `${GRAPH_URL}/${PAGE_ID}/messages`;

  const { data } = await axios.post(url, {
    recipient: { id: recipientId },
    message: { text: message }
  }, {
    params: { access_token: PAGE_TOKEN }
  });
  return data;
}

// ---- Publish a Facebook Page post (text or photo) ----
async function publishFacebookPost({ caption, media_path }) {
  if (media_path) {
    const { data } = await axios.post(`${GRAPH_URL}/${PAGE_ID}/photos`, null, {
      params: { url: media_path, caption, access_token: PAGE_TOKEN }
    });
    return data;
  }
  const { data } = await axios.post(`${GRAPH_URL}/${PAGE_ID}/feed`, null, {
    params: { message: caption, access_token: PAGE_TOKEN }
  });
  return data;
}

// ---- Publish an Instagram post (requires media_path = public image/video URL) ----
async function publishInstagramPost({ caption, media_path }) {
  if (!media_path) throw new Error('Instagram posts require an image/video URL (media_path)');

  const create = await axios.post(`${GRAPH_URL}/${IG_ID}/media`, null, {
    params: { image_url: media_path, caption, access_token: PAGE_TOKEN }
  });
  const creationId = create.data.id;

  const publish = await axios.post(`${GRAPH_URL}/${IG_ID}/media_publish`, null, {
    params: { creation_id: creationId, access_token: PAGE_TOKEN }
  });
  return publish.data;
}

module.exports = { replyToComment, sendDM, publishFacebookPost, publishInstagramPost };

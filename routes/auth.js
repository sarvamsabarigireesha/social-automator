const express = require('express');
const router = express.Router();
const youtube = require('../services/youtubeService');

router.get('/youtube', (req, res) => {
  res.redirect(youtube.getAuthUrl());
});

router.get('/youtube/callback', async (req, res) => {
  try {
    await youtube.saveTokensFromCode(req.query.code);
    res.send('<h2>YouTube connected successfully! You can close this tab.</h2>');
  } catch (err) {
    res.status(500).send('YouTube connection failed: ' + err.message);
  }
});

module.exports = router;

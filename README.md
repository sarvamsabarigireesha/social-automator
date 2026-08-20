# Social Automator — Personal Setup Guide

A local dashboard to auto-reply to comments, send DMs, and bulk-schedule posts
for **your own** Instagram, Facebook and YouTube accounts.

⚠️ **Important limits from the platforms themselves (not this app's choice):**
- **Instagram/Facebook DMs**: Meta only allows automated messages within a
  **24-hour window** after someone comments/messages you. You cannot cold-DM people.
- **Instagram**: Must be an **Instagram Business or Creator account**, linked to a
  Facebook Page.
- **YouTube**: There is no "auto-DM" — YouTube has no public messaging API. This
  app only does comment auto-reply + scheduled video uploads for YouTube.
- **Meta App Review**: To use comment/DM permissions on a real (non-test) account,
  Meta requires you to submit your app for review (takes a few days). Testing with
  your own account as an "Admin/Tester" on the app works immediately, no review needed.

---

## 1. Install requirements on your computer

1. Install **Node.js** (v18 or newer): https://nodejs.org (download, run installer, click Next through it)
2. Download/unzip this project folder anywhere, e.g. `Desktop/social-automator`
3. Open a terminal (Mac: Terminal app, Windows: Command Prompt) inside that folder and run:
   ```
   npm install
   ```
4. Copy `.env.example` to a new file named `.env` in the same folder.

---

## 2. Set up Facebook + Instagram access

1. Go to https://developers.facebook.com → **My Apps** → **Create App** → choose **"Business"** type.
2. In your app dashboard, add the **"Facebook Login"** and **"Webhooks"** products (search for them in "Add Product").
3. Go to **Settings → Basic**. Copy **App ID** and **App Secret** into your `.env` file
   (`META_APP_ID`, `META_APP_SECRET`).
4. Make sure your Instagram account is a **Business account** and is linked to a
   **Facebook Page** you manage (Instagram app → Settings → Account type → Switch to Professional).
5. Under **Tools → Graph API Explorer**: select your app, select your Page, and generate
   a **Page Access Token** with these permissions:
   `pages_manage_posts, pages_read_engagement, pages_messaging, instagram_basic, instagram_manage_comments, instagram_manage_messages`
6. Click "Extend Token" or use the Access Token Debugger to get a **long-lived token**
   (lasts ~60 days). Paste it into `.env` as `META_PAGE_ACCESS_TOKEN`.
7. Find your **Page ID** (Page → About) and **Instagram Business Account ID**
   (Graph API Explorer → `me/accounts` then `{page-id}?fields=instagram_business_account`).
   Paste into `.env` as `META_PAGE_ID` and `META_IG_BUSINESS_ID`.
8. In your app's **Webhooks** product settings, add a callback URL pointing to your
   server (see step 5 below about making your local server public), e.g.
   `https://your-public-url.com/webhooks/meta`, and use the same
   `WEBHOOK_VERIFY_TOKEN` value you put in `.env`. Subscribe to the `feed` and
   `comments` fields for Page, and `comments`/`messages` for Instagram.

---

## 3. Set up YouTube access

1. Go to https://console.cloud.google.com → create a new project.
2. **APIs & Services → Library** → enable **"YouTube Data API v3"**.
3. **APIs & Services → OAuth consent screen** → set up as "External", add your own
   Google account as a **test user**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   type: **Web application** → Authorized redirect URI:
   `http://localhost:3000/auth/youtube/callback`
5. Copy the **Client ID** and **Client Secret** into `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
6. Also add your **YouTube Channel ID** to `.env` as `YOUTUBE_CHANNEL_ID`
   (find it at https://www.youtube.com/account_advanced).

---

## 4. Run the app

```
npm start
```

Open **http://localhost:3000** in your browser. Click **"Connect YouTube"** once to
authorize it (Facebook/Instagram use the Page token directly, no click needed).

---

## 5. Making it work with real-time webhooks (optional, for comment auto-reply)

Meta needs to send data to a **public URL**, not `localhost`. Easiest free option
while testing: install [ngrok](https://ngrok.com), then run:
```
ngrok http 3000
```
It gives you a public URL like `https://abcd1234.ngrok-free.app` — use
`https://abcd1234.ngrok-free.app/webhooks/meta` as your Webhook callback URL in
the Meta App dashboard (step 2.8 above). For a permanent setup, deploy this app to
a small always-on server (Render, Railway, a VPS, etc.) instead of ngrok.

---

## What each feature does

| Feature | How it works |
|---|---|
| **Comment auto-reply** | You set keyword → reply-text rules in the dashboard. Instagram/Facebook comments arrive via webhook instantly; YouTube comments are checked every 5 minutes (YouTube has no webhook). |
| **Auto DM** | Optional add-on to a comment rule — when enabled, also sends a DM to the commenter (Instagram/Facebook only, within Meta's 24-hour rule). |
| **Bulk post scheduling** | Add posts with a caption, media URL/path, and date-time in the dashboard. A background job checks every minute and publishes anything that's due. |

## Folder structure
```
social-automator/
  server.js          - starts everything
  routes/             - webhook + API + auth endpoints
  services/           - Meta, YouTube, scheduler, auto-reply logic
  db/                 - local SQLite database (auto-created on first run)
  public/             - the dashboard you see in the browser
```

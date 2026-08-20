# Deploying Social Automator (Railway.app — free option)

This app is a normal Node/Express app + local SQLite file, so it deploys to
any Node host. Steps below are for **Railway.app**, the easiest no-card option.

## 1. Push the code to GitHub
1. Create a new **private** repo on GitHub (private, since your `.env` secrets
   should never be public — the `.gitignore` here already keeps `.env` out of git).
2. From this folder:
   ```
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

## 2. Create the Railway project
1. Go to https://railway.app → sign up/login with GitHub.
2. **New Project → Deploy from GitHub repo** → pick this repo.
3. Railway auto-detects Node.js and runs `npm install` + `npm start`.

## 3. Add your environment variables
In the Railway project → your service → **Variables** tab, add everything
from `.env.example` with your real values (`META_APP_ID`, `META_APP_SECRET`,
`META_PAGE_ACCESS_TOKEN`, `GOOGLE_CLIENT_ID`, etc.) — **do not** upload a
`.env` file itself, just paste the values in this dashboard.

Also set:
```
BASE_URL=https://<your-app-name>.up.railway.app
GOOGLE_REDIRECT_URI=https://<your-app-name>.up.railway.app/auth/youtube/callback
DB_PATH=/data/automator.db
```
(You'll get the real `*.up.railway.app` URL after the first deploy — go back
and update these two once you know it, then redeploy.)

## 4. Add a Volume (IMPORTANT — without this you'll lose your data)
Railway's filesystem is wiped on every redeploy/restart. Since this app
stores rules/history/tokens in a SQLite file, attach a **Volume**:
1. In your service → **Settings → Volumes → New Volume**.
2. Mount path: `/data`
3. This matches the `DB_PATH=/data/automator.db` variable set above.

## 5. Update Meta + Google redirect URLs
- Meta App dashboard → Webhooks → callback URL: `https://<your-app>.up.railway.app/webhooks/meta`
- Google Cloud Console → OAuth client → Authorized redirect URI:
  `https://<your-app>.up.railway.app/auth/youtube/callback`

## 6. Done
Visit `https://<your-app>.up.railway.app` — your dashboard should load, same
as `localhost:3000` did.

---

## Cost note (check current numbers before relying on this)
Railway's free/trial terms change fairly often, so confirm on
https://railway.app/pricing before you commit:
- Historically Railway gave a one-time free trial credit with no card needed,
  then required a small monthly plan (with usage-based billing) once the
  trial credit runs out or to keep a Volume attached long-term.
- **Render.com** is a common alternative (free Web Service tier exists, but
  free instances spin down after inactivity and also need a paid "Disk" for
  persistent storage — same SQLite-persistence issue as above).
- **Fly.io** is another option with a small persistent volume, usage-based
  pricing.

If keeping this fully $0 long-term matters more than convenience, the
alternative is running it on your own always-on machine (even a Raspberry Pi)
or a low-cost VPS (~$4-6/mo) with a real disk — SQLite + a small automation
app like this is very light on resources.

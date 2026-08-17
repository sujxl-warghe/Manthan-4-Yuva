# Deploying VrukshaSetu (no Docker)

Three pieces, three free-tier services, no containers:

| Piece     | Where        | Config file                                   |
|-----------|--------------|------------------------------------------------|
| Database  | Neon (or Render Postgres) | —                                |
| Backend   | Render       | `backend/render.yaml`, `backend/runtime.txt`   |
| Frontend  | Netlify **or** Railway | `frontend/netlify.toml` / `frontend/railway.json` |

Deploy in this order: **database → backend → frontend**, because the backend
needs a DB URL and the frontend needs the backend's live URL.

---

## 1. Database — Neon Postgres (recommended, free forever)

1. Create a project at https://neon.tech.
2. Copy the connection string Neon gives you — it looks like:
   `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
3. Keep it as-is. `backend/app/config.py` now auto-rewrites `postgres://` /
   `postgresql://` URLs to the `postgresql+asyncpg://` scheme the app needs,
   so you don't have to hand-edit the string. Save this value — you'll paste
   it into Render as `DATABASE_URL` in step 2.

   *Alternative:* Render also offers a managed Postgres add-on (free tier
   expires after 90 days, then becomes paid) — use it the same way if you'd
   rather keep everything on one platform.

---

## 2. Backend — Render

**Option A — Blueprint (fastest):**
1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, select the repo. Render
   detects `backend/render.yaml` automatically.
3. It will ask you to fill in two values it left blank on purpose:
   - `DATABASE_URL` → the Neon connection string from step 1
   - `CORS_ORIGINS` → leave as `http://localhost:3000` for now; you'll update
     it after the frontend is deployed (step 3)
4. Deploy. `JWT_SECRET` is auto-generated for you.

**Option B — Manual web service:**
1. **New → Web Service**, connect the repo, set **Root Directory** to `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET` (any random
   string), `CORS_ORIGINS`, `ENVIRONMENT=production`.

**After the first deploy — seed the database (one-time):**
Open the service's **Shell** tab on Render and run:
```bash
python seed.py
```
This creates tables and loads demo data (320+ trees, wards, demo accounts).
Skip this if you want to start with an empty, real database instead.

**Verify:** visit `https://<your-service>.onrender.com/health` → `{"status":"ok"}`.
Note this URL — the frontend needs it next.

> Render free-tier services sleep after 15 minutes of inactivity and take
> ~30–60s to wake on the next request. That's expected on the free plan.

---

## 3. Frontend — Netlify or Railway

Pick one.

### Netlify
1. **Add new site → Import an existing project**, select this repo.
   Netlify reads `frontend/netlify.toml` (base dir `frontend`, Next.js
   plugin included) automatically.
2. Site settings → **Environment variables**, add:
   - `NEXT_PUBLIC_API_URL` = your Render URL from step 2, e.g.
     `https://vrukshasetu-api.onrender.com`
   - `NEXT_PUBLIC_APP_DOWNLOAD_URL` = `/downloads/VrukshaSetu-debug.apk`
   - `NEXT_PUBLIC_PLAY_STORE_URL` = leave blank
3. Deploy.

### Railway
1. **New Project → Deploy from GitHub repo**, select this repo, set
   **Root Directory** to `frontend`. Railway reads `frontend/railway.json`
   (Nixpacks build, `next start -p $PORT`).
2. Add the same three environment variables as above under the service's
   **Variables** tab.
3. Deploy, then generate a public domain under **Settings → Networking**.

---

## 4. Close the loop — CORS

Once the frontend has a live URL (Netlify `*.netlify.app` or Railway
`*.up.railway.app`, or a custom domain), go back to the **backend** on
Render and update `CORS_ORIGINS` to that exact URL (comma-separate if you
have more than one, e.g. a preview + production domain, no trailing
slashes):
```
CORS_ORIGINS=https://your-site.netlify.app
```
Render redeploys automatically when you save an env var.

---

## 5. Demo credentials (if you ran seed.py)

| Role    | Email                   | Password  |
|---------|-------------------------|-----------|
| Admin   | admin@vrukshasetu.demo  | Admin@123 |
| Citizen | citizen@vrukshasetu.demo| Demo@123  |

---

## Troubleshooting

- **Frontend loads but API calls fail / CORS error** → `CORS_ORIGINS` on
  Render doesn't match the frontend's exact URL (check scheme + no trailing
  slash), or `NEXT_PUBLIC_API_URL` on the frontend is wrong/missing.
- **Backend 500s on every request right after deploy** → tables don't
  exist yet; either wait for the automatic `create_all` on startup or run
  `python seed.py` in the Render shell.
- **First request after idle is slow** → normal Render free-tier cold start.
- **DATABASE_URL rejected / connection errors** → make sure it's a Postgres
  URL (not sqlite) in production; SQLite's local file won't persist on
  Render's ephemeral filesystem across deploys/restarts.

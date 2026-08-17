# VrukshaSetu

**Plant. Protect. Prove Survival.**

A hackathon prototype for the Nagpur Green Mission: every planted tree gets a digital
identity, a guardian, and continuous survival verification — from planting to 3 years.

> "Don't count trees. Count survivors."

This repo contains a working **FastAPI backend** and a working **Next.js frontend**,
connected end-to-end and tested against real (seeded) data. No Docker, no CI/CD, no
Kubernetes — just the two apps, built to run locally in minutes and deploy easily to
free-tier hosting for a demo.

---

## 1. Folder Structure

```
vrukshasetu/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, error handling, health checks
│   │   ├── config.py          # Settings (reads DATABASE_URL, JWT_SECRET, etc.)
│   │   ├── database.py        # Async SQLAlchemy engine/session
│   │   ├── security.py        # JWT auth, password hashing, RBAC
│   │   ├── schemas.py         # Pydantic request models
│   │   ├── utils.py           # Response helpers / serializers
│   │   ├── models/models.py   # All 20 SQLAlchemy models
│   │   ├── services/          # AI verification (demo mode), scoring/risk logic
│   │   └── routers/           # auth, trees, verifications, reports, operations,
│   │                            wards, analytics, leaderboard, admin_public, reference
│   ├── tests/test_api.py      # pytest suite (12 tests, all passing)
│   ├── seed.py                 # Seeds 320+ trees, 15 wards, users, verifications...
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/                   # Next.js App Router pages
    │   ├── page.tsx           # Homepage (hero, live stats, features)
    │   ├── green-map/         # Interactive Nagpur map with filters
    │   ├── registry/          # Searchable tree registry table
    │   ├── trees/[id]/        # Digital Tree Passport
    │   ├── impact/            # Green Score, analytics, ward performance
    │   ├── drives/            # Plantation drives
    │   ├── leaderboard/       # Citizens / Colleges / Wards
    │   ├── login/             # Admin login
    │   └── admin/             # Authority command center (10 sections)
    ├── components/            # Nav, Footer, charts, map widgets, badges
    ├── lib/api.ts             # Typed API client
    └── package.json
```

---

## 2. Setup Steps (Local Demo)

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt

cp .env.example .env
# Edit .env if you want to point at Neon Postgres (see section 4). Otherwise the
# default SQLite file (./vrukshasetu.db) works out of the box — nothing to configure.

python seed.py                 # creates + seeds the database (320+ trees)
uvicorn app.main:app --reload  # http://localhost:8000
```

Verify:
- http://localhost:8000/health → `{"status":"ok"}`
- http://localhost:8000/docs → interactive API docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 (already the default)

npm run dev     # http://localhost:3000
```

Open http://localhost:3000 — the homepage, Green Map, Tree Registry, Tree Passport,
Impact dashboard, Drives, and Leaderboard are all live against the backend.

---

## 3. Environment Variables

**backend/.env**
```
DATABASE_URL=sqlite+aiosqlite:///./vrukshasetu.db     # or Neon Postgres, see below
JWT_SECRET=change-this-to-a-random-string-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 4. Neon PostgreSQL Setup (for a real deployed demo)

1. Create a free project at https://neon.tech
2. Copy the connection string it gives you (it looks like
   `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`)
3. **Rewrite it for async SQLAlchemy** — change the scheme and the SSL param:
   ```
   postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE?ssl=require
   ```
4. Put that in `backend/.env` as `DATABASE_URL`
5. Run `python seed.py` once against it to create tables and seed demo data
6. Start the backend as normal — it now talks to Neon instead of SQLite

No code changes are needed to switch — `app/database.py` picks the right driver and
pooling behavior automatically based on the URL scheme.

---

## 5. Seed Command

```bash
cd backend
python seed.py
```

This **drops and recreates all tables**, then seeds:
- 15 Nagpur wards, 7 categories, 24 species
- 13 institutions (colleges, NGOs, CSR orgs)
- 8 plantation drives
- 62 users (including demo accounts below)
- 320+ trees with realistic status distribution by age, plus verifications,
  community reports, audits, escalations, replacements, maintenance logs,
  notifications, and computed leaderboard points

Every number on every dashboard is computed from these rows — nothing is hardcoded.

---

## 6. Frontend Run Commands

```bash
npm run dev      # development server, http://localhost:3000
npm run build    # production build (verified clean — 21/21 routes compile)
npm run start    # serve the production build
```

## 7. Backend Run Commands

```bash
uvicorn app.main:app --reload              # development
uvicorn app.main:app --host 0.0.0.0 --port 8000   # production-style
python -m pytest tests/ -v                 # run the test suite (12 tests)
```

---

## 8. Demo Credentials

| Role    | Email                        | Password    |
|---------|-------------------------------|-------------|
| Admin   | admin@vrukshasetu.demo        | Admin@123   |
| Citizen | citizen@vrukshasetu.demo      | Demo@123    |

Sign in at `/login` to reach the Admin Portal (`/admin`).

---

## 9. API Endpoint Summary

All routes are prefixed `/api/v1` unless noted. Full interactive docs at `/docs`.

**Auth**
`POST /auth/register` · `POST /auth/login` · `GET /auth/me`

**Trees**
`GET|POST /trees` · `GET|PATCH|DELETE /trees/{id}` · `GET /public/trees/{id}/passport`
`GET /trees/{id}/qr` · `GET /trees/{id}/risk` · `GET /trees/{id}/timeline`
`GET /map/trees` (GeoJSON, filterable by ward/species/category/status/drive)

**Verification (AI-assisted, demo mode)**
`POST|GET /trees/{id}/verifications` · `GET /verifications` · `GET /verifications/{id}`

**Reports & Accountability**
`POST|GET /reports` · `GET|PATCH /reports/{id}`
`POST|GET|PATCH /escalations`

**Replacement**
`POST /trees/{id}/replacement` · `GET /trees/{id}/replacements`

**Drives**
`POST|GET /drives` · `GET|PATCH /drives/{id}`

**Audits**
`POST|GET /audits` · `PATCH /audits/{id}`

**Wards & Green Score**
`GET /wards` · `GET /wards/{id}` · `GET /wards/{id}/statistics` · `GET /wards/{id}/green-score`
`GET /green-score`

**Analytics**
`GET /analytics/overview` · `/survival` · `/wards` · `/species` · `/categories`
`/verification` · `/replacements`

**Leaderboard**
`GET /leaderboard/citizens` · `/colleges` · `/wards`

**Admin**
`GET /admin/dashboard` · `/users` · `/trees` · `/reports` · `/verifications`
`/audits` · `/escalations` · `/replacements`

**Reference data**
`GET /species` · `/categories` · `/institutions` · `/csr`

**Public**
`GET /public/statistics` · `GET /public/trees/{id}/passport`

**System**
`GET /health` · `GET /ready`

---

## 10. What's real vs. demo in this prototype

- **Real:** every database write, every dashboard number, JWT auth, RBAC, QR
  generation, the replacement chain, pagination, filtering, search.
- **Demo mode (clearly labeled in the UI and API response):** AI verification —
  no external vision model is connected; `app/services/ai_verification.py` returns
  deterministic, clearly-labeled results so the flow is fully demonstrable without
  an API key.
- **Not included (per your instructions):** Docker, CI/CD, Kubernetes, production
  infra. Deploy the two apps directly (see below) for a live demo link.

## 11. Mobile App Showcase (new)

The homepage now includes a full "VrukshaSetu Android App" showcase section
(`#get-the-app`), reachable from the navbar, the hero, and the footer:

- Animated phone mockup cycling through Register → Success → QR Passport screens
- The 6-step Plant → Capture → Locate → Sync → Passport → Protect journey
- 4 benefit cards (Live Camera, Live GPS, QR Passport, 3-Year Survival)
- A download card with a **real, working download** — the debug APK is bundled at
  `frontend/public/downloads/VrukshaSetu-debug.apk` and a QR code is generated
  client-side (via the `qrcode` package) pointing at the deployed download URL, so
  scanning it on a real deployment actually downloads the app.

**This does not touch the existing FastAPI backend** — no new API, no schema changes.
The section is purely presentational; the app's *own* registration flow (camera + GPS
+ sync) is designed to call the existing `/api/v1/trees`, `/api/v1/auth`, and
`/api/v1/trees/{id}/verifications` endpoints already documented above.

**Configuring the download link:** set these in `frontend/.env.local`:
```
NEXT_PUBLIC_APP_DOWNLOAD_URL=/downloads/VrukshaSetu-debug.apk   # or a hosted APK URL
NEXT_PUBLIC_PLAY_STORE_URL=                                      # leave blank until published
```
If `NEXT_PUBLIC_APP_DOWNLOAD_URL` is left empty, the button shows "Coming Soon"
instead of a broken or fake link. `NEXT_PUBLIC_PLAY_STORE_URL` works the same way
for the Play Store badge.

## 12. Deploying (no Docker)

Full step-by-step guide: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick summary:
- **Database →** Neon Postgres (free, see section 4).
- **Backend →** Render, using `backend/render.yaml` (one-click Blueprint) or
  manually: build `pip install -r requirements.txt`, start
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend →** Netlify (`frontend/netlify.toml`) or Railway
  (`frontend/railway.json`) — both auto-detected, just set
  `NEXT_PUBLIC_API_URL` to your Render URL.
- Then update the backend's `CORS_ORIGINS` to your live frontend URL.

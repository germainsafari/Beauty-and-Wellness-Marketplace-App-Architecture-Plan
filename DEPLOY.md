# Deploy Hafi to Render + Vercel

## Architecture

| Platform | App | URL example |
|----------|-----|-------------|
| **Render** | API backend (`apps/api`) | `https://hafi-api.onrender.com` |
| **Vercel** | Web app (`apps/web`) | `https://hafi.vercel.app` |
| **Expo Go** | Mobile (`apps/mobile`) | Local dev / EAS later |

---

## 1. Deploy API on Render

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml`.
4. Set secret env vars when prompted:
   - `DATABASE_URL` — your Neon connection string
   - `OPENAI_API_KEY` — your OpenAI key
   - `CORS_ORIGINS` — your Vercel URL, e.g. `https://hafi.vercel.app,https://hafi-*.vercel.app`
5. Deploy. Note your API URL: `https://hafi-api.onrender.com`.

### Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `.` (repo root) |
| Build Command | `npm install && npm run db:push --workspace=@hafi/api` |
| Start Command | `npm run start --workspace=@hafi/api` |
| Health Check | `/health` |

**Environment variables:**

```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
JWT_SECRET=<long-random-string>
CORS_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
```

Render sets `PORT` automatically — do not hardcode it.

---

## 2. Deploy Web on Vercel

1. Push repo to GitHub.
2. Go to [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. Vercel auto-detects settings from `vercel.json`.
4. Add environment variable:

```
VITE_API_URL=https://hafi-api.onrender.com
```

5. Deploy.

6. **Update Render CORS** — add your live Vercel URL to `CORS_ORIGINS` on Render and redeploy the API.

---

## 3. Local development

```bash
# Terminal 1 — API
npm run api

# Terminal 2 — Web (http://localhost:5173)
npm run web

# Terminal 3 — Mobile / Expo Go
npm run mobile
```

Web dev uses Vite proxy — no `VITE_API_URL` needed locally.

---

## 4. Expo Go (mobile)

**`http://localhost:8081` in a browser shows JSON** — that is the Expo manifest, not the app UI. This is normal.

The **QR code** appears in the terminal when you run:

```bash
npm run mobile
```

Requirements:
- Run in an **interactive terminal** (Cursor terminal or PowerShell), not background-only.
- Install **Expo Go** on your phone.
- Phone and PC on the **same Wi‑Fi**.
- Set in `.env`:
  ```
  EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001
  ```
- Scan the QR code with Expo Go (Android) or Camera app (iOS).

---

## 5. Post-deploy checklist

- [ ] `https://your-api.onrender.com/health` returns `{"status":"ok"}`
- [ ] Vercel site loads and login works
- [ ] Hafi AI chat responds (OpenAI key set on Render)
- [ ] Marketplace listings load from Neon DB
- [ ] CORS_ORIGINS includes your Vercel domain

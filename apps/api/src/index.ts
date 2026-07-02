import "dotenv/config";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), "../../.env") });

import cors from "cors";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ENV } from "./env.js";
import { createContext } from "./trpc/trpc.js";
import { appRouter } from "./trpc/router.js";
import { initRealtime } from "./realtime.js";
import { mountUploadRoutes } from "./uploads.js";

const app = express();
const server = createServer(app);

const corsOrigin =
  ENV.corsOrigins.length > 0
    ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || ENV.corsOrigins.some((o) => origin === o || origin.endsWith(".vercel.app"))) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      }
    : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
// Upload routes use their own body parser with a higher limit for base64
// payloads, so they are mounted before the app-wide 1mb JSON parser.
mountUploadRoutes(app);

app.use(express.json({ limit: "1mb" }));

// Monolith mode: when the web app is built into apps/web/dist, serve it from
// this process (single Render service) instead of the API landing page.
const webDist = join(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
const serveWeb = existsSync(join(webDist, "index.html"));
if (serveWeb) {
  app.use(express.static(webDist));
}

app.get("/", (_req, res, next) => {
  if (serveWeb) return next();
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hafi API</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 24px;background:#F8F5FF;color:#1A0533}
  h1{color:#6C3FC5} code{background:#EDE9FE;padding:2px 8px;border-radius:6px}
  a{color:#6C3FC5}
</style></head>
<body>
  <h1>Hafi API</h1>
  <p>This is the <strong>backend only</strong> — not the mobile app UI.</p>
  <ul>
    <li><a href="/health"><code>GET /health</code></a> — status check</li>
    <li><code>POST /trpc/auth.login</code> — sign in</li>
    <li><code>GET /trpc/listings.list</code> — marketplace</li>
    <li><code>POST /trpc/ai.chat</code> — AI concierge</li>
  </ul>
  <p><strong>Mobile app (Expo Go):</strong> run <code>npm run mobile</code> and open the QR code — Metro runs on <code>http://localhost:8081</code>.</p>
</body></html>`);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "Hafi API", version: "1.0.0" });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

if (serveWeb) {
  app.get(/^\/(?!trpc|uploads|health|socket\.io).*/, (_req, res) => {
    res.sendFile(join(webDist, "index.html"));
  });
}

initRealtime(server);

server.listen(ENV.port, "0.0.0.0", () => {
  console.log(`✨ Hafi API running on http://0.0.0.0:${ENV.port}`);
  console.log(`   tRPC: http://localhost:${ENV.port}/trpc`);
  console.log(`   OpenAI: ${ENV.openaiApiKey ? "configured ✓" : "missing ✗"}`);
});

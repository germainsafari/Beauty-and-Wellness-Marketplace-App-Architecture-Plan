import "dotenv/config";
import { resolve } from "path";
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
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
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

initRealtime(server);

server.listen(ENV.port, "0.0.0.0", () => {
  console.log(`✨ Hafi API running on http://0.0.0.0:${ENV.port}`);
  console.log(`   tRPC: http://localhost:${ENV.port}/trpc`);
  console.log(`   OpenAI: ${ENV.openaiApiKey ? "configured ✓" : "missing ✗"}`);
});

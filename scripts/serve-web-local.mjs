import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve("apps/web/dist");
const apiTarget = "http://localhost:3001";
const port = Number(process.env.PORT || 5173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function serveFile(res, filePath) {
  res.writeHead(200, { "Content-Type": types[extname(filePath)] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);

  if (url.pathname.startsWith("/trpc") || url.pathname === "/health") {
    try {
      const proxyRes = await fetch(`${apiTarget}${url.pathname}${url.search}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
        duplex: "half",
      });
      res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers.entries()));
      if (proxyRes.body) {
        for await (const chunk of proxyRes.body) res.write(chunk);
      }
      res.end();
    } catch {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: {
            message: `Cannot reach API at ${apiTarget}. Start it with "npm run api".`,
          },
        })
      );
    }
    return;
  }

  const requested = join(root, decodeURIComponent(url.pathname));
  const filePath = existsSync(requested) && !requested.endsWith("\\") ? requested : join(root, "index.html");
  serveFile(res, filePath);
}).listen(port, "127.0.0.1", () => {
  console.log(`Hafi web running at http://localhost:${port}`);
});

import express, { type Express, type Request, type Response } from "express";
import { verifyToken } from "./auth.js";
import { createUpload, getUploadById } from "./db/queries-admin.js";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // ~2MB of decoded content
const ALLOWED_KINDS = new Set(["verification", "listing", "avatar"]);

function isAllowedMimeType(mimeType: string): boolean {
  return /^image\/[\w.+-]+$/.test(mimeType) || mimeType === "application/pdf";
}

async function authUserId(req: Request): Promise<number | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

async function postUpload(req: Request, res: Response) {
  try {
    const userId = await authUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Please sign in" });
      return;
    }

    const { kind, mimeType, data } = (req.body ?? {}) as {
      kind?: unknown;
      mimeType?: unknown;
      data?: unknown;
    };

    if (typeof kind !== "string" || !ALLOWED_KINDS.has(kind)) {
      res.status(400).json({ error: 'kind must be one of "verification", "listing", "avatar"' });
      return;
    }
    if (typeof mimeType !== "string" || !isAllowedMimeType(mimeType)) {
      res.status(400).json({ error: "mimeType must be image/* or application/pdf" });
      return;
    }
    if (typeof data !== "string" || data.length === 0) {
      res.status(400).json({ error: "data must be a non-empty base64 string" });
      return;
    }

    // Accept optional data-URL prefix ("data:image/png;base64,....").
    const base64 = data.includes(",") && data.startsWith("data:") ? data.slice(data.indexOf(",") + 1) : data;
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
      res.status(400).json({ error: "data is not valid base64" });
      return;
    }
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length === 0) {
      res.status(400).json({ error: "data decoded to zero bytes" });
      return;
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: "File too large (max 2MB)" });
      return;
    }

    const row = await createUpload({ userId, kind, mimeType, data: base64.replace(/[\r\n]/g, "") });
    res.status(201).json({ id: row.id, url: `/uploads/${row.id}` });
  } catch (err) {
    console.error("POST /uploads failed", err);
    res.status(500).json({ error: "Upload failed" });
  }
}

async function getUpload(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid upload id" });
      return;
    }
    const row = await getUploadById(id);
    if (!row) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }
    const bytes = Buffer.from(row.data, "base64");
    res.setHeader("Content-Type", row.mimeType);
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.end(bytes);
  } catch (err) {
    console.error("GET /uploads/:id failed", err);
    res.status(500).json({ error: "Could not read upload" });
  }
}

/**
 * Mounts POST /uploads and GET /uploads/:id.
 * Call BEFORE the app-wide express.json() middleware so the larger
 * body limit for base64 payloads takes effect on this route.
 */
export function mountUploadRoutes(app: Express) {
  app.post("/uploads", express.json({ limit: "6mb" }), postUpload);
  app.get("/uploads/:id", getUpload);
}

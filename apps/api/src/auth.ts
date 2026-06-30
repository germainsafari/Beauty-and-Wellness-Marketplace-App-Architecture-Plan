import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { ENV } from "./env.js";
import { getUserById } from "./db/queries.js";
import type { User } from "./db/schema.js";

export type AuthUser = User;

export async function createToken(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(ENV.jwtSecret);
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<number | null> {
  try {
    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    return sub ? Number(sub) : null;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const userId = await verifyToken(auth.slice(7));
  if (!userId) return null;
  return getUserById(userId);
}

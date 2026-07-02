import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens, users } from "../db/schema.js";
import { ENV } from "../env.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type ExpoPushResult = {
  sent: number;
  failed: number;
  disabledTokens: string[];
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Low-level sender: POSTs messages to the Expo push API in chunks of <=100.
 * Only messages whose `to` starts with "ExponentPushToken" are sent.
 * Tokens rejected with "DeviceNotRegistered" are disabled in the DB.
 * Never throws — network/API failures are logged and reflected in the result.
 */
export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<ExpoPushResult> {
  const valid = messages.filter((m) => m.to.startsWith("ExponentPushToken"));
  const result: ExpoPushResult = { sent: 0, failed: 0, disabledTokens: [] };
  if (valid.length === 0) return result;

  for (const batch of chunk(valid, CHUNK_SIZE)) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (ENV.expoAccessToken) headers.Authorization = `Bearer ${ENV.expoAccessToken}`;

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });

      let payload: { data?: ExpoPushTicket[]; errors?: unknown } | null = null;
      try {
        payload = (await res.json()) as { data?: ExpoPushTicket[] };
      } catch {
        payload = null;
      }

      if (!res.ok || !payload || !Array.isArray(payload.data)) {
        result.failed += batch.length;
        console.warn(
          `[push] Expo push API responded ${res.status}${payload?.errors ? ` — ${JSON.stringify(payload.errors)}` : ""}`
        );
        continue;
      }

      payload.data.forEach((ticket, idx) => {
        if (ticket?.status === "ok") {
          result.sent += 1;
          return;
        }
        result.failed += 1;
        const token = batch[idx]?.to;
        if (token && ticket?.details?.error === "DeviceNotRegistered") {
          result.disabledTokens.push(token);
        }
      });
    } catch (err) {
      result.failed += batch.length;
      console.warn("[push] Expo push request failed:", err instanceof Error ? err.message : err);
    }
  }

  if (result.disabledTokens.length > 0) {
    try {
      await db
        .update(pushTokens)
        .set({ enabled: false, updatedAt: new Date() })
        .where(inArray(pushTokens.token, result.disabledTokens));
      console.warn(`[push] Disabled ${result.disabledTokens.length} unregistered push token(s).`);
    } catch (err) {
      console.warn("[push] Failed to disable dead tokens:", err instanceof Error ? err.message : err);
    }
  }

  return result;
}

/**
 * Sends a push notification to all of a user's enabled Expo tokens.
 * Respects users.preferences.pushEnabled === false (missing => enabled).
 * Never throws — safe to fire-and-forget from mutations.
 */
export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<ExpoPushResult & { skipped?: "preferences" | "no_tokens" }> {
  try {
    const [user] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const prefs = (user?.preferences ?? {}) as { pushEnabled?: boolean };
    if (prefs.pushEnabled === false) {
      return { sent: 0, failed: 0, disabledTokens: [], skipped: "preferences" };
    }

    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.enabled, true)));

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => t.token.startsWith("ExponentPushToken"))
      .map((t) => ({ to: t.token, title: payload.title, body: payload.body, data: payload.data }));

    if (messages.length === 0) {
      return { sent: 0, failed: 0, disabledTokens: [], skipped: "no_tokens" };
    }

    return await sendExpoPushMessages(messages);
  } catch (err) {
    console.warn(`[push] sendPushToUser(${userId}) failed:`, err instanceof Error ? err.message : err);
    return { sent: 0, failed: 0, disabledTokens: [] };
  }
}

/** Lists a user's own push tokens (token value truncated for display). */
export async function listUserPushTokens(userId: number) {
  const rows = await db
    .select({
      id: pushTokens.id,
      platform: pushTokens.platform,
      token: pushTokens.token,
      enabled: pushTokens.enabled,
      createdAt: pushTokens.createdAt,
    })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  return rows.map((r) => ({
    ...r,
    token: r.token.length > 24 ? `${r.token.slice(0, 24)}…` : r.token,
  }));
}

/** Toggles one of the user's own tokens. Returns the updated row or null if not owned. */
export async function setUserPushTokenEnabled(userId: number, tokenId: number, enabled: boolean) {
  const [updated] = await db
    .update(pushTokens)
    .set({ enabled, updatedAt: new Date() })
    .where(and(eq(pushTokens.id, tokenId), eq(pushTokens.userId, userId)))
    .returning({
      id: pushTokens.id,
      platform: pushTokens.platform,
      enabled: pushTokens.enabled,
    });
  return updated ?? null;
}

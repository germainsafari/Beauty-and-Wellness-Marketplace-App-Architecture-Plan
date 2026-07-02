import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "hafi_token";

export function getApiUrl(): string {
  const url =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://localhost:3001";
  return url.replace(/\/$/, "");
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type TrpcResult<T> = { result: { data: T } };
type TrpcError = { error: { message?: string; json?: { message?: string } } };

function parseTrpcError(json: TrpcError): string {
  return json.error?.message || json.error?.json?.message || "Request failed";
}

function networkErrorMessage(base: string): string {
  return `Cannot reach API at ${base}. Ensure npm run api is running and your phone is on the same Wi‑Fi.`;
}

async function readTrpcResponse<T>(res: Response, base: string): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (res.status >= 500 || res.status === 502 || res.status === 503) {
      throw new Error(networkErrorMessage(base));
    }
    throw new Error(`Empty response from API (${res.status})`);
  }

  let json: TrpcResult<T> | TrpcError;
  try {
    json = JSON.parse(text) as TrpcResult<T> | TrpcError;
  } catch {
    throw new Error(networkErrorMessage(base));
  }

  if ("error" in json) throw new Error(parseTrpcError(json));
  return json.result.data;
}

export async function trpcCall<T>(
  path: string,
  input?: unknown,
  method: "query" | "mutation" = "query"
): Promise<T> {
  const base = getApiUrl();
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    if (method === "query") {
      // No transformer on the server: input goes raw in the query string.
      const inputParam =
        input === undefined ? "" : `?input=${encodeURIComponent(JSON.stringify(input))}`;
      const res = await fetch(`${base}/trpc/${path}${inputParam}`, { headers });
      return readTrpcResponse<T>(res, base);
    }

    const res = await fetch(`${base}/trpc/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(input ?? null),
    });
    return readTrpcResponse<T>(res, base);
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(networkErrorMessage(base));
    }
    throw e;
  }
}

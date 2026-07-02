const TOKEN_KEY = "hafi_token";

export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url) return url.replace(/\/$/, "");
  // Dev: Vite proxy handles /trpc
  return "";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

type TrpcResult<T> = { result: { data: T } };
type TrpcError = { error: { message?: string; json?: { message?: string } } };

function parseError(json: TrpcError): string {
  return json.error?.message || json.error?.json?.message || "Request failed";
}

function apiUnavailableMessage(base: string): string {
  const target = base || "http://localhost:3001";
  return `Cannot reach the API at ${target}. Start it with "npm run api" or "npm run dev" from the project root.`;
}

async function readTrpcResponse<T>(res: Response, base: string): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (res.status >= 500 || res.status === 502 || res.status === 503) {
      throw new Error(apiUnavailableMessage(base));
    }
    throw new Error(`Empty response from API (${res.status})`);
  }

  let json: TrpcResult<T> | TrpcError;
  try {
    json = JSON.parse(text) as TrpcResult<T> | TrpcError;
  } catch {
    throw new Error(apiUnavailableMessage(base));
  }

  if ("error" in json) throw new Error(parseError(json));
  return json.result.data;
}

export async function trpcCall<T>(
  path: string,
  input?: unknown,
  method: "query" | "mutation" = "query"
): Promise<T> {
  const base = getApiUrl();
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    if (method === "query") {
      const wrapped = { json: input ?? null };
      const params = `?input=${encodeURIComponent(JSON.stringify(wrapped))}`;
      const res = await fetch(`${base}/trpc/${path}${params}`, { headers });
      return readTrpcResponse<T>(res, base);
    }

    const res = await fetch(`${base}/trpc/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(input ?? null),
    });
    return readTrpcResponse<T>(res, base);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(apiUnavailableMessage(base));
    }
    throw err;
  }
}

export function formatPrice(amount: string | number): string {
  return `RWF ${Number(amount).toLocaleString()}`;
}

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

export async function trpcCall<T>(
  path: string,
  input?: unknown,
  method: "query" | "mutation" = "query"
): Promise<T> {
  const base = getApiUrl();
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (method === "query") {
    const wrapped = { json: input ?? null };
    const params = `?input=${encodeURIComponent(JSON.stringify(wrapped))}`;
    const res = await fetch(`${base}/trpc/${path}${params}`, { headers });
    const json = (await res.json()) as TrpcResult<T> | TrpcError;
    if ("error" in json) throw new Error(parseError(json));
    return json.result.data;
  }

  const res = await fetch(`${base}/trpc/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(input ?? null),
  });
  const json = (await res.json()) as TrpcResult<T> | TrpcError;
  if ("error" in json) throw new Error(parseError(json));
  return json.result.data;
}

export function formatPrice(amount: string | number): string {
  return `RWF ${Number(amount).toLocaleString()}`;
}

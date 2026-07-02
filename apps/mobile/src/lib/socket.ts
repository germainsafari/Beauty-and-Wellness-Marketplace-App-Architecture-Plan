import { io, type Socket } from "socket.io-client";
import { getApiUrl, getToken } from "./api";

let socket: Socket | null = null;
let connecting: Promise<Socket | null> | null = null;

/**
 * Returns a shared authenticated socket, creating it on first use.
 * Token comes from SecureStore, so this is async (unlike the web client).
 */
export async function getSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await getToken();
    if (!token) return null;
    if (socket?.connected) return socket;
    socket?.disconnect();
    socket = io(getApiUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    return socket;
  })().finally(() => {
    connecting = null;
  });

  return connecting;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

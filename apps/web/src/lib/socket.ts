import { io, type Socket } from "socket.io-client";
import { getApiUrl, getToken } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;
  socket = io(getApiUrl() || window.location.origin, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

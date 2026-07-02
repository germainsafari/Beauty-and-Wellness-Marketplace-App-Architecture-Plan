import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "./auth.js";
import { ENV } from "./env.js";

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (
          ENV.corsOrigins.length === 0 ||
          !origin ||
          ENV.corsOrigins.some((allowed) => origin === allowed || origin.endsWith(".vercel.app"))
        ) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") return next(new Error("Unauthorized"));
    const userId = await verifyToken(token);
    if (!userId) return next(new Error("Unauthorized"));
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    next();
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", (conversationId: number) => {
      if (Number.isFinite(conversationId)) socket.join(`conversation:${conversationId}`);
    });

    socket.on("chat:typing", (conversationId: number) => {
      if (Number.isFinite(conversationId)) {
        socket.to(`conversation:${conversationId}`).emit("chat:typing", {
          conversationId,
          userId: socket.data.userId,
        });
      }
    });
  });

  return io;
}

export function emitChatRead(event: { conversationId: number; readerId: number }) {
  io?.to(`conversation:${event.conversationId}`).emit("chat:read", event);
}

export function emitChatMessage(message: {
  conversationId: number;
  senderId: number;
  body?: string | null;
  id: number;
  createdAt: Date;
}) {
  io?.to(`conversation:${message.conversationId}`).emit("chat:message", message);
}

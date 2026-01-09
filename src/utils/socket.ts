import { Server } from "socket.io";
import http from "http";

let io: Server | null = null; // <-- nullable for safe access

export function initSocket(server: http.Server): Server {
    if (io) {
        console.warn('[Socket.IO] Server already initialized — skipping re-init.');
        return io;
    }

export function initSocket(server: http.Server, allowedOrigins: string[]) {
  if (io) {
    console.warn("⚠ Socket.IO already initialized.");
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        console.log("[SOCKET CORS CHECK] Incoming origin:", origin);
        if (!origin || allowedOrigins.includes(origin)) {
          console.log("[SOCKET CORS ALLOWED]:", origin);
          callback(null, true);
        } else {
          console.warn("[SOCKET CORS BLOCKED]:", origin);
          callback(new Error(`Socket.IO CORS not allowed for ${origin}`));
        }
      },
      credentials: true,
    },
    transports: ["websocket"], // ✅ No polling fallback
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("join", (userId) => {
      console.log(`🧠 Socket ${socket.id} joined room: ${userId}`);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
}

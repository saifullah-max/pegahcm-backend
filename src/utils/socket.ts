// utils/socket.ts
import { Server } from "socket.io";
import http from "http";

let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://pegahcm.netlify.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      console.log(`🧠 Socket ${socket.id} joined room: ${userId}`);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

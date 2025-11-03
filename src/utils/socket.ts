import { Server } from 'socket.io';
import http from 'http';

let io: Server | null = null; // <-- nullable for safe access

export function initSocket(server: http.Server): Server {
    if (io) {
        console.warn('[Socket.IO] Server already initialized — skipping re-init.');
        return io;
    }

    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173', // local dev
                // 'https://pegahub.staging.pegasync.com', // staging frontend
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);
        socket.on("debug_rooms", () => {
            console.log(`📡 Rooms for ${socket.id}:`, Array.from(socket.rooms));
        });

        // --- USER ROOM (for notifications, etc.) ---
        socket.on('join', (userId: string) => {
            if (!userId) return;
            socket.join(userId);
            console.log(`👤 Socket ${socket.id} joined USER room: ${userId}`);
        });

        // --- TICKET ROOM (for comments & replies) ---
        socket.on('join_ticket', (ticketId: string) => {
            if (!ticketId) return;
            socket.join(ticketId);
            console.log(`🧾 Socket ${socket.id} joined TICKET room: ${ticketId}`);
        });

        socket.on('leave_ticket', (ticketId: string) => {
            if (!ticketId) return;
            socket.leave(ticketId);
            console.log(`🚪 Socket ${socket.id} left TICKET room: ${ticketId}`);
        });

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });

    console.log('⚡ Socket.IO initialized.');
    return io;
}

export function getIO(): Server {
    if (!io) {
        console.warn('[Socket.IO] getIO() called before initialization.');
        throw new Error('Socket.io not initialized! Make sure initSocket(server) is called before getIO().');
    }
    return io;
}

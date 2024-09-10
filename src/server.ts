import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static files (client)
app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("join-room", (roomId: string) => {
    console.log(`User ${socket.id} joined room: ${roomId}`);
    socket.join(roomId);

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", socket.id);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("offer", (offer) => {
      socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", (answer) => {
      socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
      socket.to(roomId).emit("ice-candidate", candidate);
    });
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

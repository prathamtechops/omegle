const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

let userRooms = {}; // Map to store user rooms
let activeRooms = new Set(); // Set to store active rooms

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("join", () => {
    // Check if there are less than 2 users in an active room
    const room = [...activeRooms].find(
      (r) => io.sockets.adapter.rooms.get(r).size < 2
    );
    if (room) {
      // Join existing room with less than 2 users
      userRooms[socket.id] = room;
      socket.join(room);
      socket.emit("room", room);
      console.log(`User ${socket.id} joined room ${room}`);
    } else {
      // Create a new room if no active rooms or all rooms have 2 users
      const newRoom = uuidv4();
      activeRooms.add(newRoom);
      userRooms[socket.id] = newRoom;
      socket.join(newRoom);
      socket.emit("room", newRoom);
      console.log(`User ${socket.id} created and joined new room ${newRoom}`);
    }
  });

  socket.on("signal", (data) => {
    socket.to(data.room).emit("signal", data.signalData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const room = userRooms[socket.id];
    delete userRooms[socket.id];

    if (room) {
      socket.to(room).emit("peerDisconnected", socket.id);
      console.log(
        `Notified other users in room ${room} about peer disconnection.`
      );
      // Remove the room from active rooms set when both users disconnect
      if (io.sockets.adapter.rooms.get(room).size === 0) {
        activeRooms.delete(room);
        console.log(`Room ${room} removed from active rooms.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

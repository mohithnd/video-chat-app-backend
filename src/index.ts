import express from "express";
import serverConfig from "./config/serverConfig";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import roomHandler from "./handlers/roomHandler";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  roomHandler(socket, io);

  socket.on("disconnect", () => {
    console.log(`Connection ${socket.id} disconnected`);
  });
});

server.listen(serverConfig.PORT, () => {
  console.log(`Server is running on port ${serverConfig.PORT}`);
});

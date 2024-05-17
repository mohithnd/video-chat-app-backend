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
  console.log("New User Connected");

  roomHandler(socket);

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

server.listen(serverConfig.PORT, () => {
  console.log(`Server Is Up At Port ${serverConfig.PORT}`);
});

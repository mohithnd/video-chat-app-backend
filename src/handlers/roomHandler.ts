import { Server, Socket } from "socket.io";
import { v4 as UUIDv4 } from "uuid";
import IRoomParams from "../interfaces/IRoomParams";
import IMessage from "../interfaces/IMessage";

const rooms: Record<string, string[]> = {};
const socketToPeer: Record<string, string> = {};
const chats: Record<string, IMessage[]> = {};

const roomHandler = (socket: Socket, io: Server) => {
  const createRoom = () => {
    const roomId = UUIDv4();
    socket.join(roomId);
    rooms[roomId] = [];
    console.log("Room Created With Id", roomId);

    socket.emit("room-created", { roomId });
  };

  const joinedRoom = ({ roomId, peerId }: IRoomParams) => {
    if (rooms[roomId]) {
      console.log(
        "New User Has Joined Room",
        roomId,
        "With Peer ID As",
        peerId
      );
      rooms[roomId].push(peerId);
      console.log("Added Peer To Room", rooms);
      socket.join(roomId);
      socketToPeer[socket.id] = peerId;

      socket.on("ready", () => {
        socket.to(roomId).emit("user-joined", { peerId });
      });

      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    }
  };

  const disconnect = () => {
    const peerId = socketToPeer[socket.id];
    Object.keys(rooms).forEach((roomId) => {
      const index = rooms[roomId].indexOf(peerId);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
        socket.to(roomId).emit("user-disconnected", { peerId });
      }
    });
  };

  const sendMessage = ({
    roomId,
    message,
    senderId,
    timestamp,
  }: {
    roomId: string;
    message: string;
    senderId: string;
    timestamp: string;
  }) => {
    const messageId = UUIDv4();

    if (!chats[roomId]) {
      chats[roomId] = [];
    }
    chats[roomId].push({ text: message, senderId, timestamp, messageId });

    io.in(roomId).emit("receive-message", {
      message,
      senderId,
      timestamp,
      messageId,
    });
  };

  const sendChats = ({ roomId }: { roomId: string }) => {
    if (!chats[roomId]) {
      chats[roomId] = [];
    }
    const chatsToBeSent = chats[roomId];

    socket.emit("receive-chats", {
      chats: chatsToBeSent,
    });
  };

  socket.on("create-room", createRoom);
  socket.on("joined-room", joinedRoom);
  socket.on("send-message", sendMessage);
  socket.on("disconnect", disconnect);
  socket.on("send-chats", sendChats);
};

export default roomHandler;

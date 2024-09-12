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
    console.log(`Room created: ${roomId}`);
    socket.emit("room-created", { roomId });
  };

  const joinedRoom = ({ roomId, peerId }: IRoomParams) => {
    if (rooms[roomId]) {
      rooms[roomId].push(peerId);
      socket.join(roomId);
      socketToPeer[socket.id] = peerId;
      console.log(`Peer ${peerId} joined room: ${roomId}`);

      socket.on("ready", () => {
        socket.to(roomId).emit("user-joined", { peerId });
        console.log(`User ${peerId} is ready in room: ${roomId}`);
      });

      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    } else {
      console.log(`Room ${roomId} does not exist.`);
    }
  };

  const disconnect = () => {
    const peerId = socketToPeer[socket.id];
    console.log(`Peer ${peerId} disconnected`);
    Object.keys(rooms).forEach((roomId) => {
      const index = rooms[roomId].indexOf(peerId);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
        socket.to(roomId).emit("user-disconnected", { peerId });
        console.log(`Peer ${peerId} removed from room: ${roomId}`);
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
    console.log(`Message sent in room ${roomId} from ${senderId}: ${message}`);

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
    console.log(`Sending chats for room ${roomId}`);

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

import { Socket } from "socket.io";
import { v4 as UUIDv4 } from "uuid";
import IRoomParams from "../interfaces/IRoomParams";

const rooms: Record<string, string[]> = {};
const socketToPeer: Record<string, string> = {};

const roomHandler = (socket: Socket) => {
  const createRoom = () => {
    const roomId = UUIDv4();
    socket.join(roomId);
    rooms[roomId] = [];
    socket.emit("room-created", { roomId });

    console.log("Room Created With Id", roomId);
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

  socket.on("create-room", createRoom);
  socket.on("joined-room", joinedRoom);
  socket.on("disconnect", disconnect);
};

export default roomHandler;

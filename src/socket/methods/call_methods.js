import {
  getListFromRedis,
  deleteFromRedis,
  setToRedis,
} from "../../redis/redis_methods.js";

export const handleCreateRoom = async (socket, data) => {
  const roomId = `room_${socket.id}`;
  const roomData = {
    offer: data.offer,
    host: roomId,
    guests: [],
  };
  await setToRedis(`dating_room:${roomId}`, roomData, 4);
  socket.join(roomId);
  socket.emit("offer", { roomId });
  console.log(`Room created with ID: ${roomId}`);
};

export const handleAnswer = (io, socket, data) => {
  const { roomId } = data;

  io.to(roomId).emit("answer", data);
  socket.join(roomId);
  console.log(`Answer sent to room ${roomId}`);
};

export const handleVideoStatus = (io, socketId, data) => {
  const { roomId } = data;
  io.to(roomId).emit("video_status", { ...data, socketId });
};

export const getDatingRoom = async (socket) => {
  try {
    const rooms = await getListFromRedis("dating_room");
    if (!rooms || rooms.length === 0) {
      console.log("No available rooms found");
      return socket.emit("dating_room", null);
    }

    for (const roomData of rooms) {
      const { host, guests, offer } = roomData;
      const roomId = `room_${socket.id}`;

      if (roomId !== host && guests.length < 2) {
        console.log(`Room found: ${host}`);
        await deleteFromRedis(`dating_room:${host}`);
        socket.emit("dating_room", { roomId: host, offer });
        return;
      }
    }

    console.log("No suitable room found");
    socket.emit("dating_room", null);
  } catch (err) {
    console.error(`Error retrieving rooms: ${err.message}`);
    socket.emit("dating_room", null);
  }
};

export const handleIceCandidate = (io, data) => {
  io.to(data.roomId).emit("iceCandidate", data.candidate);
};

export const handleHangUp = async (io, socket, { roomId }) => {
  console.log(`Room ${roomId} closed`);
  io.to(roomId).emit("hangUp");
  socket.leave(roomId);
};

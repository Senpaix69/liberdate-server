import {
  connectUser,
  changeEmail,
  onDisconnect,
  disconnectUser,
} from "./methods/connection_methods.js";
import {
  blockUser,
  triggerBoost,
  getAllSparks,
  getSuggestions,
  getNotifications,
  setSeenNotifications,
  unblockUser,
} from "./methods/socket_methods.js";
import {
  sendTyping,
  getAllRooms,
  unmatchUser,
  sendMessage,
  unsendMessage,
  getAllMessages,
  readAllMessages,
} from "./methods/messaging_methods.js";
import { createAdapter } from "@socket.io/redis-adapter";
import handleLike from "./methods/handle_like.js";
import redis from "../redis/redis_client.js";
import { Server } from "socket.io";

const pubClient = redis;
const subClient = pubClient.duplicate();

let io;

const configureSocket = async (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("A socket connection has been established");

    //? Connections Methods
    socket.on("connect_user", (email) => connectUser(email, socket, true));
    socket.on("change_email", (data) => changeEmail(data, socket));
    socket.on("disconnect_user", () => disconnectUser(socket));
    socket.on("disconnect", () => onDisconnect(socket));

    //? Socket Notifications Methods
    socket.on("get_notifications", (data) => getNotifications(data, socket));
    socket.on("seen_notifications", (userId) => setSeenNotifications(userId));

    //? Socket Spark Methods
    socket.on("get_suggestions", (data) => getSuggestions(data, socket));
    socket.on("get_all_sparks", (data) => getAllSparks(data, socket));
    socket.on("trigger_boost", (data) => triggerBoost(data, socket));
    socket.on("unblock_user", (data) => unblockUser(data, io));
    socket.on("handle_like", (data) => handleLike(data, io));
    socket.on("block_user", (data) => blockUser(data, io));

    //? Socket Messaging methods
    socket.on("unsend_message", (data) => unsendMessage(data, socket.id, io));
    socket.on("send_message", (data) => sendMessage(data, socket.id, io));
    socket.on("unmatch", (data) => unmatchUser(data, socket.id, io));
    socket.on("get_all_convo", (data) => getAllRooms(data, socket));
    socket.on("get_all", (data) => getAllMessages(data, socket));
    socket.on("send_typing", (data) => sendTyping(data, io));
    socket.on("read_all", (data) => readAllMessages(data));

    //? Socket Video Calling WebRTC Methods
  });
};

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

export { configureSocket, getIO };

import {
  calculateDistance,
  attachPlanFeatureDetails,
} from "./socket_helpers.js";
import { getFromRedis, getSetFromRedis } from "../../redis/redis_methods.js";
import { createNotification } from "../../clients/one_signal_client.js";
import Notification from "../../models/notification_model.js";
import { removeRoom } from "../../bull_mq/producer.js";
import Message from "../../models/message_model.js";
import Room from "../../models/room_model.js";
import User from "../../models/user_model.js";
import Like from "../../models/like_model.js";
import moment from "moment";

export const sendMessage = async (data, id, io) => {
  try {
    const { recipientEmail, username, message } = data;
    const { sender, recipient, roomId } = message;

    const timestamp = moment().utc().format();
    const room = await Room.findOne({ roomId }).populate("users").lean();
    if (!room) {
      throw new Error(`Room with roomId ${roomId} not found`);
    }

    let senderField, recipientField;
    if (room.users.userA.id.equals(sender)) {
      senderField = "unread.userA";
      recipientField = "unread.userB";
    } else {
      senderField = "unread.userB";
      recipientField = "unread.userA";
    }

    let text = message.text;
    if (message.attachment) {
      text =
        message.attachment.type === "video"
          ? "sent a video 🎥"
          : message.attachment.type === "audio"
          ? "sent an audio 🔉"
          : "sent an image 📷";
    }

    const [socketId, newMessage, notification, updatedRoom] = await Promise.all(
      [
        getFromRedis(`socket:${recipientEmail}`),
        Message.create({ ...message, timestamp, text }),
        Notification.create({
          message: "Sent you a message",
          userId: recipient,
          senderId: sender,
          type: "message",
        }),
        Room.findOneAndUpdate(
          { roomId },
          {
            $set: {
              timestamp,
              recentMessage: { sender, text },
              [senderField]: 0,
            },
            $inc: { [recipientField]: 1 },
          },
          { new: true, lean: true }
        ),
      ]
    );

    if (!updatedRoom) {
      throw new Error(`Room with roomId ${roomId} not found`);
    }

    removeRoom(sender, recipient, roomId);
    handleReceiver({
      notId: notification._id,
      recipientField,
      newMessage,
      socketId,
      io,
    });
    // todo: To use bullMQ uncomment this
    // addNotification({ ...(newMessage.toObject()), username });

    // todo: Direct Notification
    createNotification({ ...newMessage.toObject(), username });

    io.to(id).emit("update_message", {
      newId: newMessage._id,
      oldId: message.id,
      roomId,
    });
  } catch (e) {
    console.log("Error creating message:", e.message);
  }
};

export const unsendMessage = async (data, id, io) => {
  try {
    const { recipientEmail, msg } = data;

    const promises = [
      Message.findByIdAndUpdate(msg.id, { status: "deleted" }),
      getFromRedis(`socket:${recipientEmail}`),
    ];

    if (msg.updateText) {
      promises.push(
        Room.findOneAndUpdate(
          { roomId: msg.roomId },
          { "recentMessage.unsend": true }
        )
      );
    }

    const [updateMsg, socketId] = await Promise.all(promises);

    if (!updateMsg) {
      throw new Error("Couldn't update message");
    }

    io.to(id).emit("unsend", msg);
    if (socketId) {
      io.to(socketId).emit("unsend", msg);
    }
  } catch (e) {
    console.log("Error unsending message:", e.message);
  }
};

export const unmatchUser = async (data, socketId, io) => {
  const { matchId, email, roomId } = data;
  try {
    console.table({ matchId, email, roomId });

    const [otherSocket, _, __] = await Promise.all([
      getFromRedis(`socket:${email}`),
      Like.findByIdAndDelete(matchId).lean(),
      Room.findOneAndDelete({ roomId }).lean(),
      Message.deleteMany({ roomId }),
    ]);

    io.to(otherSocket).emit("unmatch_user", data.roomId);
    io.to(socketId).emit("unmatch_user", data.roomId);
  } catch (e) {
    console.log("Error triggering boost", e.message);
    io.to(socketId).emit("sparks_error", "Failed to unmatch user");
  }
};

const handleReceiver = ({
  socketId,
  io,
  newMessage,
  notId,
  recipientField,
}) => {
  if (!socketId) return;
  console.log("Send Message Successfully");

  io.to(socketId)
    .timeout(8000)
    .emit(
      "recieve_message",
      { ...newMessage.toObject(), notId },
      async (ack) => {
        try {
          if (!(ack instanceof Error)) {
            console.log("Message received by client:", ack);
            newMessage.isRead = true;

            await Promise.all([
              newMessage.save(),
              Room.findOneAndUpdate(
                { roomId: newMessage.roomId },
                { $set: { [recipientField]: 0 } },
                { new: true, lean: true }
              ),
            ]);
          }
        } catch (e) {
          console.log("Error saving message read from client", e.message);
        }
      }
    );
};

export const sendTyping = async (data, io) => {
  try {
    const { roomId, reciever } = data;
    const socketId = await getFromRedis(`socket:${reciever}`);
    console.log("Send Typing event");

    if (!socketId) return;
    io.to(socketId).emit("user_typing", roomId);
  } catch (e) {
    console.log("Error reading all message:", e.message);
  }
};

export const readAllMessages = async (data) => {
  try {
    const { roomId, sender } = data;
    console.log("Reading All Messages", roomId);
    const room = await Room.findOne({ roomId }).populate("users");
    if (!room) {
      throw new Error(`Room with roomId ${roomId} not found`);
    }

    const senderField = `unread.user${
      room.users.userA.id.equals(sender) ? "A" : "B"
    }`;

    console.log("Read all messages of room", roomId);
    console.log("With User", sender);

    await Promise.all([
      Room.findOneAndUpdate(
        { roomId },
        { $set: { [senderField]: 0 } },
        { new: true, lean: true }
      ),

      Message.updateMany(
        { roomId, recipient: sender },
        { $set: { isRead: true } }
      ),
    ]);
  } catch (e) {
    console.log("Error reading all message:", e.message);
  }
};

export const getAllMessages = async (data, socket) => {
  try {
    const { roomId, currentPage: page = 1, limit = 15 } = data;

    const skip = (page - 1) * limit;
    const messages = await Message.find({
      roomId,
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalMessages = await Message.countDocuments({ roomId });
    const totalPages = Math.ceil(totalMessages / limit);

    socket.emit("all_messages", {
      currentPage: page,
      totalMessages,
      totalPages,
      messages,
      roomId,
    });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    socket.emit("all_messages:error", error.message);
  }
};

export const getAllRooms = async (data, socket) => {
  try {
    const { userId, location } = data;

    // Find all Like documents related to the user and get their IDs
    const likeIds = await Like.find({
      $or: [{ "userA.id": userId }, { "userB.id": userId }],
    })
      .distinct("_id")
      .lean();

    // Find all Room documents where the user is a participant
    const rooms = await Room.find({
      users: { $in: likeIds },
    })
      .populate("users")
      .lean();

    // Get unique IDs of other users in these rooms
    const otherUserIds = [
      ...new Set(
        rooms.flatMap((room) => {
          const { userA, userB } = room.users;
          return [userA.id.equals(userId) ? userB.id : userA.id];
        })
      ),
    ];

    // Fetch other users' details and online users from Redis
    const [otherUsers, onlineUser] = await Promise.all([
      User.aggregate([
        { $match: { _id: { $in: otherUserIds } } },
        { $project: { password: 0 } },
        ...attachPlanFeatureDetails(),
      ]),
      getSetFromRedis("online_users").then((set) => new Set(set)),
    ]);

    // Map user details by their IDs
    const userMap = Object.fromEntries(
      otherUsers.map((user) => [user._id.toString(), user])
    );

    // Enrich room data with other user details and distance
    const enrichedRooms = rooms.reduce((acc, room) => {
      const { userA, userB } = room.users;
      let otherUserId = userA.id.equals(userId) ? userB.id : userA.id;

      // Check if the other user has blocked the current user before proceeding
      let otherUser = userMap[otherUserId.toString()];
      const blocked = otherUser.blockUsers?.some((blockedId) =>
        blockedId.equals(userId)
      );
      if (!otherUser || blocked) return acc;

      // Join socket room and fetch messages
      const roomId = room.roomId;
      socket.join(roomId);
      getAllMessages({ roomId }, socket);
      console.log("Socket joined room", roomId);

      // Calculate unread messages and distance
      let unread = userA.id.equals(userId)
        ? room.unread.userA
        : room.unread.userB;
      otherUser = {
        ...otherUser,
        distance: calculateDistance(
          otherUser.location.latitude,
          otherUser.location.longitude,
          location.latitude,
          location.longitude
        ),
        active: onlineUser.has(otherUser.email),
      };
      otherUser.distance = otherUser.distance < 1 ? 1 : otherUser.distance;
      otherUser.isIncognito = otherUser.planFeature.visibility === "incognito";

      // Append enriched room data to the result
      acc.push({ ...room, otherUser, unread });
      return acc;
    }, []);

    // Emit the enriched rooms to the client
    socket.emit("all_convo", enrichedRooms);
  } catch (error) {
    console.error("Error fetching convo:", error);
    socket.emit("convo_error", "Failed to fetch user matches");
  }
};

import {
  setToRedis,
  getFromRedis,
  getTimeToLive,
  setSetToRedis,
  deleteFromRedis,
  getListFromRedis,
  removeSetFromRedis,
} from "../../redis/redis_methods.js";
import User from "../../models/user_model.js";
import expire from "../../redis/redis_expire.js";

export const onDisconnect = async (socket) => {
  console.log("From auto disconnect");
  await disconnectUser(socket);
  console.log("Socket Disconnected");
};

export const connectUser = async (email, socket, isEmit) => {
  console.log("User: ", email, " connected");

  if (socket.email) return;
  socket.email = email;
  if (isEmit) socket.emit("user_connected");

  const userKey = `user:${email}`;
  const redisUser = await getFromRedis(userKey);
  const user = redisUser || (await User.findOne({ email }));
  const userId = user._id.toString();
  socket.userId = userId;

  const boostKey = `active_boost:${userId}`;
  const deleteKey = `deleteRoom:${userId}`;

  const [isActivatedBoost, boostDur, roomDeletions] = await Promise.all([
    getTimeToLive(boostKey),
    getFromRedis(boostKey),
    getListFromRedis(deleteKey),
  ]);

  console.table({ remaining: isActivatedBoost, ...boostDur });

  if (isActivatedBoost > 0) {
    socket.emit("boost_activated", {
      duration: isActivatedBoost,
      totalDuration: boostDur.dur,
      deduct: false,
    });
  }

  if (roomDeletions && roomDeletions.length > 0) {
    console.log("\nSending Room Deletions");

    const obj = await Promise.all(
      roomDeletions.map(async ({ key, userId, ...rest }) => {
        const remaining = await getTimeToLive(key);
        return { ...rest, remaining };
      })
    );

    console.log(obj);
    socket.emit("room_deletion", obj);
  }

  await Promise.all([
    setToRedis(`socket:${email}`, socket.id, 0),
    setSetToRedis("online_users", email),
  ]);

  socket.broadcast.emit("connect_match", socket.email);
  if (!redisUser) {
    await setToRedis(userKey, user, expire.user);
  }
};

export const disconnectUser = async (socket) => {
  if (!socket.email) return;

  const key = `socket:${socket.email}`;
  await Promise.all([
    removeSetFromRedis("online_users", socket.email),
    deleteFromRedis(key),
  ]);

  socket.broadcast.emit("disconnect_match", socket.email);
  console.log("User: ", socket.email, " disconnected");
  
  if (socket.userId) delete socket.userId;
  if (socket.email) delete socket.email;
};

export const changeEmail = async (data, socket) => {
  const { oldEmail, newEmail } = data;
  const oldkey = `socket:${oldEmail}`;
  const newkey = `socket:${newEmail}`;
  await Promise.all([
    removeSetFromRedis("online_users", oldEmail),
    deleteFromRedis(oldkey),

    setSetToRedis("online_users", newEmail),
    setToRedis(newkey, socket.id, 0),
  ]);
  socket.email = newEmail;
  console.log("User email has been changed to", newEmail);
};

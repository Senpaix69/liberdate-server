import {
  setToRedis,
  getFromRedis,
  getSetFromRedis,
  getListFromRedis,
} from "../../redis/redis_methods.js";
import { calculateDistance, makeRoom } from "./socket_helpers.js";
import { createNotification } from "../../clients/one_signal_client.js";
import PlanFeature from "../../models/plan_features_model.js";
import Notification from "../../models/notification_model.js";
import { addRoom } from "../../bull_mq/producer.js";
import expire from "../../redis/redis_expire.js";
import Like from "../../models/like_model.js";
import Room from "../../models/room_model.js";
import User from "../../models/user_model.js";
import moment from "moment";

const handleLike = async (data, io) => {
  const {
    users: { userA, userB },
    likeType,
    isUndo,
  } = data;

  console.table(userA);
  console.table(userB);
  console.log("Type:", likeType);

  try {
    const match = await handlePlanFeature(likeType, userA, userB);
    await handleMatch(io, match, isUndo, likeType, userA, userB);
    const roomId = makeRoom(userA.id, userB.id);

    if (match?.userB.likeType) {
      // await match.deleteOne();
      const exist = await Room.findOne({ roomId }).lean();
      if (exist) {
        console.log("Already Matched and Room Exists");
        return;
      }
    }

    const [
      socketAId,
      socketBId,
      userAData,
      userBData,
      onlineUsers,
      memberships,
    ] = await Promise.all([
      getFromRedis(`socket:${userA.email}`),
      getFromRedis(`socket:${userB.email}`),
      getFromRedis(`user:${userA.email}`),
      getFromRedis(`user:${userB.email}`),
      getSetFromRedis("online_users").then((set) => new Set(set)),
      getListFromRedis("glmpse"),
    ]);

    let user1 = userAData || (await User.findById(userA.id).lean());
    let user2 = userBData || (await User.findById(userB.id).lean());

    if (user1.toObject) user1 = user1.toObject();
    if (user2.toObject) user2 = user2.toObject();

    let d = calculateDistance(
      user1.location.latitude,
      user1.location.longitude,
      user2.location.latitude,
      user2.location.longitude
    );
    d = d < 1 ? 1 : d;

    user1.active = true;
    user1.distance = d;
    if (onlineUsers.has(user2.email)) {
      user2.distance = d;
      user2.active = true;
    }

    if (match?.userB.likeType) {
      const timestamp = moment().utc().format();
      const [_, not1, not2] = await Promise.all([
        Room.create({ roomId, users: match._id, timestamp }),
        Notification.create({
          message: "Matched with you",
          senderId: user1._id,
          userId: user2._id,
          type: "match",
        }),
        Notification.create({
          message: "Matched with you",
          senderId: user2._id,
          userId: user1._id,
          type: "match",
        }),
      ]);

      addRoom(roomId, userA.id, userB.id);
      console.log("Room Created:", roomId);
      console.log("UserA socket:", socketAId);
      console.log("UserB socket:", socketBId);

      const [socketA, socketB] = await Promise.all([
        io.in(socketAId).fetchSockets(),
        io.in(socketBId).fetchSockets(),
      ]);

      if (socketA && socketA.length > 0) {
        socketA[0].join(roomId);
        io.to(socketAId).emit("matched", {
          otherUser: user2,
          id: not1._id,
          users: match,
          roomId,
        });
      } else {
        console.log("Socket A: Couldn't join room");
      }

      if (socketB && socketB.length > 0) {
        socketB[0].join(roomId);
        io.to(socketBId).emit("matched", {
          otherUser: user1,
          users: match,
          id: not2._id,
          roomId,
        });
      } else {
        console.log("Socket B: Couldn't join room");
      }
    } else {
      const message = likeType === "spark" ? "Spark" : "Super Spark";

      const activeMem =
        memberships?.filter((e) => e._id === user2.membershipId)[0]?.price > 0;
      const [_, not] = await Promise.all([
        createNotification({
          text: `${message}ed your Ice Breaker`,
          recipient: user2._id,
          username: activeMem ? user1.name : "Somebody",
          sender: user1._id,
        }),
        Notification.create({
          message: `${message}ed your Ice Breaker`,
          senderId: user1._id,
          userId: user2._id,
          type: likeType,
        }),
      ]);

      if (socketBId) {
        io.to(socketBId).emit("liked", {
          likeType: likeType,
          id: not._id,
          user: user1,
        });
      }
    }
  } catch (e) {
    console.log(e.message);
  }
};

const handleMatch = async (io, match, isUndo, likeType, userA, userB) => {
  if (match) {
    if (isUndo && !match.userB.likeType) {
      console.log("Rewinding...");
      const [socketBId, _] = await Promise.all([
        getFromRedis(`socket:${userB.email}`),
        match.deleteOne(),
      ]);
      io.to(socketBId).emit("remove_liked", userA.id);
      return;
    }

    if (match.userA.id.toString() === userB.id) {
      match.userB.likeType = likeType;
    } else if (
      match.userA.id.toString() === userA.id &&
      likeType === "superSpark"
    ) {
      match.userA.likeType = likeType;
    } else {
      return;
    }
    await match.save();
  } else {
    await Like.create({
      userA: { id: userA.id, likeType: likeType },
      userB: { id: userB.id },
    });
  }
};

const handlePlanFeature = async (likeType, userA, userB) => {
  const featuresKey = `planFeature:${userA.id}`;
  const planFeature = await PlanFeature.findOne({ userId: userA.id });

  if (likeType === "spark") {
    if (planFeature?.sparks.amount > 0) {
      planFeature.sparks.amount--;
    } else if (planFeature.sparks.amount !== -1) {
      return;
    }
  } else if (likeType === "superSpark") {
    if (planFeature.superSpark.amount > 0) {
      planFeature.superSpark.amount--;
    } else return;
  }

  const [match, _] = await Promise.all([
    Like.findOne({
      $or: [
        { "userA.id": userA.id, "userB.id": userB.id },
        { "userA.id": userB.id, "userB.id": userA.id },
      ],
    }),
    (async () => {
      await Promise.all([
        setToRedis(featuresKey, planFeature, expire.planFeature),
        planFeature.save(),
      ]);
    })(),
  ]);

  return match;
};

export default handleLike;

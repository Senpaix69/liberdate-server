import {
  setToRedis,
  getFromRedis,
  getSetFromRedis,
  getListFromRedis,
} from "../../redis/redis_methods.js";
import {
  findMatch,
  applyUserQuery,
  calculateDistance,
  attachUserDetails,
  attachPlanFeatureDetails,
} from "./socket_helpers.js";
import PlanFeature from "../../models/plan_features_model.js";
import Notification from "../../models/notification_model.js";
import { connectUser } from "./connection_methods.js";
import expire from "../../redis/redis_expire.js";
import User from "../../models/user_model.js";
import Like from "../../models/like_model.js";
import Room from "../../models/room_model.js";

export const getSuggestions = async (data, socket) => {
  try {
    const { location, filter, email } = data;
    if (!socket.email || !socket.userId) {
      connectUser(email, socket, false);
    }

    console.table(location);
    console.table(filter);

    const [boostUsersIds, currentUser, onlineUserIds] = await Promise.all([
      getListFromRedis("active_boost").then((users) =>
        users?.map((u) => u.userId)
      ),
      getFromRedis(`user:${email}`),
      getSetFromRedis("online_users"),
    ]);

    console.log("Boosted Users:", boostUsersIds);

    const userQuery = applyUserQuery(filter.status, onlineUserIds);
    const planFeaturePipeline = attachPlanFeatureDetails();
    const attachmentPipeline = attachUserDetails();

    const result = await User.aggregate([
      ...userQuery,
      ...attachmentPipeline,
      ...planFeaturePipeline,
    ]).exec();

    const filtered = result.reduce(
      (acc, user) => {
        const plan = user.planFeature;
        const isVisible = plan.visibility === "show";

        const didBlock = currentUser.blockUsers?.includes(user._id.toString());
        const blocked = user.blockUsers?.some((bId) =>
          bId.equals(socket.userId.toString())
        );

        if (!isVisible || user.email === email || didBlock || blocked) {
          return acc;
        }

        let status = true;
        let isOnline = onlineUserIds.includes(user.email);

        if (filter.status === "Offline") {
          status = !isOnline;
        }

        const match = status && findMatch(user, filter, location);
        if (match !== null && match) {
          user.distance = match;
          user.active = isOnline;
          console.log("user:", user.email, "has matched");
          if (plan.hideAge) {
            user.age = -1;
          }

          if (boostUsersIds?.includes(user._id.toString())) {
            acc.boosted.push(user);
          } else {
            acc.regular.push(user);
          }
        }

        return acc;
      },
      { boosted: [], regular: [] }
    );

    const finalFiltered = [...filtered.boosted, ...filtered.regular];

    socket.emit("recieve_suggestions", finalFiltered);
  } catch (error) {
    console.error(error.message);
    socket.emit("error", { error: error.message });
  }
};

export const getAllSparks = async (data, socket) => {
  try {
    const { userId, location } = data;
    console.log("Finding Sparks of", userId);

    const likes = await Like.find({ "userB.id": userId }).lean();
    const likeIds = likes.map((like) => like._id);

    const rooms = await Room.find({
      users: { $in: likeIds },
    })
      .distinct("users")
      .lean();

    const filteredLikes = likes.filter((like) => {
      return !rooms.some((roomUser) => roomUser.equals(like._id));
    });

    const userIds = new Set();
    filteredLikes.forEach(({ userA, userB }) => {
      if (!userA.id.equals(userId)) userIds.add(userA.id);
      if (!userB.id.equals(userId)) userIds.add(userB.id);
    });

    const [users, onlineUsers] = await Promise.all([
      User.find({ _id: { $in: Array.from(userIds) } }, { password: 0 }),
      getSetFromRedis("online_users").then((set) => new Set(set)),
    ]);

    const usersMap = new Map(users.map((user) => [user._id.toString(), user]));

    const sparks = filteredLikes.reduce((acc, like) => {
      const userAId = like.userA.id.toString();
      let otherUser = usersMap.get(userAId)?.toObject();
      const blocked = otherUser.blockUsers?.some((blockedId) =>
        blockedId.equals(userId)
      );
      if (!otherUser || blocked) return acc;

      const d = calculateDistance(
        otherUser.location.latitude,
        otherUser.location.longitude,
        location.latitude,
        location.longitude
      );
      otherUser.distance = d < 1 ? 1 : d;

      if (otherUser) {
        if (onlineUsers.has(otherUser.email)) {
          otherUser.active = true;
        }
        const likeType = like.userA.likeType;
        if (likeType !== null) {
          acc.push({ user: otherUser, likeType });
        }
      }
      return acc;
    }, []);

    socket.emit("all_sparks", sparks);
  } catch (error) {
    console.error("Error fetching sparks:", error);
    socket.emit("sparks_error", "Failed to fetch sparks");
  }
};

export const triggerBoost = async (data, socket) => {
  const { userId } = data;
  try {
    const boostKey = `active_boost:${userId}`;
    const alreadyBoostActive = await getFromRedis(boostKey);
    if (alreadyBoostActive) {
      return;
    }
    const featuresKey = `planFeature:${userId}`;
    const planFeature = await PlanFeature.findOne({ userId });
    console.log(planFeature, userId);
    if (!planFeature) {
      socket.emit("boost_error", "Couldn't find plan feature");
      return;
    }

    if (planFeature.freeBoost.amount <= 0) {
      socket.emit("boost_error", "You don't have boost");
      return;
    }

    planFeature.freeBoost.amount--;
    await planFeature.save();
    const dur = planFeature.freeBoost.duration;

    await Promise.all([
      setToRedis(boostKey, { dur, userId }, dur / 60),
      setToRedis(featuresKey, planFeature, expire.planFeature),
    ]);

    socket.emit("boost_activated", {
      totalDuration: dur,
      duration: dur,
      deduct: true,
    });
  } catch (e) {
    console.log("Error triggering boost", e.message);
  }
};

export const getNotifications = async (data, socket) => {
  try {
    const { userId, location, page = 1, limit = 15, type } = data;

    const skip = (page - 1) * limit;
    console.table(type);

    const query = { userId };
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalNotifications = await Notification.countDocuments({ userId });
    const totalPages = Math.ceil(totalNotifications / limit);

    const senderIds = [...new Set(notifications.map((not) => not.senderId))];
    const users = await User.find({ _id: { $in: senderIds } }).lean();
    const userMap = Object.fromEntries(
      users.map((user) => [user._id.toString(), user])
    );

    const enrichedNotifications = notifications.map((not) => {
      let user = userMap[not.senderId];
      const d = calculateDistance(
        user.location.latitude,
        user.location.longitude,
        location.latitude,
        location.longitude
      );
      user.distance = d < 1 ? 1 : d;
      return { ...not, user };
    });

    console.log("Sending all notifications to", userId);

    socket.emit("all_notifications", {
      notifications: enrichedNotifications,
      totalNotifications,
      currentPage: page,
      type: type,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    socket.emit("notifications_error", "Failed to fetch user notifications");
  }
};

export const setSeenNotifications = async (userId) => {
  try {
    await Notification.updateMany({ userId }, { $set: { read: true } });
    console.log("Notification Seen for", userId);
  } catch (error) {
    console.error("Error setting notifications to seen:", error);
  }
};

export const blockUser = async (data, io) => {
  try {
    const { blockeeEmail, roomId } = data;
    console.table(data);

    const socketId = await getFromRedis(`socket:${blockeeEmail}`);
    if (socketId) {
      io.to(socketId).emit("blocked_user", roomId);
    }
  } catch (error) {
    console.error("Error blocking user:", error);
  }
};

export const unblockUser = async (data, io) => {
  try {
    const { blockeeEmail, roomId, user } = data;
    console.log(data);
    const room = await Room.findOne({ roomId }).populate("users").lean();
    if (!room) return;

    const socketId = await getFromRedis(`socket:${blockeeEmail}`);
    if (socketId) {
      io.to(socketId).emit("unblocked_user", { ...room, otherUser: user });
    }
  } catch (error) {
    console.error("Error blocking user:", error);
  }
};

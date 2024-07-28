import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";
import User from "../models/user_model.js";
import MembershipTime from "../models/membership_time_model.js";
import expire from "../redis/redis_expire.js";

export const addMembershipTime = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const precached = await getListFromRedis("membershipTime");

    let membershipTime =
      (precached && precached[0]) || (await MembershipTime.findOne());
    if (membershipTime) {
      return res.status(400).json({ error: "You can add only once." });
    }

    membershipTime = await MembershipTime.create({
      ...req.body,
      adminId: user._id,
    });

    if (!membershipTime) {
      return res
        .status(400)
        .json({ error: "Couldn't create Membership Time." });
    }

    const membershipTimeKey = `membershipTime:${membershipTime._id}`;

    await Promise.all([
      setToRedis(membershipTimeKey, membershipTime, expire.time),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(membershipTime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMembershipTime = async (req, res) => {
  try {
    const { membershipTimeId } = req.params;
    const membershipTimeKey = `membershipTime:${membershipTimeId}`;

    const redisMembershipTime = await getFromRedis(membershipTimeKey);
    const membershipTime =
      redisMembershipTime || (await MembershipTime.findOne());
    if (!membershipTime) {
      return res.status(400).json({ error: "Membership Time not found" });
    }
    await setToRedis(membershipTimeKey, membershipTime, expire.time);

    res.json(membershipTime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMembershipTime = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const membershipTime = await MembershipTime.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!membershipTime) {
      return res.status(400).json({ error: "Membership Time not found" });
    }

    const membershipTimeKey = `membershipTime:${membershipTime._id}`;

    await Promise.all([
      setToRedis(membershipTimeKey, membershipTime, expire.time),
      setToRedis(key, user, expire.user),
    ]);

    res.json(membershipTime.timePeriod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMembershipTime = async (req, res) => {
  try {
    const { membershipTimeId } = req.params;

    const deleteOB = await MembershipTime.findByIdAndDelete(membershipTimeId);
    if (!deleteOB) {
      return res.status(400).json({ error: "Membership Time not found" });
    }
    const membershipTimeKey = `membershipTime:${membershipTimeId}`;
    await deleteFromRedis(membershipTimeKey);
    res.json({ message: "Membership Time deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllMembershipsTime = async (_, res) => {
  try {
    const precached = await getListFromRedis("membershipTime");
    if (precached) {
      console.log("Precached Time");
      return res.json(precached[0].timePeriod);
    }

    const membershipTime = await MembershipTime.findOne();
    if (!membershipTime) {
      return res.status(400).json({ error: "Membership Time not found" });
    }

    const membershipTimeKey = `membershipTime:${membershipTime._id}`;
    await setToRedis(membershipTimeKey, membershipTime, expire.time);

    res.json(membershipTime.timePeriod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllMembershipsTime = async (_, res) => {
  try {
    await Promise.all([
      MembershipTime.deleteMany(),
      deleteFromRedisByPattern("membershipTime"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

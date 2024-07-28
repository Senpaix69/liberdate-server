import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
  deleteFromRedisByPattern,
} from "../redis/redis_methods.js";
import User from "../models/user_model.js";
import Restriction from "../models/restriction_model.js";
import expire from "../redis/redis_expire.js";

export const addRestriction = async (req, res) => {
  try {
    const { email, ...restrictionData } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const newRestriction = await Restriction.findOneAndUpdate(
      { adminId: user._id },
      { ...restrictionData, adminId: user._id },
      { new: true, upsert: true }
    );

    const restrictionKey = "restriction:adminRestrictions";
    await Promise.all([
      setToRedis(restrictionKey, newRestriction, expire.restriction),
      setToRedis(key, redisUser || user, expire.user),
    ]);

    res.json(newRestriction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRestriction = async (req, res) => {
  try {
    const { restrictionId } = req.params;
    const key = "restriction:adminRestrictions";
    const redisrestriction = await getFromRedis(key);
    const restriction =
      redisrestriction || (await Restriction.findById(restrictionId));
    if (!restriction) {
      return res.status(404).json({ error: "Restriction not found" });
    }
    await setToRedis(key, restriction, expire.restriction);

    res.json(restriction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRestriction = async (req, res) => {
  try {
    const { restrictionId, email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const restriction = await Restriction.findByIdAndUpdate(
      restrictionId,
      req.body,
      { new: true }
    );

    if (!restriction) {
      return res.status(404).json({ error: "Restriction not found" });
    }

    const restrictionkey = "restriction:adminRestrictions";

    await Promise.all([
      setToRedis(restrictionkey, restriction, expire.restriction),
      setToRedis(key, user, expire.user),
    ]);

    res.json(restriction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRestriction = async (req, res) => {
  try {
    const { restrictionId } = req.params;
    const restrictionkey = "restriction:adminRestrictions";
    const deleteOB = await Restriction.findByIdAndDelete(restrictionId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Restriction not found" });
    }
    await deleteFromRedis(restrictionkey);
    res.json({ message: "Restriction deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllRestrictions = async (_, res) => {
  try {
    const precached = await getFromRedis("restriction:adminRestrictions");
    if (precached) {
      console.log("Precached Restriction");
      return res.json(precached);
    }

    const restriction = await Restriction.findOne();
    if (!restriction) {
      return res.status(404).json({ error: "Restriction not found" });
    }

    const restrictionkey = "restriction:adminRestrictions";
    await setToRedis(restrictionkey, restriction, expire.restriction);

    res.json(restriction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllRestrictions = async (_, res) => {
  try {
    await Restriction.deleteMany();
    await deleteFromRedisByPattern("restriction");
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

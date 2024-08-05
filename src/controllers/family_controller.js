import Family from "../models/family_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const manageFamily = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let family = await Family.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!family) {
      return res.status(400).json({ error: "Couldn't create Family" });
    }

    const familyKey = `family:${family._id}`;

    await Promise.all([
      setToRedis(familyKey, family, expire.family),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFamily = async (req, res) => {
  try {
    const { familyId } = req.params;
    const familyKey = `family:${familyId}`;

    const redisFamily = await getFromRedis(familyKey);
    const family = redisFamily || (await Family.findOne());
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }
    await setToRedis(familyKey, family, expire.family);

    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFamily = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const family = await Family.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    const familyKey = `family:${family._id}`;

    await Promise.all([
      setToRedis(familyKey, family, expire.family),
      setToRedis(key, user, expire.user),
    ]);

    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFamily = async (req, res) => {
  try {
    const { familyId } = req.params;

    const deleteOB = await Family.findByIdAndDelete(familyId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Family not found" });
    }
    const familyKey = `family:${familyId}`;
    await deleteFromRedis(familyKey);
    res.json({ message: "Family deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllFamily = async (_, res) => {
  try {
    const precached = await getListFromRedis("family");
    if (precached && precached.length > 0) {
      console.log("Precached Family");
      return res.json(precached[0]);
    }

    const family = await Family.findOne();
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    const familyKey = `family:${family._id}`;

    await setToRedis(familyKey, family, expire.family);

    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllFamily = async (_, res) => {
  try {
    await Promise.all([
      Family.deleteMany(),
      deleteFromRedisByPattern("family"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

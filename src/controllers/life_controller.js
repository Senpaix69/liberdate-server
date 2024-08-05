import Life from "../models/life_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const manageLife = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let life = await Life.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!life) {
      return res.status(400).json({ error: "Couldn't create Life styles" });
    }

    const lifeKey = `life:${life._id}`;

    await Promise.all([
      setToRedis(lifeKey, life, expire.life),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(life);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLife = async (req, res) => {
  try {
    const { lifeId } = req.params;
    const lifeKey = `life:${lifeId}`;

    const redisLife = await getFromRedis(lifeKey);
    const life = redisLife || (await Life.findOne());
    if (!life) {
      return res.status(404).json({ error: "Life styles not found" });
    }
    await setToRedis(lifeKey, life, expire.life);

    res.json(life);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLife = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const life = await Life.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!life) {
      return res.status(404).json({ error: "Life not found" });
    }

    const lifeKey = `life:${life._id}`;

    await Promise.all([
      setToRedis(lifeKey, life, expire.life),
      setToRedis(key, user, expire.user),
    ]);

    res.json(life);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteLife = async (req, res) => {
  try {
    const { lifeId } = req.params;

    const deleteOB = await Life.findByIdAndDelete(lifeId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Life style not found" });
    }
    const lifeKey = `life:${lifeId}`;
    await deleteFromRedis(lifeKey);
    res.json({ message: "Life style deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllLife = async (_, res) => {
  try {
    const precached = await getListFromRedis("life");
    if (precached && precached.length > 0) {
      console.log("Precached Life style");
      return res.json(precached[0]);
    }

    const life = await Life.findOne();
    if (!life) {
      return res.status(404).json({ error: "Life not found" });
    }

    const lifeKey = `life:${life._id}`;

    await setToRedis(lifeKey, life, expire.life);

    res.json(life);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllLife = async (_, res) => {
  try {
    await Promise.all([
      Life.deleteMany(),
      deleteFromRedisByPattern("life"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

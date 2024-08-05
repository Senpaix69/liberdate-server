import Physical from "../models/physical_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const managePhysical = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let physical = await Physical.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!physical) {
      return res.status(400).json({ error: "Couldn't create Physical" });
    }

    const physicalKey = `physical:${physical._id}`;

    await Promise.all([
      setToRedis(physicalKey, physical, expire.physical),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(physical);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPhysical = async (req, res) => {
  try {
    const { physicalId } = req.params;
    const physicalKey = `physical:${physicalId}`;

    const redisPhysical = await getFromRedis(physicalKey);
    const physical = redisPhysical || (await Physical.findOne());
    if (!physical) {
      return res.status(404).json({ error: "Physical not found" });
    }
    await setToRedis(physicalKey, physical, expire.physical);

    res.json(physical);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePhysical = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const physical = await Physical.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!physical) {
      return res.status(404).json({ error: "Physical not found" });
    }

    const physicalKey = `physical:${physical._id}`;

    await Promise.all([
      setToRedis(physicalKey, physical, expire.physical),
      setToRedis(key, user, expire.user),
    ]);

    res.json(physical);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePhysical = async (req, res) => {
  try {
    const { physicalId } = req.params;

    const deleteOB = await Physical.findByIdAndDelete(physicalId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Physical not found" });
    }
    const physicalKey = `physical:${physicalId}`;
    await deleteFromRedis(physicalKey);
    res.json({ message: "Physical deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPhysical = async (_, res) => {
  try {
    const precached = await getListFromRedis("physical");
    if (precached && precached.length > 0) {
      console.log("Precached Physical");
      return res.json(precached[0]);
    }

    const physical = await Physical.findOne();
    if (!physical) {
      return res.status(404).json({ error: "Physical not found" });
    }

    const physicalKey = `physical:${physical._id}`;

    await setToRedis(physicalKey, physical, expire.physical);

    res.json(physical);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllPhysical = async (_, res) => {
  try {
    await Promise.all([
      Physical.deleteMany(),
      deleteFromRedisByPattern("physical"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

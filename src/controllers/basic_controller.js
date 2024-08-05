import expire from "../redis/redis_expire.js";
import Basic from "../models/basic_model.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const manageBasic = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let basic = await Basic.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!basic) {
      return res.status(400).json({ error: "Couldn't create basic." });
    }

    const basicKey = `basic:${basic._id}`;

    await Promise.all([
      setToRedis(basicKey, basic, expire.basic),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(basic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBasic = async (req, res) => {
  try {
    const { basicId } = req.params;
    const basicKey = `basic:${basicId}`;

    const redisBasic = await getFromRedis(basicKey);
    const basic = redisBasic || (await Basic.findOne());
    if (!basic) {
      return res.status(404).json({ error: "Basic not found" });
    }
    await setToRedis(basicKey, basic, expire.basic);

    res.json(basic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBasic = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const basic = await Basic.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!basic) {
      return res.status(404).json({ error: "Basic not found" });
    }

    const basicKey = `basic:${basic._id}`;

    await Promise.all([
      setToRedis(basicKey, basic, expire.basic),
      setToRedis(key, user, expire.user),
    ]);

    res.json(basic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBasic = async (req, res) => {
  try {
    const { basicId } = req.params;

    const deleteOB = await Basic.findByIdAndDelete(basicId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Basic not found" });
    }
    const basicKey = `basic:${basicId}`;
    await deleteFromRedis(basicKey);
    res.json({ message: "Basic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllBasic = async (_, res) => {
  try {
    const precached = await getListFromRedis("basic");
    if (precached && precached.length > 0) {
      console.log("Precached basic");
      return res.json(precached[0]);
    }

    const basic = await Basic.findOne();
    if (!basic) {
      return res.status(404).json({ error: "Basic not found" });
    }

    const basicKey = `basic:${basic._id}`;

    await setToRedis(basicKey, basic, expire.basic);

    res.json(basic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllBasic = async (_, res) => {
  try {
    await Promise.all([Basic.deleteMany(), deleteFromRedisByPattern("basic")]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

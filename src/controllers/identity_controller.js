import Identity from "../models/identity_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const manageIdentity = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let identity = await Identity.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!identity) {
      return res.status(400).json({ error: "Couldn't create identity" });
    }

    const identityKey = `identity:${identity._id}`;

    await Promise.all([
      setToRedis(identityKey, identity, expire.identity),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getIdentity = async (req, res) => {
  try {
    const { identityId } = req.params;
    const identityKey = `identity:${identityId}`;

    const redisIdentity = await getFromRedis(identityKey);
    const identity = redisIdentity || (await Identity.findOne());
    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }
    await setToRedis(identityKey, identity, expire.identity);

    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateIdentity = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const identity = await Identity.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }

    const identityKey = `identity:${identity._id}`;

    await Promise.all([
      setToRedis(identityKey, Identity, expire.identity),
      setToRedis(key, user, expire.user),
    ]);

    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteIdentity = async (req, res) => {
  try {
    const { identityId } = req.params;

    const deleteOB = await Identity.findByIdAndDelete(identityId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Identity not found" });
    }
    const identityKey = `identity:${identityId}`;
    await deleteFromRedis(identityKey);
    res.json({ message: "Identity deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllIdentity = async (_, res) => {
  try {
    const precached = await getListFromRedis("identity");
    if (precached && precached.length > 0) {
      console.log("Precached Identity");
      return res.json(precached[0]);
    }

    const identity = await Identity.findOne();
    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }

    const identityKey = `identity:${identity._id}`;

    await setToRedis(identityKey, identity, expire.identity);

    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllIdentity = async (_, res) => {
  try {
    await Promise.all([
      Identity.deleteMany(),
      deleteFromRedisByPattern("identity"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

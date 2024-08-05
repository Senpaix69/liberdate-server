import Interest from "../models/interest_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
  setListFromRedis,
  deleteFromRedisByPattern,
} from "../redis/redis_methods.js";

export const addInterest = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }
    const newInterest = await Interest.create({
      ...req.body,
      adminId: user._id,
    });

    const interestKey = `interest:${newInterest._id}`;

    await Promise.all([
      setToRedis(interestKey, newInterest, expire.interest),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(newInterest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInterest = async (req, res) => {
  try {
    const { interestId } = req.params;
    const key = `interest:${interestId}`;
    const redisInterest = await getFromRedis(key);
    const interest = redisInterest || (await Interest.findById(interestId));
    if (!interest) {
      return res.status(404).json({ error: "Interest not found" });
    }
    await setToRedis(key, interest, expire.interest);

    res.json(interest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInterest = async (req, res) => {
  try {
    const { interestId, email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const interest = await Interest.findByIdAndUpdate(interestId, req.body, {
      new: true,
    });

    if (!interest) {
      return res.status(404).json({ error: "Interest not found" });
    }

    const interestkey = `interest:${interestId}`;

    await Promise.all([
      setToRedis(interestkey, interest, expire.interest),
      setToRedis(key, user, expire.user),
    ]);

    res.json(interest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInterest = async (req, res) => {
  try {
    const { interestId } = req.params;
    const interestkey = `interest:${interestId}`;
    const deleteOB = await Interest.findByIdAndDelete(interestId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Interest not found" });
    }
    await deleteFromRedis(interestkey);
    res.json({ message: "Interest deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllInterests = async (_, res) => {
  try {
    const precached = await getListFromRedis("interest");
    const total = await Interest.countDocuments();

    if (precached) {
      console.log("Precached Interests");
    }

    let interests = precached;
    if (precached?.length !== total) {
      console.log("Interests From Db");
      interests = await Interest.find();
      await deleteFromRedisByPattern("interest");
      await setListFromRedis("interest", interests, expire.interest);
    }

    res.json(interests);
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

export const deleteAllInterests = async (_, res) => {
  try {
    await Interest.deleteMany();
    await deleteFromRedisByPattern("interest");
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

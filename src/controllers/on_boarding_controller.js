import OnBoarding from "../models/on_boarding_model.js";
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

export const addPage = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }
    const newOnBoarding = await OnBoarding.create({
      ...req.body,
      adminId: user._id,
    });

    const onBoardingKey = `onBoarding:${newOnBoarding._id}`;

    await Promise.all([
      setToRedis(onBoardingKey, newOnBoarding, expire.onBoarding),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(newOnBoarding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const key = `onBoarding:${pageId}`;
    const redisOnBoarding = await getFromRedis(key);
    const onBoarding = redisOnBoarding || (await OnBoarding.findById(pageId));
    if (!onBoarding) {
      return res.status(404).json({ error: "Page not found" });
    }
    await setToRedis(key, onBoarding, expire.onBoarding);

    res.json(onBoarding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { pageId, email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const onBoarding = await OnBoarding.findByIdAndUpdate(pageId, req.body, {
      new: true,
    });

    if (!onBoarding) {
      return res.status(404).json({ error: "Page not found" });
    }

    const onBoardingkey = `onBoarding:${pageId}`;

    await Promise.all([
      setToRedis(onBoardingkey, onBoarding, expire.onBoarding),
      setToRedis(key, user, expire.user),
    ]);

    res.json(onBoarding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const onBoardingkey = `onBoarding:${pageId}`;
    const deleteOB = await OnBoarding.findByIdAndDelete(pageId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Page not found" });
    }
    await deleteFromRedis(onBoardingkey);
    res.json({ message: "Page deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPages = async (_, res) => {
  try {
    const precached = await getListFromRedis("onBoarding");
    const total = await OnBoarding.countDocuments();

    if(precached) {
      console.log("Precached onBoarding");
    }

    let onBoardings = precached;
    if (precached?.length !== total) {
      console.log("Pages From Db");
      onBoardings = await OnBoarding.find();
      await deleteFromRedisByPattern("onBoarding");
      await setListFromRedis("onBoarding", onBoardings, expire.onBoarding);
    }

    res.json(onBoardings);
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

export const deleteAllPages = async (_, res) => {
  try {
    await OnBoarding.deleteMany();
    await deleteFromRedisByPattern("onBoarding");
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

import expire from "../redis/redis_expire.js";
import Coin from "../models/coin_model.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
  setListFromRedis,
  deleteFromRedisByPattern,
} from "../redis/redis_methods.js";

export const addCoin = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }
    const newCoin = await Coin.create({
      ...req.body,
      adminId: user._id,
    });

    const coinKey = `coin:${newCoin._id}`;

    await Promise.all([
      setToRedis(coinKey, newCoin, expire.coin),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(newCoin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCoin = async (req, res) => {
  try {
    const { coinId } = req.params;
    const key = `coin:${coinId}`;
    const redisCoin = await getFromRedis(key);
    const coin = redisCoin || (await Coin.findById(coinId));
    if (!coin) {
      return res.status(404).json({ error: "Coin not found" });
    }
    await setToRedis(key, coin, expire.Coin);

    res.json(coin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCoin = async (req, res) => {
  try {
    const { coinId, email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const coin = await Coin.findByIdAndUpdate(coinId, req.body, {
      new: true,
    });

    if (!coin) {
      return res.status(404).json({ error: "Coin not found" });
    }

    const coinkey = `coin:${coinId}`;

    await Promise.all([
      setToRedis(coinkey, coin, expire.coin),
      setToRedis(key, user, expire.user),
    ]);

    res.json(coin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCoin = async (req, res) => {
  try {
    const { coinId } = req.params;
    const coinkey = `Coin:${coinId}`;
    const deleteOB = await Coin.findByIdAndDelete(coinId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Coin not found" });
    }
    await deleteFromRedis(coinkey);
    res.json({ message: "Coin deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllCoins = async (_, res) => {
  try {
    const precached = await getListFromRedis("coin");
    const total = await Coin.countDocuments();

    if (precached) {
      console.log("Precached Coins");
    }

    let coins = precached;
    if (precached?.length !== total) {
      console.log("Coins From Db");
      coins = await Coin.find();
      await deleteFromRedisByPattern("coin");
      await setListFromRedis("coin", coins, expire.coin);
    }

    res.json(coins);
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

export const deleteAllCoins = async (_, res) => {
  try {
    await Coin.deleteMany();
    await deleteFromRedisByPattern("coin");
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

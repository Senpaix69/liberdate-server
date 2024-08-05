import Preference from "../models/preference_model.js";
import expire from "../redis/redis_expire.js";
import {
  deleteFromRedis,
  getFromRedis,
  setToRedis,
} from "../redis/redis_methods.js";

export const managePreference = async (req, res) => {
  try {
    const { userId } = req.body;

    const newPreferences = await Preference.findOneAndUpdate(
      { userId },
      { userId, ...req.body },
      { new: true, upsert: true }
    );

    if (!newPreferences) {
      return res.status(400).json({ error: "Error creating preferences" });
    }

    const preferenceKey = `preference:${userId}`;
    await setToRedis(preferenceKey, newPreferences, expire.user);

    res.json(newPreferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPreference = async (req, res) => {
  try {
    const { userId } = req.params;

    const preferenceKey = `preference:${userId}`;
    const redisPreference = await getFromRedis(preferenceKey);

    const preference =
      redisPreference || (await Preference.findOne({ userId }));

    if (!preference) {
      return res.status(404).json({ error: "Preferences not found" });
    }
    await setToRedis(preferenceKey, preference, expire.user);

    res.json(preference);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePreference = async (req, res) => {
  try {
    const { userId } = req.body;

    const preference = await Preference.findOneAndUpdate(userId, req.body, {
      new: true,
    });

    if (!preference) {
      return res.status(404).json({ error: "Preferences not found" });
    }

    const preferenceKey = `preference:${userId}`;
    await setToRedis(preferenceKey, preference, expire.user);

    res.json(preference);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePreference = async (req, res) => {
  try {
    const { userId } = req.params;
    await Promise.all([
      Preference.findOneAndDelete(userId),
      deleteFromRedis(`preference:${userId}`),
    ]);
    if (!deleteOB) {
      return res.status(404).json({ error: "Preference not found" });
    }

    res.json({ message: "Preference deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const preferenceKey = `preference:${userId}`;
    const redisPreference = await getFromRedis(preferenceKey);

    const preference =
      redisPreference || (await Preference.findOne({ userId }));

    if (!preference) {
      return res.status(404).json({ error: "Preferences not found" });
    }

    res.json(preference);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    await Promise.all([
      Preference.findOneAndDelete(userId),
      deleteFromRedis(`preference:${userId}`),
    ]);
    if (!deleteOB) {
      return res.status(404).json({ error: "Preference not found" });
    }

    res.json({ message: "Preference deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

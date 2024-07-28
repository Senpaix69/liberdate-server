import Blacklist from "../models/blacklist_model.js";
import User from "../models/user_model.js";

export const addBlacklist = async (req, res) => {
  try {
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: "Ban type is required" });
    }

    const user = await User.findOne({
      $or: [{ username: value }, { email: value }, { ipAddress: value }],
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    let blacklist;
    if (user) {
      blacklist = await Blacklist.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          username: user?.username,
          email: user.email,
          ipAddress: user.ipAddress,
          timestamp: new Date(),
        },
        { new: true, upsert: true }
      );
    }

    res.json(blacklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBlacklist = async (req, res) => {
  try {
    const { blacklistId } = req.params;
    const blacklist = await Blacklist.findById(blacklistId);
    if (!blacklist) {
      return res.status(400).json({ error: "Blacklist not found" });
    }

    res.json(blacklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBlacklist = async (req, res) => {
  try {
    const { blacklistId } = req.body;

    const blacklist = await Blacklist.findByIdAndUpdate(blacklistId, req.body, {
      new: true,
    });

    if (!blacklist) {
      return res.status(400).json({ error: "Blacklist not found" });
    }

    res.json(blacklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBlacklist = async (req, res) => {
  try {
    const { blacklistId } = req.params;
    const blacklist = await Blacklist.findByIdAndDelete(blacklistId);

    if (!blacklist) {
      return res.status(400).json({ error: "Blacklist not found" });
    }

    res.json({ message: "Blacklist deleted successfully" });
  } catch (err) {
    console.error("Error deleting Blacklist:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllBlacklists = async (req, res) => {
  try {
    const { page = 1, limit = 20, value } = req.query;
    const query = {};

    if (value) {
      const regex = new RegExp(value, "i");
      query.$or = [{ value: regex }];
    }

    let countPromise = Blacklist.countDocuments(query);
    let blacklistsPromise = Blacklist.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ timestamp: -1 });

    const [totalBlacklists, blacklists] = await Promise.all([
      countPromise,
      blacklistsPromise,
    ]);
    const totalPages = Math.ceil(totalBlacklists / limit);

    res.json({
      blacklists,
      totalPages,
      totalBlacklists,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addBlacklists = async (req, res) => {
  try {
    const { blacklistIds } = req.body;

    if (!blacklistIds || blacklistIds.length === 0) {
      return res.status(400).json({ error: "Blacklist IDs are required" });
    }

    const bulkOperations = blacklistIds.map(
      ({ id, username, email, ipAddress }) => ({
        updateOne: {
          filter: { userId: id },
          update: {
            $set: {
              userId: id,
              email,
              username,
              ipAddress,
              timestamp: new Date(),
            },
          },
          upsert: true,
        },
      })
    );

    await Blacklist.bulkWrite(bulkOperations);

    res.json("Blacklisted successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBlacklists = async (req, res) => {
  try {
    const { blacklistIds } = req.body;
    if (!blacklistIds || blacklistIds.length === 0) {
      return res.status(400).json({ error: "Blacklist Ids are required" });
    }

    await Blacklist.deleteMany({ _id: { $in: blacklistIds } });

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import Contact from "../models/contact_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
} from "../redis/redis_methods.js";

export const manageContact = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    let contact = await Contact.findOneAndUpdate(
      {},
      {
        ...req.body,
        adminId: user._id,
      },
      { upsert: true, new: true }
    );

    if (!contact) {
      return res.status(400).json({ error: "Couldn't create Contact" });
    }

    const contactKey = `contact:${contact._id}`;

    await Promise.all([
      setToRedis(contactKey, contact, expire.contact),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const contactKey = `contact:${contactId}`;

    const redisContact = await getFromRedis(contactKey);
    const contact = redisContact || (await Contact.findOne());
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    await setToRedis(contactKey, contact, expire.contact);

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const contact = await Contact.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const contactKey = `contact:${contact._id}`;

    await Promise.all([
      setToRedis(contactKey, contact, expire.contact),
      setToRedis(key, user, expire.user),
    ]);

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const deleteOB = await Contact.findByIdAndDelete(contactId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Contact not found" });
    }
    const contactKey = `contact:${contactId}`;
    await deleteFromRedis(contactKey);
    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllContact = async (_, res) => {
  try {
    const precached = await getListFromRedis("contact");
    if (precached && precached.length > 0) {
      console.log("Precached Contact");
      return res.json(precached[0]);
    }

    const contact = await Contact.findOne();
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const contactKey = `contact:${contact._id}`;

    await setToRedis(contactKey, contact, expire.contact);

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllContact = async (_, res) => {
  try {
    await Promise.all([
      Contact.deleteMany(),
      deleteFromRedisByPattern("contact"),
    ]);

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

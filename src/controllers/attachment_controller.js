import Attachment from "../models/attachment_model.js";
import mongoose from "mongoose";

export const addAttachment = async (req, res) => {
  try {
    const { userId, attachment } = req.body;

    const newAttachment = await Attachment.create({
      userId,
      ...attachment,
    });

    if (!newAttachment) {
      return res.status(400).json({ error: "Error creating attachment" });
    }

    res.json(newAttachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    res.json(attachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAttachment = async (req, res) => {
  try {
    const { id } = req.body;

    const attachment = await Attachment.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    res.json(attachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const pinAttachment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { pinId, unpinId } = req.body;

    await Attachment.findByIdAndUpdate(pinId, { pinned: true }, { session });
    await Attachment.findByIdAndUpdate(unpinId, { pinned: false }, { session });

    await session.commitTransaction();
    res.json("Transaction Successful");
  } catch (err) {
    console.error("Transaction error:", err);

    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    await session.endSession();
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const deleteOB = await Attachment.findByIdAndDelete(attachmentId);
    if (!deleteOB) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    res.json({ message: "Attachment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllAttachments = async (req, res) => {
  try {
    const { userId } = req.body;
    const attachments = await Attachment.find({ userId });

    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllAttachments = async (req, res) => {
  try {
    const { userId } = req.body;
    await Attachment.deleteMany({ userId });

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

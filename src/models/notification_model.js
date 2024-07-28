import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["spark", "superSpark", "message", "match"],
    required: true,
  },
  timestamp: {
    default: Date.now,
    type: Date,
  },
  message: {
    required: true,
    type: String,
  },
  read: {
    default: false,
    type: Boolean,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

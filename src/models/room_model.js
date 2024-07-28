import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  users: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Like",
  },
  recentMessage: {
    sender: {
      default: "Glmpse",
      type: String,
    },
    unsend: {
      default: false,
      type: Boolean,
    },
    text: {
      default: "You matched!",
      type: String,
    },
  },
  unread: {
    userA: {
      type: Number,
      default: 0,
    },
    userB: {
      type: Number,
      default: 0,
    },
  },
  timestamp: {
    type: String,
    required: true,
  },
});

const Room = mongoose.model("Room", roomSchema);

export default Room;

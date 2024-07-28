import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  timestamp: {
    default: new Date(),
    type: Date,
  },
});

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

export default Blacklist;

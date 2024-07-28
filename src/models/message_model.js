import { attachmentSchema } from "./attachment_model.js";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomId: {
    required: true,
    type: String,
  },
  status: {
    type: String,
    enum: {
      values: ["delivered", "read", "deleted"],
      message: "{VALUE} is not supported",
    },
    default: "delivered",
  },
  text: {
    type: String,
    default: "",
  },
  timestamp: {
    type: String,
    required: true,
  },
  attachment: attachmentSchema,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;

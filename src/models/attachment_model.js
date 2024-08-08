import mongoose from "mongoose";

const attachment = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: "",
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["video", "audio", "image"],
    required: true,
  },
};

const attachmentSchema = new mongoose.Schema(attachment);

const Attachment = mongoose.model("Attachment", attachmentSchema);

export { attachment };
export default Attachment;

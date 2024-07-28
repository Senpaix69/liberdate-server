import mongoose from "mongoose";

const interestSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  iconUrl: {
    type: String,
    required: true,
  },
  activeIconUrl: {
    type: String,
    required: true,
  },
});

const Interest = mongoose.model("Interest", interestSchema);

export default Interest;

import mongoose from "mongoose";

const identitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  personality: [String],
  employment: [String],
  profession: [String],
  education: [String],
  ethnicity: [String],
  obessions: [String],
  politics: [String],
  religion: [String],
  language: [String],
  phobias: [String],
});

const Identity = mongoose.model("Identity", identitySchema);

export default Identity;

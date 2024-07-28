import mongoose from "mongoose";

const onBoardingSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  imageUrl: {
    required: true,
    type: String,
    trim: true,
  },
  coloredText: {
    unique: true,
    type: String,
    trim: true,
    required: true,
  },
  text: {
    unique: true,
    type: String,
    trim: true,
    required: true,
  },
  isColorFirst: {
    type: Boolean,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
});

const OnBoarding = mongoose.model("OnBoarding", onBoardingSchema);

export default OnBoarding;

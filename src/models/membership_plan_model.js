import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  period: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 0.0,
  },
  iconUrl: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  videoMeet: Boolean,
  sparks: {
    amount: Number,
    time: Number,
  },
  incognito: {
    type: Boolean,
    default: true,
  },
  hideAds: {
    type: Boolean,
    default: true,
  },
  rewind: {
    type: Boolean,
    default: true,
  },
  hideAge: {
    type: Boolean,
    default: true,
  },
  telLocation: {
    type: Boolean,
    default: true,
  },
  textMessages: {
    type: Boolean,
    default: true,
  },
  superSpark: {
    amount: Number,
    time: Number,
  },
  freeBoost: {
    duration: Number,
    amount: Number,
    time: Number,
  },
  seeSparks: {
    type: Boolean,
    default: true,
  },
  features: {
    type: [String],
    required: true,
  },
  uploadImages: Boolean,
});

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);

export default MembershipPlan;

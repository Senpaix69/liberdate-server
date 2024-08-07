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
  // videoMeet: Boolean,
  sparks: {
    amount: Number,
    time: Number,
  },
  // incognito: Boolean,
  hideAds: Boolean,
  rewind: Boolean,
  hideAge: Boolean,
  telLocation: Boolean,
  // textMessages: Boolean,
  superSpark: {
    amount: Number,
    time: Number,
  },
  // freeBoost: {
  //   duration: Number,
  //   amount: Number,
  //   time: Number,
  // },
  // seeSparks: Boolean,
  features: {
    type: [String],
    required: true,
  },
  // uploadImages: Boolean,
});

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);

export default MembershipPlan;

import mongoose from "mongoose";

const planFeatureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  sparks: {
    amount: {
      type: Number,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
  },
  superSpark: {
    amount: {
      type: Number,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
  },
  freeBoost: {
    duration: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
  },
  hideAge: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: {
      values: ["incognito", "show", "hide"],
      message: "{VALUE} is not supported",
    },
    default: "show",
  },
});

const PlanFeature = mongoose.model("PlanFeature", planFeatureSchema);

export default PlanFeature;

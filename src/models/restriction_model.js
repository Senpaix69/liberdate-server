import mongoose from "mongoose";

const restrictionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  videoMinUploads: {
    type: Number,
    required: true,
  },
  videoMaxUploads: {
    type: Number,
    required: true,
  },
  videoMaxDurationInSec: {
    type: Number,
    required: true,
  },
  maxInterestsSelection: {
    type: Number,
    required: true,
  },
  distance: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  age: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  matchExpireTime: {
    type: Number,
    default: 300,
  },
  auth: {
    google: {
      type: Boolean,
      default: false,
    },
    facebook: {
      type: Boolean,
      default: false,
    },
    apple: {
      type: Boolean,
      default: false,
    },
  },
  reports: ["Spam", "Harassment", "Inappropriate Content", "Fake Profile"],
  genders: [{ title: String, url: String }],
});

const Restriction = mongoose.model("Restriction", restrictionSchema);

export default Restriction;

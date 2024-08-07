import mongoose from "mongoose";

const restrictionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  imagesMinUploads: {
    type: Number,
    required: true,
  },
  imagesMaxUploads: {
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
});

const Restriction = mongoose.model("Restriction", restrictionSchema);

export default Restriction;

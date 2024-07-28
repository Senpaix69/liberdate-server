import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mapboxId: {
    type: String,
    required: true,
  },
  fullAddress: {
    type: String,
    required: true,
  },
  placeFormatted: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: String,
  region: String,
  district: String,
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
});

const Location = mongoose.model("Location", locationSchema);

export default Location;

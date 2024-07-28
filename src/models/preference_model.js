import mongoose from "mongoose";

const basicSchema = new mongoose.Schema({
  gender: String,
  lookingFor: String,
  age: Number,
  orientation: String,
  horoscope: String,
});

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  basic: basicSchema,
});

const Preference = mongoose.model("Preference", preferenceSchema);

export default Preference;

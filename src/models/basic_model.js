import mongoose from "mongoose";

const basicSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  genders: [String],
  lookingFor: [String],
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
  orientations: [String],
  horoscopes: [String],
});

const Basic = mongoose.model("Basic", basicSchema);

export default Basic;

import mongoose from "mongoose";

const lifeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  foodPreferences: [String],
  otherSubstanes: [String],
  socialNetwork: [String],
  sleepHabits: [String],
  vaccinated: [String],
  sportsman: [String],
  drinking: [String],
  smoking: [String],
  drive: [String],
});

const Life = mongoose.model("Life", lifeSchema);

export default Life;

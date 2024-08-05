import mongoose from "mongoose";

const physicalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  maritalStatus: [String],
  familyPlans: [String],
  kids: [String],
  pets: [String],
});

const Physical = mongoose.model("Physical", physicalSchema);

export default Physical;

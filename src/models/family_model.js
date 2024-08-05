import mongoose from "mongoose";

const familySchema = new mongoose.Schema({
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

const Family = mongoose.model("Family", familySchema);

export default Family;

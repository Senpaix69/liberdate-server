import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  attachment: [String],
  reason: {
    required: true,
    type: String,
    trim: true,
  },
  explaination: {
    required: true,
    type: String,
    trim: true,
  },
  timestamp: {
    default: new Date(),
    type: Date,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  reportee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;

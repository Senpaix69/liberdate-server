import mongoose from "mongoose";

const coinHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamps: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: String,
    required: true,
  },
});

const CoinHistory = mongoose.model("CoinHistory", coinHistorySchema);

export default CoinHistory;

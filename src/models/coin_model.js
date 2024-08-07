import mongoose from "mongoose";

const coinSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  iconUrl: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const Coin = mongoose.model("Coin", coinSchema);

export default Coin;

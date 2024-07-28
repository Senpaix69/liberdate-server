import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  userA: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    likeType: {
      type: String,
      enum: {
        values: ["spark", "superSpark"],
        message: "{VALUE} is not supported",
      },
      default: null,
    },
  },
  userB: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    likeType: {
      type: String,
      enum: {
        values: ["spark", "superSpark"],
        message: "{VALUE} is not supported",
      },
      default: null,
    },
  },
});

const Like = mongoose.model("Like", likeSchema);

export default Like;

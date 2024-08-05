import mongoose from "mongoose";

const emailValidator = {
  validator: (value) => {
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+$/;
    return re.test(value);
  },
  message: "Please enter a valid email",
};

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: emailValidator,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      code: String,
      phoneCode: String,
      country: String,
      number: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    ipAddress: String,
    status: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "{VALUE} is not supported",
      },
      default: "user",
    },
    isBan: {
      type: Boolean,
      default: false,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      // required: true,
    },
    blockUsers: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videocall: [String],
  inperson: [String],
  audios: [String],
  chat: [String],
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;

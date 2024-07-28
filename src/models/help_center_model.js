import mongoose from "mongoose";

const helpCenterSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  privacyPolicy: {
    required: true,
    type: String,
  },
  communityGuidelines: {
    required: true,
    type: String,
  },
  termAndServices: {
    required: true,
    type: String,
  },
  contactUs: [
    {
      icon: String,
      title: String,
      text: String,
    },
  ],
  faq: [
    {
      catName: String,
      items: [
        {
          title: String,
          text: String,
        },
      ],
    },
  ],
});

const HelpCenter = mongoose.model("HelpCenter", helpCenterSchema);

export default HelpCenter;

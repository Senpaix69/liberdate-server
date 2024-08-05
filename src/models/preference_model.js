import mongoose from "mongoose";
import { attachmentSchema } from "./attachment_model.js";

const basicSchema = new mongoose.Schema({
  orientation: String,
  lookingFor: String,
  horoscope: String,
  location: String,
  gender: String,
  age: Number,
});

const aboutSchema = new mongoose.Schema({
  attachmentSchema,
  text: String,
});

const identitySchema = new mongoose.Schema({
  personality: String,
  employment: String,
  profession: String,
  education: String,
  ethnicity: String,
  obessions: String,
  politics: String,
  religion: String,
  language: String,
  phobias: String,
});

const familySchema = new mongoose.Schema({
  maritalStatus: String,
  familyPlans: String,
  kids: String,
  pets: String,
});

const lifeSchema = new mongoose.Schema({
  foodPreferences: String,
  otherSubstanes: String,
  socialNetwork: String,
  sleepHabits: String,
  interests: [String],
  vaccinated: String,
  sportsman: String,
  drinking: String,
  smoking: String,
  drive: String,
});

const physicalSchema = new mongoose.Schema({
  physicalComplexion: String,
  cosmeticTouches: String,
  piercings: String,
  tattoos: String,
  height: String,
  hairs: String,
  eyes: String,
});

const contactSchema = new mongoose.Schema({
  videocall: String,
  inperson: String,
  audios: String,
  chat: String,
});

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  identity: identitySchema,
  physical: physicalSchema,
  contact: contactSchema,
  family: familySchema,
  basic: basicSchema,
  about: aboutSchema,
  life: lifeSchema,
});

const Preference = mongoose.model("Preference", preferenceSchema);

export default Preference;

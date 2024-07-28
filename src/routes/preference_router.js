import { Router } from "express";
import {
  getPreference,
  managePreference,
  deletePreference,
  updatePreference,
  getAllPreferences,
  deleteAllPreferences,
} from "../controllers/preference_controller.js";
const preferenceRouter = Router();

preferenceRouter
  .post("/manage", managePreference)
  .post("/update", updatePreference)
  .get("/get_all", getAllPreferences)
  .get("/get/:userId", getPreference)
  .get("/delete_all", deleteAllPreferences)
  .get("/delete/:userId", deletePreference);

export default preferenceRouter;

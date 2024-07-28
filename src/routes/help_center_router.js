import { Router } from "express";
import {
  addHelpCenter,
  deleteAllHelpCenter,
  deleteHelpCenter,
  getAllHelpCenter,
  getHelpCenter,
  updateHelpCenter,
} from "../controllers/help_center_controller.js";
const helpCenterRouter = Router();

helpCenterRouter
  .post("/add", addHelpCenter)
  .post("/update", updateHelpCenter)
  .get("/get_all", getAllHelpCenter)
  .get("/delete_all", deleteAllHelpCenter)
  .get("/get/:helpcenterId", getHelpCenter)
  .get("/delete/:helpcenterId", deleteHelpCenter);

export default helpCenterRouter;

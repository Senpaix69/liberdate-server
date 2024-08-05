import { Router } from "express";
import {
  getLife,
  manageLife,
  deleteLife,
  getAllLife,
  updateLife,
  deleteAllLife,
} from "../controllers/life_controller.js";
const lifeRouter = Router();

lifeRouter
  .post("/manage", manageLife)
  .post("/update", updateLife)
  .get("/get_all", getAllLife)
  .get("/get/:lifeId", getLife)
  .get("/delete_all", deleteAllLife)
  .get("/delete/:lifeId", deleteLife);

export default lifeRouter;

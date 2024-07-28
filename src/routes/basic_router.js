import { Router } from "express";
import {
  getBasic,
  manageBasic,
  deleteBasic,
  getAllBasic,
  updateBasic,
  deleteAllBasic,
} from "../controllers/basic_controller.js";
const basicRouter = Router();

basicRouter
  .post("/manage", manageBasic)
  .post("/update", updateBasic)
  .get("/get_all", getAllBasic)
  .get("/get/:BasicId", getBasic)
  .get("/delete_all", deleteAllBasic)
  .get("/delete/:BasicId", deleteBasic);

export default basicRouter;

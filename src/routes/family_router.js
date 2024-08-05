import { Router } from "express";
import {
  getFamily,
  manageFamily,
  deleteFamily,
  getAllFamily,
  updateFamily,
  deleteAllFamily,
} from "../controllers/family_controller.js";
const familyRouter = Router();

familyRouter
  .post("/manage", manageFamily)
  .post("/update", updateFamily)
  .get("/get_all", getAllFamily)
  .get("/get/:familyId", getFamily)
  .get("/delete_all", deleteAllFamily)
  .get("/delete/:familyId", deleteFamily);

export default familyRouter;

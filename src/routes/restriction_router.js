import { Router } from "express";
import {
  addRestriction,
  deleteRestriction,
  getAllRestrictions,
  getRestriction,
  updateRestriction,
  deleteAllRestrictions,
} from "../controllers/restriction_controller.js";
const restrictionRouter = Router();

restrictionRouter
  .post("/add", addRestriction)
  .post("/update", updateRestriction)
  .get("/get_all", getAllRestrictions)
  .get("/delete_all", deleteAllRestrictions)
  .get("/get/:restrictionId", getRestriction)
  .get("/delete/:restrictionId", deleteRestriction);

export default restrictionRouter;

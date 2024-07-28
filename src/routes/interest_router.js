import { Router } from "express";
import {
  addInterest,
  deleteAllInterests,
  deleteInterest,
  getAllInterests,
  getInterest,
  updateInterest,
} from "../controllers/interest_controller.js";
const interestRouter = Router();

interestRouter
  .post("/add", addInterest)
  .post("/update", updateInterest)
  .get("/get_all", getAllInterests)
  .get("/get/:interestId", getInterest)
  .get("/delete_all/", deleteAllInterests)
  .get("/delete/:interestId", deleteInterest);

export default interestRouter;

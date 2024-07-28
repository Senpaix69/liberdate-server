import { Router } from "express";
import {
  addPage,
  deletePage,
  getAllPages,
  getPage,
  updatePage,
  deleteAllPages,
} from "../controllers/on_boarding_controller.js";
const onBoardingRouter = Router();

onBoardingRouter
  .post("/add", addPage)
  .post("/update", updatePage)
  .get("/get/:pageId", getPage)
  .get("/get_all", getAllPages)
  .get("/delete_all", deleteAllPages)
  .get("/delete/:pageId", deletePage);

export default onBoardingRouter;

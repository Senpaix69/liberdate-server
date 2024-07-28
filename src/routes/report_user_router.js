import { Router } from "express";
import {
  addReport,
  deleteReport,
  getAllReports,
  getReport,
  updateReport,
  deleteAllReports,
  manageReports,
} from "../controllers/report_user_controller.js";
const reportRouter = Router();

reportRouter
  .post("/add", addReport)
  .post("/manage", manageReports)
  .post("/update", updateReport)
  .get("/get/:reportId", getReport)
  .post("/delete_all", deleteAllReports)
  .get("/delete/:reportId", deleteReport)
  .get("/get_all/reports", getAllReports);

export default reportRouter;

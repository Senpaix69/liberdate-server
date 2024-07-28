import { Router } from "express";
import {
  addMembershipTime,
  deleteAllMembershipsTime,
  deleteMembershipTime,
  getAllMembershipsTime,
  getMembershipTime,
  updateMembershipTime,
} from "../controllers/membership_time_controller.js";
const membershipTimeRouter = Router();

membershipTimeRouter
  .post("/add", addMembershipTime)
  .post("/update", updateMembershipTime)
  .get("/get_all", getAllMembershipsTime)
  .get("/delete_all", deleteAllMembershipsTime)
  .get("/get/:MembershipTimeId", getMembershipTime)
  .get("/delete/:MembershipTimeId", deleteMembershipTime);

export default membershipTimeRouter;

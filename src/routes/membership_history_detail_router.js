import { Router } from "express";
import {
  getPlanFeature,
  cancelMembership,
  updatePlanFeature,
  addMembershipHistory,
  getMembershipHistory,
  updateMembershipHistory,
  getMembershipAllActivity,
} from "../controllers/membership_history_detail_controller.js";
const membershipHistory = Router();

membershipHistory
  .post("/get_features", getPlanFeature)
  .post("/update", updateMembershipHistory)
  .post("/cancel_membership", cancelMembership)
  .post("/add_membership", addMembershipHistory)
  .post("/update_plan_feature", updatePlanFeature)
  .get("/get_all_activity/:userId", getMembershipAllActivity)
  .get("/get_membership_history/:membershipActivityId", getMembershipHistory);

export default membershipHistory;

import { Router } from "express";
import {
  addMembershipPlan,
  deleteAllMembershipPlans,
  deleteMembershipPlan,
  getAllMembershipPlans,
  getMembershipPlan,
  updateMembershipPlan,
} from "../controllers/membership_plan_controller.js";
const MembershipPlanRouter = Router();

MembershipPlanRouter.post("/add", addMembershipPlan)
  .post("/update", updateMembershipPlan)
  .get("/get_all", getAllMembershipPlans)
  .get("/get/:membershipPlanId", getMembershipPlan)
  .get("/delete_all/", deleteAllMembershipPlans)
  .get("/delete/:membershipPlanId", deleteMembershipPlan);

export default MembershipPlanRouter;

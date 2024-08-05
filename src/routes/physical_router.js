import { Router } from "express";
import {
  getPhysical,
  managePhysical,
  deletePhysical,
  getAllPhysical,
  updatePhysical,
  deleteAllPhysical,
} from "../controllers/physical_controller.js";
const physicalRouter = Router();

physicalRouter
  .post("/manage", managePhysical)
  .post("/update", updatePhysical)
  .get("/get_all", getAllPhysical)
  .get("/get/:physicalId", getPhysical)
  .get("/delete_all", deleteAllPhysical)
  .get("/delete/:physicalId", deletePhysical);

export default physicalRouter;

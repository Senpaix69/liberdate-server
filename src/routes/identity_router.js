import { Router } from "express";
import {
  getIdentity,
  manageIdentity,
  deleteIdentity,
  getAllIdentity,
  updateIdentity,
  deleteAllIdentity,
} from "../controllers/identity_controller.js";
const identityRouter = Router();

identityRouter
  .post("/manage", manageIdentity)
  .post("/update", updateIdentity)
  .get("/get_all", getAllIdentity)
  .get("/get/:identityId", getIdentity)
  .get("/delete_all", deleteAllIdentity)
  .get("/delete/:identityId", deleteIdentity);

export default identityRouter;

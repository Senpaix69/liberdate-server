import { Router } from "express";
import {
  addBlacklist,
  getBlacklist,
  addBlacklists,
  deleteBlacklist,
  updateBlacklist,
  deleteBlacklists,
  getAllBlacklists,
} from "../controllers/blacklist_controller.js";
const blacklistRouter = Router();

blacklistRouter
  .post("/add", addBlacklist)
  .get("/delete/", deleteBlacklist)
  .post("/update", updateBlacklist)
  .get("/get/:blacklistId", getBlacklist)
  .post("/add_blacklists", addBlacklists)
  .post("/delete_blacklists", deleteBlacklists)
  .get("/get_all/blacklists", getAllBlacklists);

export default blacklistRouter;

import { Router } from "express";
import {
  getContact,
  manageContact,
  deleteContact,
  getAllContact,
  updateContact,
  deleteAllContact,
} from "../controllers/contact_controller.js";
const contactRouter = Router();

contactRouter
  .post("/manage", manageContact)
  .post("/update", updateContact)
  .get("/get_all", getAllContact)
  .get("/get/:contactId", getContact)
  .get("/delete_all", deleteAllContact)
  .get("/delete/:contactId", deleteContact);

export default contactRouter;

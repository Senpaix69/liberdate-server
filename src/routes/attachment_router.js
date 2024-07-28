import { Router } from "express";
import {
  addAttachment,
  getAttachment,
  pinAttachment,
  updateAttachment,
  deleteAttachment,
  getAllAttachments,
  deleteAllAttachments,
} from "../controllers/attachment_controller.js";
const attachmentRouter = Router();

attachmentRouter
  .post("/add", addAttachment)
  .post("/pin", pinAttachment)
  .post("/update", updateAttachment)
  .post("/get_all", getAllAttachments)
  .get("/get/:attachmentId", getAttachment)
  .post("/delete_all", deleteAllAttachments)
  .get("/delete/:attachmentId", deleteAttachment);

export default attachmentRouter;

import { Router } from "express";
import { uploadLocally } from "../clients/multer.js";

import {
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteAllFiles,
} from "../controllers/file_controller.js";
const fileRouter = Router();

fileRouter
  .post("/delete_file", deleteFile)
  .post("/delete_all_files", deleteAllFiles)
  .post("/upload_file", uploadLocally.single("file"), uploadFile)
  .post("/upload_files", uploadLocally.array("files"), uploadFiles);

export default fileRouter;

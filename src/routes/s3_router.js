import { Router } from "express";
import { upload } from "../clients/multer.js";

import {
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteAllFiles,
} from "../controllers/s3_file_controller.js";
const s3Router = Router();

s3Router
  .post("/delete_file", deleteFile)
  .post("/delete_all_files", deleteAllFiles)
  .post("/upload_file", upload.single("file"), uploadFile)
  .post("/upload_files", upload.array("files"), uploadFiles);

export default s3Router;

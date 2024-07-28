import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import events from "events";
import multer from "multer";
import path from "path";
import fs from "fs";

events.EventEmitter.prototype._maxListeners = 40;
const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    secretAccessKey: process.env.S3_SECRET_KEY,
    accessKeyId: process.env.S3_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    metadata: (_, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },
    key: (req, file, cb) => {
      const userId = req.headers.userid;
      if (!userId) {
        cb({ error: "userId Required" });
        return;
      }
      const fileName = `${userId}/${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

const storage = multer.diskStorage({
  destination: (req, _, cb) => {
    const directory = "public/uploads";
    const userId = req.headers.userid;
    if (!userId) {
      return cb("userId is required");
    }
    const folderPath = path.join(directory, userId);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadLocally = multer({ storage });

export { upload, s3Client, uploadLocally };

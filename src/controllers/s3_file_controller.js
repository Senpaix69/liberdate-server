import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../clients/multer.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Failed to upload file" });
    }
    const { originalname } = req.file;
    const userId = req.headers.userid;
    const key = `${userId}/${originalname}`;

    const publicUrl = `https://s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`;
    console.log("File uploaded successfully to S3:", publicUrl);

    res.json(publicUrl);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const userId = req.headers.userid;

    const urls = files.map(
      (file) =>
        `https://s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${userId}/${file.originalname}`
    );

    console.log("Files uploaded successfully to S3:", urls);
    return res.json(urls);
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({ error: "Failed to upload files" });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { url } = req.body;

    const urlPattern = new RegExp(
      /^https:\/\/s3\..*\.amazonaws.com\/([^\/]+\/)*[^\/]+$/
    );

    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const parsedUrl = new URL(url);
    const key = parsedUrl.pathname.substring(1);

    console.log(key);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    const deleteObjectCommand = new DeleteObjectCommand(params);
    await s3Client.send(deleteObjectCommand).then(
      (fullfilled) => {
        console.log("Fullfilled: ", fullfilled);
      },
      (rejected) => {
        console.log("Rejected: ", rejected);
      }
    );

    console.log("File deleted successfully from S3:", url);
    res.json("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

export const deleteAllFiles = async (req, res) => {
  try {
    const { userId } = req.body;
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: userId,
    };

    const listObjectsCommand = new ListObjectsV2Command(params);
    const data = await s3Client.send(listObjectsCommand);

    if (data.Contents.length === 0) {
      return res.json("No files found for the user");
    }

    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Delete: {
        Objects: data.Contents.map((obj) => ({ Key: obj.Key })),
      },
    };

    const deleteObjectsCommand = new DeleteObjectsCommand(deleteParams);
    await s3Client.send(deleteObjectsCommand).then(
      (fullfilled) => console.log("Fullfilled: ", fullfilled),
      (rejected) => console.log("Rejected: ", rejected)
    );

    console.log("All files deleted successfully from S3:", userId);
    res.json("All files deleted successfully");
  } catch (error) {
    console.error("Error deleting files:", error);
    res.status(500).json({ error: "Failed to delete files" });
  }
};

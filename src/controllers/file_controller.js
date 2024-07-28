import fs from "fs";
import path from "path";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const filePath = path.relative("public", file.path);
    res.json(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload files" });
  }
};

export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    if (!files) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const downloadableUrls = files.map((e) => path.relative("public", e.path));
    res.json(downloadableUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload files" });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { url } = req.body;

    const filePath = path.join("public", url);

    if (!fs.existsSync(filePath)) {
      console.log("File not found");
      return res.status(400).json({ error: "File not found" });
    }

    fs.unlinkSync(filePath);
    console.log("File deleted successfully");
    res.json("File deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

export const deleteAllFiles = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const directoryPath = path.join("public", "uploads", userId);

    if (!fs.existsSync(directoryPath)) {
      return res.status(400).json({ error: "User directory not found" });
    }

    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
    });

    return res.json("All files deleted successfully");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete files" });
  }
};

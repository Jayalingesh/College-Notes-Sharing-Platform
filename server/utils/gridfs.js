const mongoose = require("mongoose");

// Files are stored inside MongoDB itself (GridFS), so they survive
// server restarts and redeploys on hosts with a temporary disk.
const BUCKET_NAME = "notefiles";

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database not connected");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
};

// Saves a multer memory file ({ buffer, originalname }) and resolves with its ObjectId
const saveFile = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = getBucket().openUploadStream(file.originalname);
    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(uploadStream.id));
    uploadStream.end(file.buffer);
  });

// Returns the GridFS file record (with .length) or null if it does not exist
const findFile = async (fileId) => {
  const files = await getBucket().find({ _id: fileId }).toArray();
  return files[0] || null;
};

const openDownloadStream = (fileId) => getBucket().openDownloadStream(fileId);

// Never throws: a missing file should not block deleting the note
const deleteFile = async (fileId) => {
  try {
    await getBucket().delete(fileId);
  } catch (err) {
    console.warn("Could not delete stored file:", err.message);
  }
};

module.exports = { saveFile, findFile, openDownloadStream, deleteFile };

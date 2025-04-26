import multer from "multer";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads"); // Set the destination folder for uploads
  },
  filename(req, file, cb) {
    const uniqueId = uuid(); // Generate a unique ID for the file
    const extension = file.originalname.split(".").pop(); // Extract the file extension
    cb(null, `${uniqueId}.${extension}`); // Construct the filename
  },
});

export const upload = multer({ storage });

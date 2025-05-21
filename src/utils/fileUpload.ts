import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (imagePath: string) => {
  try {
    if (!imagePath) return null;

    const response = await cloudinary.uploader.upload(imagePath, {
      resource_type: "image",
    });

    // console.log("File uploaded on cloudinary", response.secure_url);
    fs.unlinkSync(imagePath);
    return response;
  } catch (error) {
    fs.unlinkSync(imagePath); //remove locally saved temporary file as upload operation failed
    console.error(error);
    return null;
  }
};

const cloudinaryDelete = async (imageUrls: string[]) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  await Promise.all(
    imageUrls.map(async (url) => {
      const splitUrl = url.split("/");
      const photoId = splitUrl[splitUrl.length - 1].split(".")[0];

      try {
        await cloudinary.uploader.destroy(photoId);
      } catch (error) {
        console.error(`Failed to delete this Cloudinary image:${url}`, error);
      }
    })
  );
};

export { cloudinaryDelete, cloudinaryUpload };

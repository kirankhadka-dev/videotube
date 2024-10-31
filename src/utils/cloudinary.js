import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// Configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    // Upload  the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully

    console.log("file has been  uploaded successfully", response.url);

    // after uploading files, remove files from the server
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // remove file from server :
    fs.unlinkSync(localFilePath); // remove the  locally saved temp file as the upload failed
    return null;
  }
};

export { uploadOnCloudinary };

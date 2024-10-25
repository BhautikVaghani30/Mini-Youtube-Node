import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No file path provided.");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    console.log("Successfully uploaded to Cloudinary! URL: " + response.secure_url);
    fs.unlinkSync(localFilePath);
    return response.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    fs.unlinkSync(localFilePath); 
    return null;
  }
}

const removeOnCloudinary = async (cloudinaryUrl) => {
  try {
    console.log("URL: " + cloudinaryUrl);

    const publicIdWithExtension = cloudinaryUrl.split("/").pop();
    const publicId = publicIdWithExtension.split(".")[0];
    console.log("Public ID: " + publicId);

    cloudinary.uploader.destroy(publicId, function (error, result) {
      if (error) {
        console.log('Error deleting image:', error);
      } else {
        console.log('Image deleted successfully:', result);
      }
    });
  } catch (error) {
    console.log('Error in the try-catch block:', error);
  }
};


const uploadVideoToCloudinary = async (localFilePath) => {
  const response = await cloudinary.uploader.upload(localFilePath, {
    resource_type: 'video',
    folder: 'videos',
  });

  fs.unlinkSync(localFilePath);

  return {
    url: response.secure_url,
    duration: response.duration,
  };
};

const uploadThumbnailToCloudinary = async (localFilePath) => {
  const response = await cloudinary.uploader.upload(localFilePath, {
    folder: 'thumbnails',
  });

  fs.unlinkSync(localFilePath);

  return response.secure_url;
};


const removeVideoOnCloudinary = async (cloudinaryUrl) => {
  try {
    console.log("URL: " + cloudinaryUrl);

    const splitUrl = cloudinaryUrl.split("/");
    const folderAndPublicId = splitUrl.slice(-2).join("/").split(".")[0];
    console.log("Public ID: " + folderAndPublicId);

    const result = await cloudinary.uploader.destroy(folderAndPublicId, { resource_type: 'video' });
    console.log('Video deleted successfully:', result);

  } catch (error) {
    console.log('Error deleting video:', error);
  }
};



const removeThumbnileOnCloudinarys = async (cloudinaryUrl) => {
  try {
    console.log("URL: " + cloudinaryUrl);

    const splitUrl = cloudinaryUrl.split("/");
    const folderAndPublicId = splitUrl.slice(-2).join("/").split(".")[0];
    console.log("Public ID: " + folderAndPublicId);

    const result = await cloudinary.uploader.destroy(folderAndPublicId);
    console.log('Image deleted successfully:', result);

  } catch (error) {
    console.log('Error deleting image:', error);
  }
};

export {
  uploadOnCloudinary,
  removeOnCloudinary,
  uploadVideoToCloudinary,
  uploadThumbnailToCloudinary,
  removeThumbnileOnCloudinarys,
  removeVideoOnCloudinary
}
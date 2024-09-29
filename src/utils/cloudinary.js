import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
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
        return response.secure_url; // Use `secure_url` for HTTPS URL
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation failed
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

export { uploadOnCloudinary, removeOnCloudinary }
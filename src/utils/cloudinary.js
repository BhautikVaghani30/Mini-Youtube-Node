import { v2 as cloudinary } from "cloudinary";
import fs from "fs0";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("successfully uploded on cloudinary !!! url : " + response.url);
        return response.url;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the localy saved temporary file as the upload operation got faild 
        return null;
    }
}

export { uploadOnCloudinary }
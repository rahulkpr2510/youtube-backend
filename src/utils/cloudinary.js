import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deleteFromCloudinary = async (cloudinaryFilepath) => {
  try {
    if (!cloudinaryFilepath) return null;

    const fileName = cloudinaryFilepath.split("/").pop().split(".")[0];

    const resourceType = cloudinaryFilepath.includes("video") ? "video" : "image";

    const response = await cloudinary.uploader.destroy(fileName, { resource_type: resourceType });

    return response;
  } catch (error) {
    console.log("Error while deleting file from Cloudinary:", error);
    return null;
  }
};


export {uploadOnCloudinary, deleteFromCloudinary}
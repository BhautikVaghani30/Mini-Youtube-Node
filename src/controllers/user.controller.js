// Register User Function
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, userName, password } = req.body;

    console.log("Received data:", { fullName, email, userName, password });

    if (![fullName, email, userName, password].every(field => field?.trim())) {
        throw new ApiError(400, "All fields (fullName, email, userName, password) are required.");
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists.");
    }

    const avatarImageLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar image file is required.");
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
    const avatarUpload = await uploadOnCloudinary(avatarImageLocalPath);

    const user = await User.create({
        fullName, email, userName: userName, password, avatar: avatarUpload, coverImage: coverImageUpload || ""
    });

    console.log("User created:", user._id);

    const createdUser = await User.findById(user._id).select("-password -refereshToken");

    if (!createdUser) {
        throw new ApiError(500, "Error occurred while registering the user.");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully.")
    );
});

export { registerUser };
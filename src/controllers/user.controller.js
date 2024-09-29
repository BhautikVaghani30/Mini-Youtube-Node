// Register User Function
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, removeOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { app } from "../app.js";

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

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    // Validate input: username/email and password
    if (!userName && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    if (typeof password !== 'string' || password.trim() === '') {
        throw new ApiError(400, "Invalid or empty password");
    }

    // Find user by username or email
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Validate password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password");
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Select user data excluding sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set cookies for access and refresh tokens
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    // Return response with user data and tokens
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
        );
});

// Token generation function
const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    try {
        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token in the database
        user.refereshToken = refreshToken;
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
    }
};

const logoutUser = asyncHandler(async (req, res) => {
    // Remove the refreshToken from the user's record
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: "" } }, // Properly unset the refreshToken field
        { new: true }
    );

    // Error handling if user update fails
    if (!updatedUser) {
        throw new ApiError(500, "Failed to log out the user");
    }

    // Set cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    // Clear cookies and return a successful logout response
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefereshToken = req.cookies.refreshToken || req.body;
    if (!incomingRefereshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = await jwt.verify(incomingRefereshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log(decodedToken);

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        console.log("dbrefereshToken: ", user);

        console.log("incoming refereshToken: ", incomingRefereshToken);



        if (incomingRefereshToken !== user?.refereshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
        throw new ApiError(400, " old Password requierd")
    } else if (!newPassword) {
        throw new ApiError(400, "new Password is requied")
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    return res.status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, userName, email } = req.body;
    const userId = req.user._id;

    if (!fullName || !userName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }],
        _id: { $ne: userId }
    });

    if (existingUser) {
        throw new ApiError(400, "Username or email already taken by another user");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.fullName = fullName;
    user.userName = userName;
    user.email = email;

    await user.save();

    res.status(200).json({
        message: "User details updated successfully",
        user,
    });
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarImageLocalPath = req.file?.path;

    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avarat fille is missing !!");
    }

    const avatarUpload = await uploadOnCloudinary(avatarImageLocalPath);

    if (!avatarUpload) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const oldAvatarUrl = req.user.avatar;
    await removeOnCloudinary(oldAvatarUrl);

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatarUpload
        }
    },
    { 
        new: true 
    }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )

});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage fille is missing !!");
    }

    const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImageUpload) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }
    const oldCoverImageUrl = req.user.avatar;
    await removeOnCloudinary(oldCoverImageUrl);

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImageUpload
        }
    },
    { 
        new: true
    }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};
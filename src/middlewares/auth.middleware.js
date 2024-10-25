import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // Retrieve token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
    // Check if token exists
    if (!token) {
        throw new ApiError(401, "Unauthorized request: No access token provided");
    }

    try {
        // Verify token and decode user information
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch user from the database, excluding sensitive fields
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
        
        // Check if user exists
        if (!user) {
            throw new ApiError(401, "Invalid access token: User not found");
        }

        // Attach user to the request object
        req.user = user;
        next();
    } catch (error) {
        // Handle invalid token errors
        throw new ApiError(401, "Unauthorized: Invalid access token");
    }
});

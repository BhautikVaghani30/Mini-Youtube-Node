import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "Please provide a valid video ID");
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Like removed"));
    }

    const newLike = new Like({
        video: videoId,
        likedBy: userId
    });
    
    await newLike.save();

    res.status(200).json(new ApiResponse(200, { liked: true }, "Like added"));
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id;
    
    if (!commentId) {
        throw new ApiError(400, "Please provide a valid comment ID");
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });
    console.log("fddfdfdfdfdf");

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Like removed"));
    }

    const newLike = new Like({
        comment: commentId,
        likedBy: userId
    });
    
    await newLike.save();

    res.status(200).json(new ApiResponse(200, { liked: true }, "Like added"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id;

    if (!tweetId) {
        throw new ApiError(400, "Please provide a valid tweet ID");
    }

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Like removed"));
    }

    const newLike = new Like({
        tweet: tweetId,
        likedBy: userId
    });
    
    await newLike.save();

    res.status(200).json(new ApiResponse(200, { liked: true }, "Like added"));

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } }) 
        .populate('video') 
        .exec();

    if (!likedVideos.length) {
        return res.status(404).json(new ApiError(404, "No liked videos found"));
    }

    const videos = likedVideos.map(like => like.video);

    res.status(200).json(new ApiResponse(200, {
        videos,
        totalLikedVideos: videos.length
    }, "Liked videos fetched successfully"));
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Ensure channelId is provided
    if (!channelId) {
        throw new ApiError(400, "Please provide a valid channelId");
    }

    // Convert the channelId to ObjectId using new
    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    // Get total number of subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelObjectId });

    // Get total videos and total views
    const videoStats = await Video.aggregate([
        { $match: { owner: channelObjectId, isPublished: true } },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // Extract values or set defaults if no videos found
    const { totalVideos = 0, totalViews = 0 } = videoStats[0] || {};

    // Respond with stats
    res.status(200).json({
        totalSubscribers,
        totalVideos,
        totalViews
    });
});
;


const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Ensure channelId is provided
    if (!channelId) {
        throw new ApiError(400, "Please provide a valid channelId");
    }

    // Fetch all videos by the channel, ordered by latest
    const videos = await Video.find({ owner: channelId, isPublished: true })
        .sort({ createdAt: -1 });

    res.status(200).json(videos);
});


export {
    getChannelStats, 
    getChannelVideos
    }
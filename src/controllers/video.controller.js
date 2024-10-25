import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadVideoToCloudinary,
    uploadThumbnailToCloudinary,
    removeThumbnileOnCloudinarys,
    removeVideoOnCloudinary
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Set up filters
    const match = {}; // Filter criteria for aggregation
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search in title
            { description: { $regex: query, $options: 'i' } } // Case-insensitive search in description
        ];
    }
    if (userId) {
        match.owner = mongoose.Types.ObjectId(userId); // Ensure userId is properly matched as an ObjectId
    }

    // Aggregation pipeline
    const aggregateQuery = Video.aggregate([
        { $match: match },
        { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } },
    ]);

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    // Fetch videos with pagination
    const videos = await Video.aggregatePaginate(aggregateQuery, options);

    return res.status(200).json(new ApiResponse(200, {
        success: true,
        videos: videos.docs,
        totalPages: videos.totalPages,
        currentPage: videos.page,
    }, "Videos found successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const user = req.user;

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        res.status(400);
        throw new ApiError(400, "Video file and thumbnail are required.");
    }

    const videoFile = req.files.videoFile[0];
    const thumbnailFile = req.files.thumbnail[0];

    try {
        const videoUploadResponse = await uploadVideoToCloudinary(videoFile.path);
        const videoUrl = videoUploadResponse.url;
        const videoDuration = videoUploadResponse.duration;

        const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailFile.path);

        const video = new Video({
            title,
            description,
            videoFile: videoUrl,
            thumbnail: thumbnailUrl,
            duration: videoDuration,
            owner: user,
        });

        const savedVideo = await video.save();
        return res.status(200).json(new ApiResponse(200, savedVideo, "video Saved succesfully"))
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to upload video: ${error.message}`);
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "id must required")
    }
    const video = await Video.findOne({ _id: videoId })
    if (!video) {
        throw new ApiError(400, "video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "vedeo found"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const video = await Video.findOne({ _id: videoId });
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    const thumbnailFile = req.file?.path;

    let thumbnailUrl;
    if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailFile);

        if (video.thumbnail) {
            await removeThumbnileOnCloudinarys(video.thumbnail);
        }
    }

    video.title = title;
    video.description = description;

    if (thumbnailUrl) {
        video.thumbnail = thumbnailUrl;
    }

    const updatedVideo = await video.save();

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Please provide valid details");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    removeVideoOnCloudinary(video.videoFile)
    removeThumbnileOnCloudinarys(video.thumbnail)

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Please provide valid details");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    const updatedVideo = await video.save();

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video publish status updated successfully"));
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "Please provide a valid video ID");
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ video: videoId })
        .populate('owner', 'userName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

    const totalComments = await Comment.countDocuments({ video: videoId });

    res.status(200).json(new ApiResponse(200, {
        comments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
        totalComments
    }, "Comments fetched successfully"));
});


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    const user = req.user;

    if (!content || !videoId) {
        throw new ApiError(400, "Please provide valid comment details!");
    }

    const comment = new Comment({
        content,
        video: videoId,
        owner: user._id
    });

    await comment.save();

    res.status(201).json(new ApiResponse(200,
        comment
        , "Comment added successfully"));
});


const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    if (!commentId) {
        throw new ApiError(400, "Please provide valid comment details!");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400, "comment not found");
    }
    comment.content = content;
    const updateComment = await comment.save();

    res.status(201).json(new ApiResponse(200,
        updateComment
        , "Comment Updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if (!commentId) {
        throw new ApiError(400, "Please provide valid comment details!");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400, "comment not found");
    }
    await Comment.findByIdAndDelete(commentId)
    res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
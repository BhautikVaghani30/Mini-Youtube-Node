import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const user = req.user;
    if (!(name, description, user._id)) {
        throw new ApiError(400, "playlist name, description and user is required!")
    }
    const createdUser = await User.findById(user._id).select("-password -refereshToken");
    if (!createdUser) {
        throw new ApiError(400, "User not found");
    }
    const playlist = await Playlist.create({
        name, description, owner: createdUser
    })
    return res.status(200).json(new ApiResponse(201, playlist, "User playlist generated successfully.")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;  // Destructure userId from req.params

    if (!userId) {
        throw new ApiError(400, "UserId required!");
    }

    // Find user by id
    const user = await User.findById(userId);  // Pass userId directly as a string or ObjectId
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Find all playlists by userId
    const userPlaylists = await Playlist.find({ owner: userId });  // Use find() to get all playlists
    if (!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(400, "No playlists found for the user");
    }

    // Send success response
    return res.status(200).json(new ApiResponse(200, userPlaylists, "Playlist found"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    console.log("edfe");

    if (!playlistId) {
        throw new ApiError(400, "playlist id is required!")
    }
    const playlist = await Playlist.findOne({ _id: playlistId })
    if (!playlist) {
        throw new ApiError(400, "playlist not found");
    }
    return res.status(200).json(new ApiResponse(200, playlist, "playlist found"))
})

//TODO: testing remaining 
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;  // Destructure playlistId and videoId from req.params

    // Check if both playlistId and videoId are provided
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Please provide valid details");
    }

    // Find playlist by ID
    const playlist = await Playlist.findById(playlistId);  // Use findById for better efficiency
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Find video by ID
    const video = await Video.findById(videoId);  // Use findById for better efficiency
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    // Add the video to the playlist's videos array
    playlist.videos.push(videoId);

    // Save the updated playlist
    await playlist.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
});

//TODO: testing remaining
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(playlistId || videoId)) {
        throw new ApiError(400, "please provide valid details");
    }

    // Find playlist by ID
    const playlist = await Playlist.findById(playlistId);  // Use findById for better efficiency
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Find video by ID
    const video = await Video.findById(videoId);  // Use findById for better efficiency
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the video is already in the playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video does not exist in playlist");
    }

    // Add the video to the playlist's videos array
    playlist.videos.pop(videoId);

    // Save the updated playlist
    playlist = await playlist.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!(playlistId || name || description)) {
        throw new ApiError(400, "Please provide valid details");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "playlist not found");
    }

    playlist.name = name;
    playlist.description = description;

    playlist = await playlist.save();
    return res.status(200).json(new ApiResponse(200, playlist, "playlist updated successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Check if playlistId is provided
    if (!playlistId) {
        throw new ApiError(400, "Please provide valid details");
    }

    // Find the playlist by its ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Delete the playlist
    await Playlist.findByIdAndDelete(playlistId);

    // Send a success response
    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const user = req.user;


    if (!(content,user)) {
        throw new ApiError(400,"please provide valid details");
    }

    const tweet = new Tweet({
        content: content,
        owner: user
    })

    const newTweet = await tweet.save();
    res.status(200).json(new ApiResponse(201,newTweet, "tweet created succesfully"))
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if (!userId) {
        throw new ApiError(400, "please provide valid detaiils");
    }

    const tweets = await Tweet.find({ owner: userId }).populate('owner', 'name email'); 
    res.status(201).json(new ApiResponse(200,tweets,"user tweets found"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId || !content) {
        throw new ApiError(400, "Please provide valid tweetId and content");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    tweet.content = content;

    const updatedTweet = await tweet.save();

    res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
 const {tweetId} = req.params;

    if (!tweetId) {
        throw new ApiError(400,"please provide valid details");
    }
    const tweet = await Tweet.findOne({_id:tweetId})

    if (!tweet) {
        throw new ApiError(400,"user tweets not found");
    }
    await Tweet.findByIdAndDelete(tweetId)
    res.status(200).json(new ApiResponse(200, null , "user tweets deleted"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
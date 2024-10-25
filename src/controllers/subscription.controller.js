import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Find all subscriptions where the subscription field matches the subscriberId
    const subscriptions = await Subscription.find({ subscription: subscriberId })
        .populate('channel', 'userName email avatar fullName') // Populate the channel details
        .exec();

    // Check if the user is subscribed to any channels
    if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ message: "No subscribed channels found for this user" });
    }

    // Extract the channel information from the populated data
    const subscribedChannels = subscriptions.map(sub => sub.channel);

    // Return the list of subscribed channels
    res.status(200).json({
        message: "Subscribed channels fetched successfully",
        subscribedChannels
    });
});



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (userId.toString() === channelId.toString()) {
        return res.status(400).json({ message: "You cannot subscribe to your own channel" });
    }

    const existingSubscription = await Subscription.findOne({
        subscription: userId,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id });
        return res.status(200).json({ message: "Unsubscribed successfully" });
    } else {
        const newSubscription = new Subscription({
            subscription: userId,
            channel: channelId
        });

        await newSubscription.save();
        return res.status(201).json({ message: "Subscribed successfully" });
    }
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Find all subscriptions where the channel matches the provided channelId
    const subscriptions = await Subscription.find({ channel: channelId })
        .populate('subscription', 'userName email avatar fullName') // Populate the subscriber details
        .exec();

    // Check if the channel has any subscribers
    if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ message: "No subscribers found for this channel" });
    }

    // Extract the subscriber information from the populated data
    const subscribers = subscriptions.map(sub => sub.subscription);

    // Return the list of subscribers
    res.status(200).json({
        message: "Subscribers fetched successfully",
        subscribers
    });
});






export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
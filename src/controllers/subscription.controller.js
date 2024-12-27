import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID!!")
    }

    const subscription = await Subscription.findOne({
        $and: [
            {channel: channelId},
            {subscriber: req.user._id}
        ]
    })

    if(!subscription){
        const subscribe = await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })

        if(!subscribe){
            throw new ApiError(500, "Something went wrong while subscribing to the channel!!")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Subscribed to channel successfully!!"
            )
        )
    }

    const unsubscribe = await Subscription.findByIdAndDelete(subscription._id)

    if(!unsubscribe){
        throw new ApiError(500, "Something went wrong while unsubscribing the channel!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Unsubscribed to channel successfully!!"
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID!!")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    },
                    {
                        $addFields: {
                            subscriber: {
                                $first: "$subscriber"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                subscriber: 1,
                createdAt: 1
            }
        }
    ])

    if(!subscribers.length){
        throw new ApiError(500, "Something went wrong while fetching subscribers of the channel!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully!!"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber ID!!")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    },
                    {
                        $addFields: {
                            channel: {
                                $first: "$channel"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                channel: 1,
                createdAt: 1
            }
        }
    ])

    if(!channels.length){
        throw new ApiError(500, "Something went wrong while fetching subscribed channels!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully!!"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
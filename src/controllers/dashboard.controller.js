import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id
    const videoCount = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: "videoFile",
                totalViews: {
                    $sum: "$views"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                totalVideos: 1,
                totalViews: 1
            }
        }
    ])
    const subscriberCount = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                totalSubscribers: 1
            }
        }
    ])

    const videoLikeCount = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideoLikes: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                totalVideoLikes: 1
            }
        }
    ])
    const commentLikeCount = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalCommentLikes: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                totalCommentLikes: 1
            }
        }
    ])
    const tweetLikeCount = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalTweetLikes: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                totalTweetLikes: 1
            }
        }
    ])

    const info = {
        videoCount,
        subscriberCount,
        videoLikeCount,
        commentLikeCount,
        tweetLikeCount
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            info,
            "User Dashboard SuccessFully !!!"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                isPublished: 1,
                createdAt: 1
            }
        }
    ])

    if(!videos){
        throw new ApiError(404, "No Videos Found !!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "User Videos Found Successfully !!!"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }
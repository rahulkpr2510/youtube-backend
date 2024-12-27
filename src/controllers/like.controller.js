import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { title } from "process"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID!!")
    }

    const likedVideo = await Like.findOne({
        $and: [
            {videoId},
            {userId: req.user._id}
        ]
    })

    if(!likedVideo){
        const like = await Like.create({
            videoId,
            userId: req.user._id
        })

        if(!like){
            throw new ApiError(500, "Something went wrong while liking the video!!")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video liked successfully!!"
            )
        )
    }

    const unlikeVideo = await Like.findByIdAndDelete(likedVideo._id)

    if(!unlikeVideo){
        throw new ApiError(500, "Something went wrong while unliking the video!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video unliked successfully!!"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID!!")
    }

    const likedComment = await Like.findOne({
        $and: [
            {commentId},
            {userId: req.user._id}
        ]
    })

    if(!likedComment){
        const like = await Like.create({
            commentId,
            userId: req.user._id
        })

        if(!like){
            throw new ApiError(500, "Something went wrong while liking the comment!!")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Comment liked successfully!!"
            )
        )
    }

    const unlikeComment = await Like.findByIdAndDelete(likedComment._id)

    if(!unlikeComment){
        throw new ApiError(500, "Something went wrong while unliking the comment!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment unliked successfully!!"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID!!")
    }

    const likedTweet = await Like.findOne({
        $and: [
            {tweetId},
            {userId: req.user._id}
        ]
    })

    if(!likedTweet){
        const like = await Like.create({
            tweetId,
            userId: req.user._id
        })

        if(!like){
            throw new ApiError(500, "Something went wrong while liking the tweet!!")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet liked successfully!!"
            )
        )
    }

    const unlikeComment = await Like.findByIdAndDelete(likedTweet._id)

    if(!unlikeComment){
        throw new ApiError(500, "Something went wrong while unliking the Comment!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment unliked successfully!!"
        )
    )
})
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                videoId: {$exists: true, $ne: null}
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videoId",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "likedBy",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        likedBy: {
                                            $first: "likedBy"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                owner: 1,    
                videoFile: 1,
                createdAt: 1
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $project: {
                videos: 1,
                likedBy: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully!!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
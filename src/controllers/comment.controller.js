import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID!!")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No video with this videoId exist!!")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$createdBy"
                }
            }
        },
        {
            $unwind: "$createdBy"
        },
        {
            $project: {
                content: 1,
                createdBy: {
                    userId: "$createdBy._id",
                    username: 1,
                    avatar: 1
                }
            }
        },
        {
            $skip: (page -1) * limit
        },
        {
            $limit : parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Fetched All Comments Successfully!!"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {content} = req.body
    const  {videoId} = req.params

    if(!content){
        throw new ApiError(400, "Content is required for a comment!!")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No video with this videoId exist!!")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(500, "Something went wrong while publishing the comment!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment Published Successfully!!"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }
    const {content} = req.body
    
    if(!content){
        throw new ApiError(400, "Content is required to update the comment!!")
    }

    const originalComment = await Comment.findById(commentId)

    console.log(originalComment)

    if(!originalComment){
        throw new ApiError(404, "No comment found with this commentID")
    }

    if(originalComment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update the content of this comment!!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )

    if(!updatedComment){
        throw new ApiError(500, "Something went wrong while updating the content of the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updateComment,
            "Successfully updated the comment!!"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "No comment found with this ID!!")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this comment!!")
    }

    const deletedComment = await Comment.findOneAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(500, "Something went wrong while deleting the comment!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment Deleted Successfully!!"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
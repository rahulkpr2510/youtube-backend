import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType} = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos = await Video.aggregate([
        {
            $match: {
                title: {
                    $regex : query, 
                    $options: "i"
                }
            }
        },
        {
            $lookup :{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        {
            $unwind: "$createdBy"
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                views:1,
                duration: 1,
                createdBy: {
                    username: 1,
                    avatar: 1
                }
            }
        },
        {
            $sort :{
                [sortBy] : sortType === 'asc' ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit,
          },
        {
            $limit: parseInt(limit),
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Fetched All Videos Successfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400, "Title and Description is required!!")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail File is required!!")
    }
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if(!thumbnail.url){
        throw new ApiError(500, "Something went wrong while uploading Thumbnail file")
    }
    
    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video File is required!!")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if(!videoFile.url){
        throw new ApiError(500, "Something went wrong while uploading the videoFile")
    }

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        duration: videoFile.duration,
        owner: req.user._id
    })

    if(!video){
        throw new ApiError(500, "Something went wrong while publishing the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video Published Successfully!!"
        )
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(videoId)
    
    if(!video){
        throw new ApiError(404, "No video with this videoId exist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            video, 
            "Video fetched Successfully!!"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title, description} = req.body
    const newThumbnailLocalPath = req.file?.path

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    if(!title && !description){
        throw new ApiError(400, "Title or description is required for updating!!")
    }
    
    if(!newThumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is missing")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No Video found with this ID!!")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update the details of this video!!")
    }

    const deleteThumbnailResponse = await deleteFromCloudinary(video.thumbnail)

    if(deleteThumbnailResponse.result !== "ok"){
        throw new ApiError(500, "Error while deleting the old thumbnail from cloudinary!")
    }
    
    const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
    
    if(!newThumbnail.url){
        throw new ApiError(400, "Error while uploading new thumbnail!!")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail: newThumbnail.url
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            updateVideo, 
            "Successfully Updated"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No Video found with this ID!!")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this video!!")
    }

    
    const cloudinaryDeleteThumbnailResponse  = await deleteFromCloudinary(video.thumbnail)
    
    if(cloudinaryDeleteThumbnailResponse.result !== "ok"){
        throw new ApiError(500, "Error while deleting the video thumbail from cloudinary!!")
    }
    
    const cloudinaryDeleteVideoResponse = await deleteFromCloudinary(video.videoFile)

    if (cloudinaryDeleteVideoResponse.result !== "ok") {
        throw new ApiError(500, "Error while deleting videoFile from cloudinary")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if(!deleteVideo){
        throw new ApiError(500, "Something went wrong while deleting the video!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {}, 
            "Video successfully deleted"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "No video with this videoId exist!!")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to modify the publish status of this video!!")
    }

    const togglePublishStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            togglePublishStatus,
            "Publish Status modified successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
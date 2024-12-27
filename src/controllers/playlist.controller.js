import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "Name and description are required for creating a playlist!!")
    }

    const existingPlaylist = await Playlist.findOne({
        $and: [
            {
                name,
                owner: req.user._id
            }
        ]
    })

    if(existingPlaylist){
        throw new ApiError(400, "You already have a playlist with this name!!")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating the playlist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist Created Successfully!!"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID!!")
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
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
                                $first: "$owner"
                            }
                        }
                    }, 
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
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
                        $project: {
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
            $project: {
                owner: 1,
                videos: 1,
                name: 1,
                description: 1
            }
        }        
    ]).toArray()

    if(!userPlaylists.length === 0){
        throw new ApiError(404, "This user hasn't created any playlist yet!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userPlaylists,
            "UserPlaylist Fetched Successfully!!"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID!!")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy",
                pipeline:[
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
            $addFields:{
                owner: {
                    $first: "$createdBy"
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
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
                                $first :"$owner"
                            }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                owner: 1,
                videos: 1,
                name: 1,
                description: 1
            }
        }
    ])

    if(!playlist){
        throw new ApiError(404, "Playlist with this playlist ID doesn't exist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist Fetched Successfully!!"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Playlist or Video ID!!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "No playlist found with this playlist ID!!")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to add videos to this playlist!!")
    }

    const videoExist = playlist.videos.filter(video => video.toString() === videoId)

    if(videoExist.length > 0){
        throw new ApiError(400, "This video is already in the playlist!!")
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                videos: [...playlist.videos, videoId]
            }
        }, {new: true}
    )

    if(!addVideo){
        throw new ApiError(500, "Something went wrong while adding the video to the playlist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            addVideo,
            "Video added to the playlist successfully!!"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Playlist or Video ID!!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "No playlist found with this playlist ID!!")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to remove videos from this playlist!!")
    }

    const videoExist = playlist.videos.filter(video => video.toString() === videoId)

    const modifiedPlaylist = playlist.videos.filter(video => video.toString() !== videoId)

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                videos: modifiedPlaylist
            }
        }, {new: true}
    )

    if(!removeVideo){
        throw new ApiError(500, "Something went wrong while removing the video from the playlist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            removeVideo,
            "Video removed from the playlist successfully!!"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID!!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "No playlist found with this ID!!")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this playlist!!")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "Something went wrong while deleting the playlist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist Deleted Successfully!!"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID!!")
    }

    if(!name && !description){
        throw new ApiError(400, "Name or description is required for uppdating!!")
    }

    const originalPlaylist = await Playlist.findById(playlistId)

    if(!originalPlaylist){
        throw new ApiError(404, "No playlist found with this playlistID!!")
    }

    if(originalPlaylist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update the details of this playlist!!")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                title,
                description
            }
        },
        {new: true}
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while updating the playlist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully!!"
        )
    )
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
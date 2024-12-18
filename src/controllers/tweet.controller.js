import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required for a tweet!!")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(500, "Something went wrong while publishing your tweet!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet Published Successfully!!"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID!!")
    }
    
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "No user with this userId exist!!")
    }

    const tweets = await Tweet.find({owner: userId})

    if(tweets.length === 0){
        throw new ApiError(404, "No tweets found for this user!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "All Tweets for the user fetched Successfully!!"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet Id!!")
    }

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required for updating the comment!!")
    }

    const originalTweet = await Tweet.findById(tweetId)

    if(!originalTweet){
        throw new ApiError(404, "No tweet foudn with this tweetID")
    }

    if(originalTweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update the content of this tweet!!")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content
            }
        },
        {new: true}
    )

    if(!updateTweet){
        throw new ApiError(500, "Something went wrong while updating the content of this tweet!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updateTweet,
            "Successfully updated the tweet!!"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiResponse(404, "No tweet found with this ID!!")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this tweet!!")
    }

    const deletedTweet = await Tweet.findOneAndDelete(tweetId)

    if(!deleteTweet){
        throw new ApiError(500, "Something went wrong while deleting the tweet!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet Deleted Successfully!!"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
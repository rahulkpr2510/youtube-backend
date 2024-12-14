import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: [true, "Content is required for a tweet"]
    },
},{timestamps: true})

export const Tweet = mongoose.model("Tweet", tweetSchema)
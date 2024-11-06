import mongoose, {isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.models.js"
import { apiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Here we are creating the tweet
const createTweet = asyncHandler(async (req, res) =>{
    const {content} = req.body
    if(!content){
        throw new apiError(400, "content is required")
    }
    const tweet = await Tweet.create({
        owner: req.user._id,
        content : content
    })
    return res
    .status(201)
    .jason(new ApiResponse(201,"Tweet created Successfully"))
})
//Here we are getting the user tweets

const getUserTweet = asyncHandler(async(req, res) =>{
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid user id")
    }
    const tweet = await Tweet.find({owner:userId})
    if(!tweet){
        throw new apiError(404,"No tweet Found")
    }

    return res
    .status(200)
    .jason(new ApiResponse(200, tweet, "Tweet fetched successfully"))
})
//Here we are updating the tweet
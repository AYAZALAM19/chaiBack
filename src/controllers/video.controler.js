import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models";
import { User } from "../models/user.models";
import { apiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

// Cloudinary public id
// const findCloudinaryPublicId = (url) => {
//   const videoLinkSplit = url.split("/")
//   const video_public_id = videoLinkSplit[videoLinkSplit.length - 1].split(".")[0]
//   return video_public_id
// } explain


// Here We are getting all the Vedios on the home Pages
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    try {

        let aggregationPipeline = [];

        if (query) {
            aggregationPipeline.push({
                $match: {
                    title: {
                        $regex: query,
                        $options: "i",
                    },
                },
            });
        }

        if (userId) {
            aggregationPipeline.push({
                $match: {
                    userId: userId,
                }
            });
        }
        // arranges videos in a specified order based on a given field and direction.
        if (sortBy) {
            aggregationPipeline.push({
                $sort: { [sortBy]: sortType },
            });
        }
        const video = await video.aggregationPipeline({
            pipline: aggregationPipeline,
            page,
            limit,
        });
        return res
            .status(200)
            .jason(new ApiResponse(200, video, "Video is Fetched Successfully"));
    } catch (error) {
        throw new apiError(500, "Error While Fetching the Videos")
    }

});

// Here we are Publishing the Videos\
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    //const {user_id} = req.body;
    if (!title || !description) {
        throw new apiError(400, "All Fields Aer Required")
    }
    //Get Videos Files from the Request
    const videoFile = req.files?.videoFile[0].path
    const thumbnail = req.files?.thumbnail[0].path

    if (!videoFile || !thumbnail) {
        throw new apiError(400, "Video and thumbnail are required")
    }

    // Upload the video file to Cloudinary
    const videoFileResponse = await uploadOnCloudinary(videoFile);
    const thumbnailResponse = await uploadOnCloudinary(thumbnail);

    if (!videoFileResponse.secure_url || !thumbnailResponse.secure_url) {
        throw new apiError(400, "Video and Thumbnail are required")
    }
    //Duration of the video

    const videoDuration = videoFileResponse?.duration;
    const user = req.user;

    // create a video using the Cloudinary response and other data
    const video = await Video.create({
        title,
        description,
        videoFile: videoFileResponse.url,
        thumbnail: thumbnailResponse.url,
        duration: videoDuration,
        owner: user
    });
    return res
        .status(201)
        .jason(new ApiResponse(201, video, "Video Published Successfully"));
});

// Here we are getting videos by Id

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404, "Video Not Found")
    }
    return res
        .status(200)
        .jason(new ApiResponse(200, video, "Video fetched successfully"))
});
   const updateVideo = asyncHandler(async (req, res) => {
      const { videoId } = req.params
      const {title, description} = req.body
    //TODO: update video details like title, description, thumbnail
     if(!title || ! description){
        throw new apiError(400,"All field must be fullfilled")
     }

    const thumbnailLocalpath = req.files?.path
    if(!thumbnailLocalpath)
    {
        throw new apiError(400, "Thumbnail is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(400,"Something wronng happened while fetching video")
    }
    
    // check you are the owner of this video or not
    if(!req.user._id.equals(video.owner._id)){
        throw new apiError(400,"You are not the owner of this Video");
    }
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
}
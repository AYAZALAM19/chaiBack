import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
    } catch (error) {
        throw new apiError(500, "Something went Wrong while generating refresh and access token");

    }
}

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Chai aur Code"
    })
    // get user Details from frontend
    // validation -not empty
    // check if user already exists : usrename,email
    // check for image ,chack for avatar
    // upload them to cloudinary, avatar
    // create user object -create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return respose

    //this is Validation Check
    //  If any field is empty, an error is thrown with a 400 status code (Bad Request)
    //  and a message saying that all fields are required.
    const { fullname, email, username, password } = req.body
    //console.log("email :", email,"fullname :",fullname ,"username :" ,username, "password :" ,password );

    if ([fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required");

    }
    //this is Validation Check ends

    // Checking if User Already Exists :
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User with email or username already existes");
    }


    console.log(req.files)

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    } else {
        throw new apiError(400, "Avatar file is required");
    }
    //const avatarLocalPath = req.files?.avatar[0]?.path;

    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar files is required");

    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw apiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const CreatedUser = await User.findById(user._id).select(" -password  -refreshTooken")

    if (!CreatedUser) {
        throw new apiError(500, "Something Went Wrong while registering the user");

    }
    return res.status(201).json(200, CreatedUser, "User registered successfully")
})

const loginUser = asyncHandler(async (req, res) => {
    //req body ->data
    //username or email
    //find the user 
    //password check 
    //access and refresh token
    //send cookies

    const { email, username, password } = req.body
    console.log(email)

    if (!username && !email) {
        throw new apiError(400, "username or email is required")
    }


    // Here is an alternative of above code based on logic 
    // if (!username || !email) {
    //    throw new apiError(400,"username or email is required")
    //   }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new apiError(404, "User dose Not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshTooken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("accessToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
            )
        )
})
const logoutUser = asyncHandler(async (req, res,) => {
    User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshTooken: undefined
        }
    },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged O ut"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new apiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshTooken) {
            throw new apiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken }, "Access token rrefreshed"
                )
            )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }

})

//if we want confrom password like every webpages have 
//new password and conform password  then the sentax will be

const changeCurrentPassword = asyncHandler(async (req, res) => {
    //const { oldPassword,newPassword, conformPassword} =req.body
    // if(!(newPassword == conformPassword))
    //  {
    //    throw new apiError(400,"Password does not match")
    //    }  
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password is changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, " Current User is fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new apiError(400, " All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname, // if we write only once fullname 
                //then it will be as like fullname : fullname
                email: email
            }
        },
        {
            new: true, // we will get information after to get the updated user 
            //or after getting update user we will get information here
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details is updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = res.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        res.user?._id,
        {
            $set:
            {
                avatar: avatar.url
            }
        },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = res.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading on CoverImage")
    }

    const user = await User.findByIdAndUpdate(
        res.user?._id,
        {
            $set:
            {
                coverImage: coverImage.url
            }
        },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "cover image updated successfully")
        )
})

const getUserChennelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new apiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"  //Reffering to Whom i haved subscribed To
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    // console.log(channel())
    if (!channel?.length) {
        throw new apiError(400, "Channel dose not exists")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )

    const getWatchHistory = asyncHandler(async (req, res) => {
        const user = await User.aggregate([
            {
                $match: {
                    _id: req.user?._id
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [{
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    }]
                }
            },
            {
                $addFields: {
                    owner: {
                        $frist: "$owner"
                    }
                }
            }
        ])
        return res
            .status(200)
            .json(new ApiResponse(
                200, user[0].watchHistory,
                "Watch history fetched successfully"
            ))
    })
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChennelProfile,
    getWatchHistory
}
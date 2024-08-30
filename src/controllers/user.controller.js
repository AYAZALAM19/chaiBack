import { asyncHandler } from "../utils/asyncHandler.js";
import{apiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async(req,res) =>{
   res.status(200).json({
        message:"Chai aur Code"
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

    const {fullname,email,username,password}= req.body
    console.log("email :", email,"fullname :",fullname ,"username :" ,username, "password :" ,password );

    if ([fullname,email,username,password].some((field)=> field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required");
        
    }
    const existedUser = User.findOne({
        $or:[ { username } , { email }]
    })

    if (existedUser) {
        throw new apiError(409,"User with email or username already existes"); 
    }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath =  req.files?.coverImage[0]?.path;

   if (!avatarLocalPath) {
    throw new apiError(400,"Avatar files is required");
    
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
    throw apiError(400,"Avatar file is required")
   }

   User.create({
    fullname,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase(),
   })

   const CreatedUser = await User.findById(user._id).select(" -password  -refreshTooken")
   
   if (!CreatedUser) {
    throw new apiError(500,"Something Went Wrong while registering the user");
    
   }
   return res.status(201).json(200,"User registered successfully")
})

 

export {registerUser}
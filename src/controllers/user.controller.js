import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import { User} from "../models/user.model.js"
import { uploadOncloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


const registerUser = asyncHandler ( async ( req,res) => {

    // **** Algo for userRegister ***

    // get data from frontend
    // validation -> if field is not empty
    // check if user alreay exists -> username || email
    // check for images, avatar
    // upload on cloudinary -> check avatar upload on cloudinary
    // reate user object -> reate entry in DB
    // remove password and refresh token from field
    // check for user creation
    // return res



    
    const { username, email, password, fullName} = req.body

    // if(fullName === "") throw new ApiError(404, "Fullname is required ? ")

    // array.some(callback(element, index, array), thisArg)
    // trim() removes leading and trailing whitespace from a string.

    if(
        [email,password,fullName,username].some( (field)=> field?.trim() == "")
    ){
        throw new ApiError(404, " User credentials are wrong ")
    }
    
    if(!email.includes("@")) throw new ApiError(404, " Email is incorrect ")
    
   const existUser = await User.findOne({
        $or: [ { username }, { email }]
    })
    if(existUser)throw new ApiError(409, "User email or usename already exists ! ");

    
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path; // try to log and read how they works 

    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // this gives error undefined
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&  req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required ")

    const avatar =  await uploadOncloudinary(avatarLocalPath)
    const coverImage =  await uploadOncloudinary(coverImageLocalPath)

    if(!avatar)  throw new ApiError(400, "Avatar is required ")

    const user =  await User.create({
        email,
        fullName,
        avatar: avatar.url,
        password,
        coverImage:coverImage?.url || "", 
        username:username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) throw new ApiError(500, "User not created server Failed ")

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully !!")
    )
})

export{
    registerUser,
}
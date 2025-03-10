import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

// Function to generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Store the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// User Registration Handler
const registerUser = asyncHandler(async (req, res) => {

    // **** Algo for userRegister ***

    // get data from frontend
    // validation -> if field is not empty
    // check if user alreay exists -> username || email
    // check for images, avatar
    // upload on cloudinary -> check avatar upload on cloudinary
    // create user object -> reate entry in DB
    // remove password and refresh token from field
    // check for user creation
    // return res


    const { username, email, password, fullName } = req.body;

    // Validate required fields
    if ([email, password, fullName, username].some((field) => field?.trim() === "")) {
        throw new ApiError(404, "User credentials are incorrect");
    }

    if (!email.includes("@")) throw new ApiError(404, "Email is incorrect");

    // Check if user already exists
    const existUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existUser) throw new ApiError(409, "User email or username already exists");

    // Extract avatar and cover image from request files
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    // Upload images to Cloudinary
    const avatar = await uploadOncloudinary(avatarLocalPath);
    const coverImage = await uploadOncloudinary(coverImageLocalPath);

    if (!avatar) throw new ApiError(400, "Avatar upload failed");

    // Create user in database
    const user = await User.create({
        email,
        fullName,
        avatar: avatar.url,
        password,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    });

    // Fetch newly created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) throw new ApiError(500, "User creation failed");

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"));
});

// User Login Handler
const loginUser = asyncHandler(async (req, res) => {

    // **** Algo for loginUser ***

    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie    

    const { email, username, password } = req.body;
    if (!username && !email) throw new ApiError(400, "Username or email is required");

    // Find user by email or username
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) throw new ApiError(404, "User does not exist");

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Fetch user details excluding sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = { httpOnly: true, secure: true };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

// User Logout Handler
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });
    const options = { httpOnly: true, secure: true };
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(201, {}, "User logged out successfully"));
});

// Refresh Access Token Handler
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if (!user) throw new ApiError(401, "Invalid refresh token");

        if (incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh token expired or used");

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
        const options = { httpOnly: true, secure: true };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(201, { accessToken, refreshToken: newRefreshToken }));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Change Password Handler
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    // Find user from request object
        // If we are already login then we change password 
        // Attach user to request object at verifyJWT -> req.user = use
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(400, "User not found");

    // Verify old password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Incorrect password");

    // Set new password and save
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    // Return the currently authenticated user's details
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;

    // Ensure that at least one field (email or fullName) is provided for update
    if (!(email || fullName)) throw new ApiError(400, "All fields are required");

    // Find the user by ID and update their details
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true // Return the updated user object
        }
    ).select("-password"); // Exclude password from the response

    if (!user) throw new ApiError(400, "User not found");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    // Check if an avatar file is provided
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

    // Upload avatar to Cloudinary
    const avatar = await uploadOncloudinary(avatarLocalPath);
    if (!avatar.url) throw new ApiError(400, "Error while uploading avatar to Cloudinary");

    // Update user's avatar URL in the database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password");

    if (!user) throw new ApiError(400, "Error while updating avatar in the database");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    // Check if a cover image file is provided
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing");

    // Upload cover image to Cloudinary
    const coverImage = await uploadOncloudinary(coverImageLocalPath);
    if (!coverImage.url) throw new ApiError(400, "Error while uploading cover image to Cloudinary");

    // Update user's cover image URL in the database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password");

    if (!user) throw new ApiError(400, "Error while updating cover image in the database");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};

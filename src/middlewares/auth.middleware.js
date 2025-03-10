import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Extract token from cookies or Authorization headertoken 
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " ,"")
        // let token = req.cookies?.accessToken || req.header("Authorization");

        //console.log("Raw Token:", token, "Type:", typeof token); // Debugging log

        // Ensure token is a string before using startsWith()
        if (typeof token !== "string") {
            console.error("Invalid Token Format:", token); // Debug log
            throw new ApiError(401, "Invalid token format - Token must be a string");
        }

        // // If token is from Authorization header, remove "Bearer "
        // if (token.startsWith("Bearer ")) {
        //     token = token.slice(7).trim(); // Remove "Bearer " (7 characters) and trim spaces
        // }
        //console.log("Processed Token:", token); // Debugging log

        // Verify JWT
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       // console.log("Decoded Token:", decodedToken); // Debugging log

        // Find user and exclude password & refreshToken
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token - User not found");
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message); // Log error for debugging
        throw new ApiError(401, error.message || "Invalid access token");
    }
});





 // If we are already login then we change password 
// Attach user to request object at verifyJWT -> req.user = use





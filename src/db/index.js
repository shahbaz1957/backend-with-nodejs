import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {dbName: DB_NAME});//dbName optional
        console.log("DB Connected !!");
    } catch (error) {
        console.error("MongoDB Connection FAILED:", error);
        process.exit(1);  // Exit process with failure
    }
};


export default connectDB;



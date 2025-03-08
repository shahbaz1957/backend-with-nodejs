import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true // for serching field make index true if help find in DB in optimize way
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true 
    },
    avatar:{
        type:String, //cloudinary url
        required:true,
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video" // comes from video model, in videoname v is Capital  

        }
    ],
    password:{
        type:String,
        required:[true, "Password is required !!"],
    },
    refreshToken:{
        type:String
    }
}, {timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)//  // Hash password with strength of 10

    next();
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id: history.id,
            email:this.email,
            username:this.username,
            fullName:this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: history.id
        },
        process.env.RESRESH_TOKEN_ACCESS,
        {
            expiresIn:process.env.RESRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
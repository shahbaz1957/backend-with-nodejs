import { Router } from "express";
import {logoutUser, registerUser, loginUser} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(

    upload.fields([
        { 
            name: "avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount: 1
        },
    ]),
    registerUser,
    
)

router.route("/login").post(loginUser)

// secure route
router.route("/logout").post(verifyJWT,logoutUser)


export default router








/*

 ***** Understanding How req.files.avatar Works *****

    1.	Definition in upload.fields()

        upload.fields([
            { name: "avatar", maxCount: 3 }
        ])

        •	Here, "avatar" is just a field name (a string).
        •	maxCount: 3 means it can accept up to 3 files for this field.

        2.	What Happens When Files Are Uploaded?
        •	If a user uploads multiple files under the same field name "avatar", multer groups them into an array.
        •	That’s why req.files.avatar becomes an array of objects, each representing one uploaded file.

        Why Does req.files.avatar Store an Array?

        Even though "avatar" is defined as an object key inside req.files, the value associated with this key is an array because:
            •	The user uploaded multiple files using the same field name "avatar".
            •	multer.fields() automatically groups multiple files into an array under that key.

        So, req.files is an object, but req.files.avatar is an array.


        Example to Show the Structure Clearly

        -> Suppose the user uploads two avatars

        {
        "avatar": [
            {
            "fieldname": "avatar",
            "originalname": "avatar1.jpg",
            "encoding": "7bit",
            "mimetype": "image/jpeg",
            "destination": "./uploads",
            "filename": "avatar1-12345.jpg",
            "path": "./uploads/avatar1-12345.jpg",
            "size": 102400
            },
            {
            "fieldname": "avatar",
            "originalname": "avatar2.jpg",
            "encoding": "7bit",
            "mimetype": "image/jpeg",
            "destination": "./uploads",
            "filename": "avatar2-67890.jpg",
            "path": "./uploads/avatar2-67890.jpg",
            "size": 204800
            }
        ]
        }

        Breaking It Down
	    •req.files is an object:

        {
        "avatar": [...],  
        "coverImage": [...]
        }
*/

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOncloudinary = async (localFilePath)=>{
        try {
            if(!localFilePath) return null;
            //upload local file on cloudinay
           const response =  await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            // file has been uploded 
            // console .log("File uploded successfull !!!",response.url)
            fs.unlinkSync(localFilePath) // ifg file upload on cloudinary then remove from localFile

            //console.log(response);
            return response
        } catch (error) {
            fs.unlinkSync(localFilePath) // remove local file ,if file not uploded on cloudinay
            return null
        }
    }

    export{
        uploadOncloudinary,
    }

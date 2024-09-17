import mongoose, {Schema} from "mongoose";

const LikeSchema = new Schema(
    {
        Video : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        Comment :  {
            type : Schema.Types.ObjectId,
            ref : "Comment"
        },
        LikedBy : {
            type : Schema.Types.ObjectId,
            ref : "User"
        },
        Tweet : { 
            type : Schema.Types.ObjectId,
            ref : "Tweet"
        }

    },{timestamps : true}
)

export const Like =  mongoose.model("Like", LikeSchema)
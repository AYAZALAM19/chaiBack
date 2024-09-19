import mongoose, {Schema} from "mongoose";

const PlaylistSchema  = new Schema(
    {
        name  : {
            type : String,
            required:true,
        },
        description : {
            type : String,
            required:true,
        },
        Videos:[{             // this video is in a playlist so we have to make it in array 
            type : Schema.Types.ObjectId,
            ref : "Video"
        }],
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },{timestamps : true}
)
export const Playlist = mongoose.model( "Playlist", PlaylistSchema)
import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content : {
            type: String,
            required: true
        },
        // createdAt : {
        //     type: Date,
        //     default: Date.now  
        // },
        video : {
            type : {
                type: Schema.Types.ObjectId,
                ref : "Video"
            }
        },
        owner : {
            type : {
                type: Schema.Types.ObjectId,
                ref : "User"
            }
        }

    },{timestamps : true})
    commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment",commentSchema)
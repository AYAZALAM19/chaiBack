import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const vedioSchema = new Schema(
    {
        vedioFile :{
            type:String, //cloudinary url
            required: true,
        },
        thumbNali: {
            type:String, //cloudinary url
            required: true,
        },
        title :{
            type:String,
            required: true,
        },
        Description:{
            type:String,
            required: true,
        },
        duration :{
            type:Number,
            required :true
        },
        views:{
            type:Number,
            default:0
        },
        isPublilshed :{ 
            type:Boolean,
            default:true
        },
        owner:{
            type :Schema.Types.ObjectId,
            ref :"User"
        }
            
    },{timestamps: true})
vedioSchema.plugin(mongooseAggregatePaginate)
export const Vedio = mongoose.model("Vedio", vedioSchema)
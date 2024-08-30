import dotenv from "dotenv"
// require('dotenv').config({path :"./env"})
//import mongoose from "mongoose";
//import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
//import express from "express"
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})


connectDB()
.then( ()=>{
  app.listen(process.env.PORT || 8000,  ()=>{
    console.log(`Server is running at port ${process.env.PORT}`);
    
  })
})
.catch( (err) => {
  console.log("Mongo DB conntection Failed !!! " , err)
})

// (
//     async () => {
//         try {
//           await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//           app.on("error", (error)=>{
//             console.log("Error", error)
//             throw err
//           })
//           app.listen(process.env.PORT,()=>{
//             console.log(`app is listening on port ${process.env.PORT}`);
//           })
//         } catch (error) {
//             console.error("Error", error)
//             throw error;
//         }
//     }

// )()
    
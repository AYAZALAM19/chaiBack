// src/connectDB.js
import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js'; // Adjust the path as necessary
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
        });
        console.log(`MongoDB Connected!! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('MONGODB connection Failed', error);
        process.exit(1);
    }
};

export default connectDB;

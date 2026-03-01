import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (!uri) {
            console.log("No MONGO_URI found, starting in-memory Hackathon mock DB database...");
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
    }
};

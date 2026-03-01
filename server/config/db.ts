import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (!uri) {
            if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
                throw new Error("CRITICAL: MONGO_URI is missing in production environment. Please add it to your Vercel Environment Variables.");
            }
            console.log("No MONGO_URI found, starting in-memory Hackathon mock DB database...");
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Error: ${(error as Error).message}`);
        if (process.env.VERCEL === "1") {
            // Re-throw so Vercel can catch it in logs
            throw error;
        }
    }
};

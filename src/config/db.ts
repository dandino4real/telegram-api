// import mongoose from "mongoose";
// import dotenv from 'dotenv'


// dotenv.config({
//   path:
//     process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// export async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
  
//   if (!mongoUri) {
//     throw new Error("MONGO_URI is not defined in environment variables");
//   }

//   console.log('Connecting to MongoDB...');
//   try {
//     await mongoose.connect(mongoUri);
//     console.log('✅ MongoDB connected successfully');
//   } catch (err) {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   }
// }


// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err; // Let the caller handle retries
  }
}
import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}
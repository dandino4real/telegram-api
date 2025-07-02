import mongoose from 'mongoose';

export  async function connectDB() {
  // Use process.env directly without || '' - we've already validated it
  const mongoUri = process.env.MONGO_URI!;

  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}
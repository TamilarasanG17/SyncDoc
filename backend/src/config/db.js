import mongoose from 'mongoose';

/**
 * Connects to MongoDB using Mongoose.
 * Retries once on failure so local dev (mongod slow to start) doesn't crash immediately.
 */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] initial connection failed, retrying in 3s...', err.message);
    await new Promise((r) => setTimeout(r, 3000));
    await mongoose.connect(uri);
    console.log(`[db] connected on retry -> ${mongoose.connection.name}`);
  }
}

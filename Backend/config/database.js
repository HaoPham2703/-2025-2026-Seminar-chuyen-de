import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/DACN';
const DB_NAME = 'DACN';

let client = null;
let db = null;

/**
 * Kết nối đến MongoDB
 */
export async function connectDatabase() {
  try {
    if (client && db) {
      return { client, db };
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB:', DB_NAME);
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Lấy database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

/**
 * Đóng kết nối MongoDB
 */
export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

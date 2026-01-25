import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getDatabase } from './database.js';
import { ObjectId } from 'mongodb';

let ioInstance = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer) {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

  ioInstance = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN || 'http://localhost:8081',
        'http://localhost:8081',
        'http://192.168.1.6:8081',
        /^http:\/\/192\.168\.\d+\.\d+:8081$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:8081$/,
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO authentication middleware
  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from database
      const db = getDatabase();
      const user = await db.collection('users').findOne({
        _id: new ObjectId(decoded.userId),
        isActive: true
      });

      if (!user) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.tenantId = user.tenantId.toString();
      socket.role = user.role;

      next();
    } catch (error) {
      console.error('Socket.IO authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Socket.IO connection handler
  ioInstance.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.userId} (${socket.role}) from tenant ${socket.tenantId}`);

    // Join room based on tenantId and userId
    const tenantRoom = `tenant:${socket.tenantId}`;
    const userRoom = `user:${socket.userId}`;
    socket.join(tenantRoom);
    socket.join(userRoom);

    console.log(`📦 Socket joined rooms: ${tenantRoom}, ${userRoom}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return ioInstance;
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return ioInstance;
}

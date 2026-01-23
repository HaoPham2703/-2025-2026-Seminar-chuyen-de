import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';
import employeesRoutes from './routes/employees.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:8081',
    'http://localhost:8081',
    'http://192.168.1.6:8081', // Thêm IP của máy cho mobile devices
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Allow any local network IP
    /^http:\/\/10\.\d+\.\d+\.\d+:8081$/, // Allow 10.x.x.x network
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'DACN API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Đăng nhập',
        'POST /api/auth/signup': 'Đăng ký tài khoản mới',
        'GET /api/auth/me': 'Lấy thông tin user hiện tại'
      },
      attendance: {
        'POST /api/attendance/clock-in': 'Chấm công vào ca',
        'POST /api/attendance/clock-out': 'Chấm công ra ca',
        'GET /api/attendance/current?employeeId=xxx': 'Chấm công hôm nay',
        'GET /api/attendance/history?employeeId=xxx': 'Lịch sử chấm công'
      },
      employees: {
        'GET /api/employees/profile': 'Profile employee hiện tại',
        'GET /api/employees/:id': 'Chi tiết employee'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeesRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.js';
import { initializeSocketIO } from './config/socket.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';
import employeesRoutes from './routes/employees.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import schedulesRoutes from './routes/schedules.js';

// Debug: Log khi import routes
console.log('📦 Loading routes...');
console.log('  ✅ Admin routes imported');

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:8081',
    'http://localhost:8081',
    'http://localhost:5173', // Vite dev server (adminSide)
    'http://localhost:5174', // Vite dev server (adminSide alternative port)
    'http://192.168.1.6:8081', // Thêm IP của máy cho mobile devices
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Allow any local network IP
    /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Allow adminSide on local network
    /^http:\/\/10\.\d+\.\d+\.\d+:8081$/, // Allow 10.x.x.x network
    /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // Allow adminSide on 10.x.x.x network
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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DACN API Documentation',
}));

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'DACN API Server',
    version: '1.0.0',
    documentation: 'http://localhost:3000/api-docs',
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', schedulesRoutes);

// Debug: Log registered routes
console.log('📋 Registered API routes:');
console.log('  - /api/auth');
console.log('  - /api/attendance');
console.log('  - /api/employees');
console.log('  - /api/notifications');
console.log('  - /api/admin (with /dashboard, /employees, /attendance/today, /leave-requests)');

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);


// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start HTTP server (with Socket.IO)
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO server ready`);
      console.log(`🧪 Test admin route: http://localhost:${PORT}/api/admin/test`);
      console.log(`📊 Admin dashboard: http://localhost:${PORT}/api/admin/dashboard`);
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

# DACN Backend API Server

Backend API server cho ứng dụng DACN Mobile Client sử dụng Node.js, Express và MongoDB.

## Cấu trúc Project

```
server/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── constants.js  # Application constants
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   └── errorHandler.js # Error handling
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── attendance.js # Attendance routes
│   └── employees.js  # Employee routes
├── utils/            # Utility functions
│   ├── jwt.js        # JWT helpers
│   └── password.js   # Password hashing
├── server.js         # Entry point
├── package.json      # Dependencies
└── .env.example      # Environment variables template
```

## Cài đặt

1. **Cài đặt dependencies:**
```bash
cd server
npm install
```

2. **Tạo file `.env`:**
```bash
cp .env.example .env
```

3. **Cấu hình `.env`:**
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/DACN
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
```

4. **Chạy server:**
```bash
# Development mode (với auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Attendance

- `POST /api/attendance/clock-in` - Chấm công vào ca
- `POST /api/attendance/clock-out` - Chấm công ra ca
- `GET /api/attendance/current` - Lấy thông tin chấm công hôm nay
- `GET /api/attendance/history` - Lấy lịch sử chấm công

### Employees

- `GET /api/employees/profile` - Lấy profile của employee hiện tại
- `GET /api/employees/:employeeId` - Lấy thông tin chi tiết employee

## Authentication

Tất cả các API endpoints (trừ `/api/auth/login`) đều yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

Token được trả về khi đăng nhập thành công.

## Multi-Tenant Architecture

Backend tự động inject `tenantId` vào tất cả queries để đảm bảo data isolation giữa các tenants. Middleware `tenantIsolation` tự động thêm `tenantId` từ JWT token vào query params và body.

## Database

- Database name: `DACN`
- Collections: `tenants`, `users`, `employees`, `attendance`, `schedules`, `leaveRequests`, `reports`

Xem thêm trong `database-design.md` ở root project.

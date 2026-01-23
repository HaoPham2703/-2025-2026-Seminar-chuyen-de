# DACN Mobile Client - Hướng dẫn chạy project

## Cấu trúc Project

```
codeZoneMobile/
├── Frontend/     # React Native + Expo (Mobile App)
├── Backend/      # Node.js + Express (API Server)
└── ...
```

## Yêu cầu hệ thống

- **Node.js**: >= 18.x
- **npm** hoặc **yarn**
- **MongoDB**: Local hoặc MongoDB Atlas
- **Expo CLI**: Sẽ được cài đặt tự động

## Bước 1: Setup Backend

### 1.1. Cài đặt dependencies

```bash
cd Backend
npm install
```

### 1.2. Tạo file `.env`

Tạo file `.env` trong folder `Backend/`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/DACN
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/DACN?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
```

### 1.3. Setup Database

1. **Chạy MongoDB** (nếu dùng local):
   ```bash
   # Windows: Đảm bảo MongoDB service đang chạy
   # Hoặc chạy: mongod
   ```

2. **Import seed data**:
   ```bash
   # Từ root project
   mongosh < database-seed-mongosh-clean.js
   ```

3. **Tạo indexes** (tùy chọn):
   ```bash
   mongosh < scripts/create-indexes.js
   ```

### 1.4. Chạy Backend Server

```bash
cd Backend
npm run dev    # Development mode (với auto-reload)
# hoặc
npm start      # Production mode
```

Server sẽ chạy tại: `http://localhost:3000`

**Kiểm tra server:**
- Health check: `http://localhost:3000/health`
- API base: `http://localhost:3000/api`

## Bước 2: Setup Frontend

### 2.1. Cài đặt dependencies

```bash
cd Frontend
npm install
```

### 2.2. Cấu hình API URL (nếu cần)

Tạo file `.env` trong folder `Frontend/` (nếu cần thay đổi API URL):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Lưu ý:** Mặc định API URL là `http://localhost:3000/api` (xem `Frontend/src/services/api.ts`)

### 2.3. Chạy Frontend

```bash
cd Frontend
npm start
```

Sau đó chọn:
- **a** - Android emulator
- **i** - iOS simulator
- **w** - Web browser
- **r** - Reload app

**Hoặc chạy trực tiếp:**
```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## Bước 3: Chạy cả Frontend và Backend

### Terminal 1 - Backend:
```bash
cd Backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd Frontend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Attendance
- `POST /api/attendance/clock-in` - Chấm công vào ca
- `POST /api/attendance/clock-out` - Chấm công ra ca
- `GET /api/attendance/current?employeeId=xxx` - Chấm công hôm nay
- `GET /api/attendance/history?employeeId=xxx` - Lịch sử chấm công

### Employees
- `GET /api/employees/profile` - Profile employee hiện tại
- `GET /api/employees/:id` - Chi tiết employee

## Test Account (từ seed data)

**Tenant: Quán Cà Phê ABC**
- Email: `admin@abccafe.com`
- Password: (tạm thời skip password check trong development)

- Email: `nhanvien1@abccafe.com`
- Password: (tạm thời skip password check trong development)
- Employee ID: `EMP-001`

**Tenant: Công Ty XYZ**
- Email: `admin@xyzcompany.com`
- Password: (tạm thời skip password check trong development)

## Troubleshooting

### Backend không kết nối được MongoDB
- Kiểm tra MongoDB đang chạy
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra firewall/network

### Frontend không kết nối được Backend
- Kiểm tra Backend đang chạy tại port 3000
- Kiểm tra `CORS_ORIGIN` trong Backend `.env`
- Kiểm tra API URL trong `Frontend/src/services/api.ts`

### Port đã được sử dụng
- Thay đổi `PORT` trong Backend `.env`
- Hoặc kill process đang dùng port đó:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

## Cấu trúc chi tiết

Xem thêm:
- `Backend/README.md` - Chi tiết về Backend
- `database-design.md` - Database design
- `scratchpad.md` - Task tracking và lessons learned

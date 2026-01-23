# Lessons

## User Specified Lessons

### Business Analysis

#### Usecase 1: Chấm công (Clock In/Out)
- As a user, I can clock in/out để ghi nhận thời gian làm việc
- As a user, I can xem thời gian làm việc hiện tại (work hours)
- As a user, I can nhận thông báo nếu chấm công muộn (sau 9:00 AM)
- As a user, I can xem trạng thái vị trí (Location Status) để biết có gần văn phòng không

#### Usecase 2: Quản lý Profile
- As a user, I can xem thông tin cá nhân (tên, email, role, employee ID)
- As a user, I can xem thống kê làm việc (số ngày, tổng giờ, tỷ lệ đúng giờ)
- As a user, I can truy cập các menu (Settings, About, Help, Logout)
- As a user, I can đăng xuất khỏi tài khoản

### Project structures

#### Technical
- **Backend**: Node.js, Express (theo đề cương)
- **Frontend**: React Native với Expo Router
- **Database**: MongoDB (MongoDB Atlas) - Multi-tenant với shared database
- **Database Name**: `DACN`
- **API**: RESTful API với JWT authentication
- **UI/UX**: 
  - Sử dụng NativeWind (Tailwind CSS cho React Native)
  - Animation với react-native-reanimated
  - Icons với lucide-react-native
  - Design system với HSL color format

#### Workflow
- File-based routing với Expo Router
- Components được tổ chức trong `src/components/` cho business logic
- Shared components trong `components/` cho reusable UI
- API services trong `src/services/`
- Sử dụng TypeScript cho type safety

## You have learned in the past

### Bug 1: MongoDB Shell Script Syntax Error
- **Error description**: `SyntaxError: Missing semicolon` khi chạy MongoDB Shell script
- **Solution**: 
  - Sử dụng `use("DACN")` thay vì `use DACN;` trong MongoDB Shell
  - File MongoDB Shell script chỉ chạy được trong `mongosh`, không phải Node.js
  - Luôn thêm comment rõ ràng về môi trường sử dụng

### Bug 2: MongoDB Duplicate Key Error
- **Error description**: `E11000 duplicate key error` khi insert data đã tồn tại
- **Solution**: 
  - Tạo script cleanup trước khi insert: `database-cleanup.js`
  - Hoặc sử dụng script có cleanup tự động: `database-seed-mongosh-clean.js`
  - Xóa data theo thứ tự dependencies (schedules → attendance → employees → users → tenants)

### Bug 3: Network Request Failed trên Mobile
- **Error description**: `Network request failed` khi Frontend (iOS/Android) gọi API
- **Solution**: 
  - Trên mobile, `localhost` không trỏ đến máy host
  - Cần dùng IP address thực tế của máy (ví dụ: `192.168.1.6`)
  - Android Emulator: dùng `10.0.2.2` thay vì localhost
  - iOS Simulator: dùng IP thực tế của máy
  - Web: có thể dùng `localhost`
  - Cấu hình CORS trong Backend để cho phép nhiều origin

### Bug 4: Package Version Conflicts
- **Error description**: `ERESOLVE could not resolve` khi cài dependencies
- **Solution**: 
  - Dùng `npm install --legacy-peer-deps` để bỏ qua peer dependency conflicts
  - Hoặc cập nhật package versions cho tương thích (ví dụ: react-native-svg, async-storage)

### Lesson 1: Profile Screen Implementation
- **Pattern**: Sử dụng `FadeInDown` với staggered delays cho animation mượt mà
- **Component Structure**: 
  - Tách thành sub-components (MenuItem, StatCard) để dễ maintain
  - Sử dụng `useSafeAreaInsets` cho safe area handling
  - Alert dialogs cho user actions
- **Styling**: Nhất quán với design system (HSL colors từ `global.css`)

### Lesson 2: Database Design cho Multi-Tenant System
- **Pattern**: Shared database với `tenantId` isolation
- **Key Collections**: Tenants, Users, Employees, Attendance, Schedules, LeaveRequests, Reports
- **Feature Flags**: Lưu trong `tenants.features` để tùy chỉnh tính năng theo tenant
- **QR Code**: Mỗi employee có QR code duy nhất, admin quét để chấm công
- **Auto Calculation**: Tự động tính late/absent/overtime dựa trên attendance records
- **Indexes**: Luôn tạo indexes cho `tenantId` và các fields thường query

### Lesson 3: MongoDB Seed Data Best Practices
- **Format**: Sử dụng `ObjectId()` và `new Date()` trong MongoDB Shell scripts
- **Database Name**: Luôn sử dụng `DACN` (theo yêu cầu project)
- **Cleanup Strategy**: 
  - Tạo script cleanup riêng hoặc tích hợp vào seed script
  - Xóa theo thứ tự dependencies để tránh foreign key errors
- **Files Structure**:
  - `database-seed-mongosh-clean.js` - Script có cleanup (khuyên dùng)
  - `database-seed-mongosh.js` - Script seed data cơ bản
  - `database-cleanup.js` - Script cleanup riêng
  - `database-seed-data.json` - JSON format cho mongoimport

### Lesson 4: Project File Organization
- **Structure**: Tách Frontend và Backend thành 2 folders riêng
  - `Frontend/` - Tất cả code React Native + Expo
  - `Backend/` - Tất cả code Node.js + Express
- **Components**: 
  - `src/components/` - Business logic components
  - `components/` - Shared UI components
- **Services**: `src/services/` - API service layer
- **Documentation**: 
  - `database-design.md` - Database design documentation
  - `README.md` - Hướng dẫn chạy project
  - `QUICK-START.md` - Quick start guide
  - `scratchpad.md` - Task tracking và lessons learned

### Lesson 5: React Native với Expo
- **Version**: Expo ~54.0.32, React Native 0.81.5
- **Routing**: Expo Router ~6.0.22 (file-based routing)
- **Styling**: NativeWind ^2.0.11 (Tailwind CSS cho React Native)
- **Animation**: react-native-reanimated ~4.1.1
- **Icons**: lucide-react-native ^0.344.0
- **Safe Area**: Sử dụng `useSafeAreaInsets` từ `react-native-safe-area-context`
- **Storage**: `@react-native-async-storage/async-storage` ^2.2.0 (nên dùng version 2.x)

### Lesson 6: Backend API với Node.js/Express
- **Structure**:
  - `config/` - Database connection, constants
  - `middleware/` - JWT auth, tenant isolation, error handling
  - `routes/` - API endpoints
  - `utils/` - JWT, password hashing helpers
- **Key Features**:
  - JWT authentication với `jsonwebtoken`
  - Password hashing với `bcryptjs`
  - Multi-tenant isolation (tự động inject tenantId)
  - CORS configuration cho mobile devices
  - Error handling middleware
- **API Pattern**:
  - Tất cả routes (trừ `/api/auth/login`, `/api/auth/signup`) đều cần JWT token
  - Response format: `{ success: boolean, message?: string, data?: T }`
  - Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

### Lesson 7: Frontend-Backend Integration
- **API Service Layer**: Tạo service layer trong `src/services/` để tách biệt logic
- **Token Management**: 
  - Lưu JWT token trong AsyncStorage
  - Tự động thêm token vào Authorization header
  - Clear token khi logout
- **Network Configuration**:
  - Platform detection để dùng đúng URL (localhost cho web, IP cho mobile)
  - Cấu hình qua `.env` với `EXPO_PUBLIC_API_URL`
  - Error handling với try-catch và user-friendly messages
- **Authentication Flow**:
  - `index.tsx` check token và redirect
  - Login/Signup pages với form validation
  - Auto-redirect sau khi login thành công

### Lesson 8: Login/Signup Pages Design
- **Design Pattern**: 
  - Logo section với geometric shape
  - Form với validation
  - Password toggle visibility
  - Social media links section
- **Styling**: 
  - External CSS files (`styles/login.css`, `styles/signup.css`)
  - Light yellow/cream background (#FFF8E7)
  - Orange accent color (#FF6B35)
  - Gradient buttons (yellow to orange)
- **Implementation**:
  - React Native components với KeyboardAvoidingView
  - ScrollView cho form dài
  - Alert dialogs cho error messages
  - Navigation với Expo Router

### Lesson 9: CORS và Network Configuration
- **CORS Setup**: 
  - Cho phép nhiều origin (localhost, local network IPs)
  - Sử dụng regex patterns cho dynamic IPs
  - Allow credentials và proper headers
- **Mobile Network**:
  - iOS/Android không thể dùng `localhost` để kết nối máy host
  - Cần IP address thực tế (tìm bằng `ipconfig` hoặc `ifconfig`)
  - Android Emulator: `10.0.2.2` là alias của `localhost`
  - Physical devices: cùng WiFi network với máy dev

### Lesson 10: Package Management
- **npm install với conflicts**: Dùng `--legacy-peer-deps` flag
- **Expo package versions**: Kiểm tra compatibility với `expo-doctor`
- **AsyncStorage**: Nên dùng version 2.x cho Expo 54
- **React Native SVG**: Cần version 15.12.1 cho Expo 54

### Bug 5: API Response Parsing Error
- **Error description**: `Authentication error` khi gọi API sau khi login thành công
- **Root cause**: 
  - Logic xử lý response trong `api.ts` có vấn đề: parse JSON hai lần
  - Khi `!response.ok`, đã parse JSON và throw error, nhưng sau đó lại cố parse lại
  - TypeScript error với `HeadersInit` type
- **Solution**: 
  - Sửa logic parse JSON: chỉ parse một lần, check `response.ok` và `data.success`
  - Thêm logging để debug token và API calls
  - Fix TypeScript type cho headers: dùng `Record<string, string>` thay vì `HeadersInit`
  - Thêm check token trước khi gọi API trong components
  - Thêm cleanup trong useEffect để tránh memory leaks
  - Cải thiện error handling: không show alert cho authentication errors tạm thời

### Bug 6: Backend Authentication Error (500) - ObjectId Constructor
- **Error description**: Backend trả về 500 error với message "Authentication error" và "db.constructor.ObjectId is not a constructor"
- **Root cause**: 
  - Sử dụng `db.constructor.ObjectId` không đúng cách trong MongoDB driver
  - MongoDB driver không có `db.constructor.ObjectId`, phải import `ObjectId` từ `mongodb` package trực tiếp
- **Solution**: 
  - Import `ObjectId` từ `mongodb` package: `import { ObjectId } from 'mongodb'`
  - Thay thế tất cả `new db.constructor.ObjectId(...)` thành `new ObjectId(...)`
  - Sửa trong tất cả files: `auth.js`, `attendance.js`, `employees.js`, `middleware/auth.js`
  - Thêm validation cho ObjectId format trước khi convert
  - Thêm logging chi tiết trong auth middleware để debug

# Scratchpad

## Project Overview

### Cấu trúc Project:
```
codeZoneMobile/
├── Frontend/               # React Native + Expo
│   ├── app/                # Expo Router pages
│   │   ├── login.tsx       # Login page
│   │   ├── signup.tsx      # Signup page
│   │   ├── index.tsx       # Auth check & redirect
│   │   └── (tabs)/         # Tab navigation
│   ├── src/
│   │   ├── components/     # Business components
│   │   └── services/      # API services
│   ├── styles/             # External CSS files
│   └── package.json
├── Backend/                # Node.js + Express
│   ├── config/             # Database, constants
│   ├── middleware/         # Auth, error handling
│   ├── routes/             # API endpoints
│   │   ├── auth.js         # Login, signup, me
│   │   ├── attendance.js   # Clock in/out
│   │   └── employees.js    # Employee profile
│   ├── utils/              # JWT, password
│   └── server.js           # Entry point
└── scratchpad.md           # This file
```

### Công nghệ:
- **Frontend**: Expo ~54.0.32, React Native 0.81.5, TypeScript
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB với database name `DACN`
- **Auth**: JWT với AsyncStorage
- **Styling**: NativeWind (Tailwind CSS)

### Chức năng đã hoàn thành:
1. ✅ **Database Design** - 7 collections với multi-tenant
2. ✅ **Backend API** - Authentication, Attendance, Employees endpoints
3. ✅ **Frontend Structure** - Folder organization, API services
4. ✅ **Login/Signup Pages** - UI design theo mẫu
5. ✅ **Network Configuration** - Platform-aware API URLs
6. ✅ **Authentication Flow** - Token management, auto-redirect

## Nhiệm vụ hiện tại: Load dữ liệu thực từ Database

### Mô tả:
- Màn hình chính (Index.tsx) đang hiển thị "Welcome, Jack" và "UI/UX Intern" tĩnh
- Màn hình Attendance đang dùng dữ liệu giả (generateAttendanceData)
- Cần load dữ liệu thực từ database qua API

### Kế hoạch:
[X] Load user info trong Index.tsx (tên, role từ employee profile)
[X] Load current attendance status trong Index.tsx (clock in/out status)
[X] Load attendance history trong attendance.tsx từ API
[X] Xử lý loading states và error handling
[X] Test với dữ liệu thực từ database
[X] Fix authentication error khi load data
[X] Implement logout functionality - xóa token và redirect về login
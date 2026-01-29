# BÁO CÁO ĐỒ ÁN

## Chương 1 – TỔNG QUAN VỀ ĐỀ TÀI

### 1.1. Giới thiệu đề tài và tính cấp thiết của đề tài

Trong bối cảnh công nghệ số phát triển mạnh mẽ, việc quản lý chấm công và theo dõi nhân viên trở nên quan trọng hơn bao giờ hết. Hệ thống chấm công truyền thống với sổ sách và thẻ chấm công thủ công gặp nhiều hạn chế như: dễ mất mát dữ liệu, khó quản lý, tốn thời gian xử lý và không thể theo dõi real-time.

Đề tài "Hệ thống chấm công di động đa tenant" được phát triển nhằm giải quyết các vấn đề trên bằng cách:

- **Số hóa quy trình chấm công**: Nhân viên có thể chấm công trực tiếp trên điện thoại di động, không cần đến văn phòng hoặc máy chấm công cố định.
- **Quản lý đa tenant**: Hệ thống hỗ trợ nhiều tổ chức/công ty cùng sử dụng một nền tảng, mỗi tenant có dữ liệu riêng biệt và được cách ly hoàn toàn.
- **Theo dõi real-time**: Quản trị viên có thể theo dõi trạng thái chấm công của nhân viên theo thời gian thực, gửi thông báo tức thời.
- **Tự động hóa**: Hệ thống tự động tính toán giờ làm việc, giờ làm thêm, đi muộn, vắng mặt và tạo báo cáo.

**Tính cấp thiết**:
- Nhu cầu làm việc từ xa và hybrid work ngày càng tăng sau đại dịch COVID-19
- Yêu cầu minh bạch và chính xác trong quản lý nhân sự
- Tiết kiệm chi phí và thời gian cho doanh nghiệp
- Tăng trải nghiệm người dùng với ứng dụng di động hiện đại

### 1.2. Mục tiêu và phạm vi

#### Mục tiêu

**Mục tiêu chính**:
- Xây dựng hệ thống chấm công di động đa tenant với đầy đủ chức năng quản lý nhân viên, chấm công, xin nghỉ phép và thông báo.
- Phát triển ứng dụng mobile cross-platform (iOS, Android, Web) sử dụng React Native và Expo.
- Xây dựng Backend API với Node.js và Express, hỗ trợ multi-tenant architecture.
- Tích hợp real-time notifications với WebSocket/Socket.IO.

**Mục tiêu cụ thể**:
1. **Chức năng chấm công**:
   - Clock In/Out với validation thời gian và vị trí
   - Hiển thị thời gian làm việc hiện tại
   - Lịch sử chấm công theo ngày/tháng
   - Thống kê giờ làm việc, tỷ lệ đúng giờ

2. **Quản lý nhân viên**:
   - Xem và chỉnh sửa thông tin cá nhân
   - Xem mã QR cá nhân để admin quét chấm công
   - Thống kê cá nhân (số ngày làm việc, tổng giờ, tỷ lệ đúng giờ)

3. **Xin nghỉ phép và điều chỉnh**:
   - Gửi yêu cầu nghỉ phép theo ngày/khung thời gian
   - Gửi yêu cầu điều chỉnh chấm công khi quên hoặc sai giờ
   - Xem lịch sử yêu cầu và trạng thái duyệt

4. **Hệ thống thông báo**:
   - Nhận thông báo real-time từ admin
   - Phân loại thông báo: thông thường, cảnh báo, quan trọng
   - Đánh dấu đã đọc/chưa đọc
   - Lịch sử thông báo

5. **Multi-tenant**:
   - Mỗi tenant có dữ liệu riêng biệt
   - Cách ly hoàn toàn giữa các tenant
   - Quản lý riêng users, employees, attendance, schedules

#### Phạm vi

**Phạm vi nghiên cứu**:
- Nghiên cứu và áp dụng kiến trúc multi-tenant với shared database
- Nghiên cứu React Native và Expo để phát triển ứng dụng cross-platform
- Nghiên cứu WebSocket/Socket.IO cho real-time communication
- Nghiên cứu MongoDB để lưu trữ dữ liệu NoSQL

**Phạm vi chức năng**:
- ✅ Chấm công (Clock In/Out)
- ✅ Quản lý profile nhân viên
- ✅ Xin nghỉ phép và điều chỉnh chấm công
- ✅ Mã QR cá nhân
- ✅ Hệ thống thông báo real-time
- ✅ Dark mode và đa ngôn ngữ (Việt/Anh)
- ❌ Báo cáo và thống kê nâng cao (chưa triển khai)
- ❌ Tích hợp với hệ thống lương (chưa triển khai)
- ❌ Quản lý ca làm việc (schedules) từ mobile (chưa triển khai)

**Phạm vi người dùng**:
- **Nhân viên (Employee)**: Chấm công, xem profile, xin nghỉ phép, nhận thông báo
- **Quản trị viên (Admin)**: Quản lý nhân viên, gửi thông báo, quét QR chấm công (chưa triển khai trên mobile)

### 1.3. Cấu trúc của báo cáo

Báo cáo được chia thành 5 chương chính:

- **Chương 1 – Tổng quan về đề tài**: Giới thiệu đề tài, mục tiêu, phạm vi và cấu trúc báo cáo.
- **Chương 2 – Cơ sở lý thuyết**: Trình bày các khái niệm và công nghệ được sử dụng trong đồ án.
- **Chương 3 – Phân tích và thiết kế hệ thống**: Phân tích yêu cầu, thiết kế database, thiết kế hệ thống và giao diện người dùng.
- **Chương 4 – Phát triển và triển khai hệ thống**: Mô tả môi trường phát triển, quá trình phát triển và hướng dẫn cài đặt.
- **Chương 5 – Kết luận và hướng phát triển**: Tổng kết kết quả, đánh giá ưu nhược điểm và đề xuất hướng phát triển.

---

## Chương 2 – CƠ SỞ LÝ THUYẾT

### 2.1. Các khái niệm và lý thuyết liên quan

#### 2.1.1. Multi-Tenant Architecture

**Khái niệm**: Multi-tenant architecture là mô hình kiến trúc phần mềm cho phép một ứng dụng phục vụ nhiều khách hàng (tenant) khác nhau trên cùng một instance, trong khi dữ liệu và cấu hình của mỗi tenant được cách ly hoàn toàn.

**Các mô hình Multi-Tenant**:
1. **Shared Database, Shared Schema**: Tất cả tenant dùng chung database và schema, phân biệt bằng `tenantId`.
2. **Shared Database, Separate Schema**: Mỗi tenant có schema riêng trong cùng database.
3. **Separate Database**: Mỗi tenant có database riêng biệt.

**Dự án sử dụng**: Shared Database, Shared Schema với `tenantId` isolation.

**Ưu điểm**:
- Tiết kiệm tài nguyên (storage, compute)
- Dễ bảo trì và nâng cấp
- Chi phí thấp cho từng tenant

**Nhược điểm**:
- Cần đảm bảo cách ly dữ liệu tuyệt đối
- Performance có thể bị ảnh hưởng khi số lượng tenant lớn

#### 2.1.2. RESTful API

**Khái niệm**: REST (Representational State Transfer) là một kiến trúc phần mềm cho phép giao tiếp giữa client và server thông qua HTTP methods (GET, POST, PUT, DELETE).

**Nguyên tắc REST**:
- Stateless: Mỗi request phải chứa đầy đủ thông tin để server xử lý
- Resource-based: Sử dụng URL để định danh tài nguyên
- HTTP Methods: GET (đọc), POST (tạo), PUT (cập nhật), DELETE (xóa)
- JSON format: Dữ liệu trao đổi dưới dạng JSON

**Dự án sử dụng**: RESTful API với Express.js, các endpoints:
- `/api/auth/*` - Authentication
- `/api/attendance/*` - Chấm công
- `/api/employees/*` - Quản lý nhân viên
- `/api/notifications/*` - Thông báo

#### 2.1.3. JWT Authentication

**Khái niệm**: JWT (JSON Web Token) là một chuẩn mở (RFC 7519) định nghĩa cách truyền thông tin an toàn giữa các parties dưới dạng JSON object.

**Cấu trúc JWT**:
- **Header**: Loại token và thuật toán mã hóa
- **Payload**: Thông tin về user (userId, tenantId, role)
- **Signature**: Chữ ký để xác thực token

**Ưu điểm**:
- Stateless: Không cần lưu session trên server
- Scalable: Dễ mở rộng với nhiều server
- Secure: Được ký bằng secret key

**Dự án sử dụng**: JWT với `jsonwebtoken` package, token được lưu trong AsyncStorage (mobile) và gửi trong Authorization header.

#### 2.1.4. Real-time Communication với WebSocket

**Khái niệm**: WebSocket là một giao thức truyền thông hai chiều (full-duplex) cho phép client và server trao đổi dữ liệu theo thời gian thực mà không cần polling.

**Socket.IO**: Thư viện JavaScript cung cấp WebSocket abstraction với các tính năng:
- Auto-reconnection
- Room/Namespace support
- Fallback to polling nếu WebSocket không khả dụng
- Event-based communication

**Dự án sử dụng**: Socket.IO cho real-time notifications từ admin đến employees.

### 2.2. Giới thiệu các công nghệ được sử dụng trong đồ án

#### 2.2.1. Frontend Technologies

**React Native**:
- **Phiên bản**: 0.81.5
- **Mô tả**: Framework phát triển ứng dụng mobile cross-platform (iOS, Android) sử dụng JavaScript/TypeScript.
- **Ưu điểm**: Code một lần, chạy trên nhiều platform; Performance gần native; Ecosystem phong phú.
- **Sử dụng trong dự án**: Xây dựng UI components, navigation, state management.

**Expo**:
- **Phiên bản**: ~54.0.32
- **Mô tả**: Platform và toolchain cho React Native, cung cấp các API và services sẵn có.
- **Tính năng sử dụng**:
  - Expo Router: File-based routing (~6.0.22)
  - Expo Constants: Lấy thông tin app và device
  - Expo Haptics: Haptic feedback
  - Expo Image: Optimized image loading
  - Expo Linking: Deep linking

**NativeWind**:
- **Phiên bản**: ^2.0.11
- **Mô tả**: Tailwind CSS cho React Native, cho phép sử dụng utility classes như web.
- **Sử dụng trong dự án**: Styling tất cả components với Tailwind classes.

**React Native Reanimated**:
- **Phiên bản**: ~4.1.1
- **Mô tả**: Thư viện animation mạnh mẽ với 60fps performance, chạy trên UI thread.
- **Sử dụng trong dự án**: Animations cho buttons, forms, transitions.

**TypeScript**:
- **Phiên bản**: ~5.9.2
- **Mô tả**: Superset của JavaScript với static typing.
- **Sử dụng trong dự án**: Type safety cho tất cả Frontend code.

**Socket.IO Client**:
- **Phiên bản**: ^4.7.5
- **Mô tả**: Client library cho Socket.IO để kết nối WebSocket server.
- **Sử dụng trong dự án**: Real-time notifications trong NotificationContext.

#### 2.2.2. Backend Technologies

**Node.js**:
- **Mô tả**: JavaScript runtime built on Chrome's V8 engine, cho phép chạy JavaScript trên server.
- **Sử dụng trong dự án**: Backend runtime environment.

**Express.js**:
- **Phiên bản**: ^4.18.2
- **Mô tả**: Web framework cho Node.js, đơn giản và linh hoạt.
- **Sử dụng trong dự án**: Xây dựng RESTful API, middleware, routing.

**MongoDB**:
- **Phiên bản**: ^6.3.0 (driver)
- **Mô tả**: NoSQL database document-oriented, lưu trữ dữ liệu dưới dạng BSON (Binary JSON).
- **Ưu điểm**: Flexible schema, horizontal scaling, JSON-like documents.
- **Sử dụng trong dự án**: Lưu trữ tất cả dữ liệu (users, employees, attendance, notifications, etc.).

**MongoDB Driver**:
- **Phiên bản**: ^6.3.0
- **Mô tả**: Official MongoDB driver cho Node.js.
- **Sử dụng trong dự án**: Kết nối và thao tác với MongoDB database.

**JWT (jsonwebtoken)**:
- **Phiên bản**: ^9.0.2
- **Mô tả**: Thư viện tạo và verify JWT tokens.
- **Sử dụng trong dự án**: Authentication và authorization.

**Bcrypt.js**:
- **Phiên bản**: ^2.4.3
- **Mô tả**: Thư viện hash password an toàn.
- **Sử dụng trong dự án**: Hash password khi đăng ký và verify khi đăng nhập.

**Socket.IO**:
- **Phiên bản**: ^4.7.2
- **Mô tả**: Real-time bidirectional event-based communication.
- **Sử dụng trong dự án**: Real-time notifications server.

**CORS**:
- **Phiên bản**: ^2.8.5
- **Mô tả**: Middleware để xử lý Cross-Origin Resource Sharing.
- **Sử dụng trong dự án**: Cho phép Frontend (mobile/web) gọi API từ Backend.

**Express Validator**:
- **Phiên bản**: ^7.0.1
- **Mô tả**: Middleware validation cho Express.
- **Sử dụng trong dự án**: Validate request data (email, password, etc.).

#### 2.2.3. Development Tools

**Git**: Version control system.

**npm**: Package manager cho Node.js.

**Expo CLI**: Command-line tool cho Expo development.

**MongoDB Shell (mongosh)**: Interactive shell cho MongoDB.

**VS Code**: Code editor với TypeScript support.

---

## Chương 3 – PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Phân tích yêu cầu hệ thống

#### 3.1.1. Yêu cầu chức năng

**FR1: Quản lý xác thực người dùng**
- FR1.1: Đăng ký tài khoản mới với email, password, thông tin cá nhân
- FR1.2: Đăng nhập với email và password
- FR1.3: Đăng xuất khỏi hệ thống
- FR1.4: Lấy thông tin người dùng hiện tại (me)
- FR1.5: JWT token được lưu và tự động gửi trong các request

**FR2: Chấm công**
- FR2.1: Clock In - Chấm công vào ca với timestamp và location
- FR2.2: Clock Out - Chấm công ra ca với timestamp
- FR2.3: Xem trạng thái chấm công hiện tại (đang làm việc hay không)
- FR2.4: Xem lịch sử chấm công theo ngày/tháng
- FR2.5: Hiển thị thời gian làm việc hiện tại (work hours)
- FR2.6: Tự động tính toán late (đi muộn), absent (vắng mặt), overtime (làm thêm)

**FR3: Quản lý Profile nhân viên**
- FR3.1: Xem thông tin cá nhân (tên, email, role, employee ID)
- FR3.2: Xem thống kê làm việc (số ngày, tổng giờ, tỷ lệ đúng giờ)
- FR3.3: Chỉnh sửa thông tin cá nhân (firstName, lastName, phone, dateOfBirth, gender, address, emergencyContact)
- FR3.4: Xem mã QR cá nhân để admin quét chấm công
- FR3.5: Cài đặt ứng dụng (notifications, theme, language, privacy)

**FR4: Xin nghỉ phép và điều chỉnh chấm công**
- FR4.1: Gửi yêu cầu nghỉ phép cho từng ngày/khung thời gian với lý do
- FR4.2: Gửi yêu cầu điều chỉnh chấm công khi quên hoặc sai giờ với lý do
- FR4.3: Xem lịch sử tất cả yêu cầu nghỉ phép và điều chỉnh
- FR4.4: Xem trạng thái duyệt (PENDING, APPROVED, REJECTED)

**FR5: Hệ thống thông báo**
- FR5.1: Nhận thông báo real-time từ admin
- FR5.2: Xem danh sách thông báo (chưa đọc / đã đọc)
- FR5.3: Đánh dấu thông báo đã đọc
- FR5.4: Đánh dấu tất cả thông báo đã đọc
- FR5.5: Xem chi tiết thông báo
- FR5.6: Xóa thông báo
- FR5.7: Hiển thị badge số lượng thông báo chưa đọc

**FR6: Multi-tenant**
- FR6.1: Mỗi tenant có dữ liệu riêng biệt và cách ly hoàn toàn
- FR6.2: Tự động inject `tenantId` vào các query dựa trên JWT token
- FR6.3: Mỗi tenant có thể có cấu hình riêng (features, settings)

#### 3.1.2. Yêu cầu phi chức năng

**NFR1: Performance**
- Response time API < 500ms cho các request thông thường
- Real-time notifications được gửi trong vòng 1 giây
- App load time < 3 giây trên mobile

**NFR2: Security**
- Password được hash bằng bcrypt với salt rounds
- JWT token có expiration time (7 ngày)
- CORS được cấu hình để chỉ cho phép các origin hợp lệ
- Multi-tenant isolation đảm bảo dữ liệu không bị lộ

**NFR3: Scalability**
- Hệ thống hỗ trợ nhiều tenant cùng lúc
- Database có indexes để tối ưu query performance
- API stateless để dễ scale horizontal

**NFR4: Usability**
- UI/UX thân thiện, dễ sử dụng
- Hỗ trợ dark mode và light mode
- Hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Anh)
- Responsive design cho nhiều kích thước màn hình

**NFR5: Reliability**
- Error handling đầy đủ với thông báo rõ ràng
- Validation input data để tránh lỗi
- Logging để debug và monitor

**NFR6: Maintainability**
- Code được tổ chức rõ ràng, dễ đọc
- Sử dụng TypeScript cho type safety
- Tách biệt concerns (services, components, contexts)
- Documentation đầy đủ

#### 3.1.3. Các đối tượng sử dụng hệ thống

**1. Nhân viên (Employee)**
- **Mô tả**: Người dùng chính của hệ thống, sử dụng ứng dụng mobile để chấm công và quản lý công việc.
- **Quyền hạn**:
  - Chấm công vào/ra ca
  - Xem và chỉnh sửa thông tin cá nhân
  - Xem mã QR cá nhân
  - Xin nghỉ phép và điều chỉnh chấm công
  - Xem lịch sử chấm công và thống kê
  - Nhận và xem thông báo
  - Cài đặt ứng dụng (theme, language, notifications)

**2. Quản trị viên (Admin)**
- **Mô tả**: Người quản lý hệ thống, có quyền quản lý nhân viên và gửi thông báo.
- **Quyền hạn** (chưa triển khai trên mobile):
  - Quản lý nhân viên (thêm, sửa, xóa)
  - Quét QR code của nhân viên để chấm công thay
  - Gửi thông báo đến nhân viên
  - Xem báo cáo và thống kê
  - Quản lý ca làm việc (schedules)

**3. Hệ thống (System)**
- **Mô tả**: Các process tự động của hệ thống.
- **Chức năng**:
  - Tự động tính toán late, absent, overtime
  - Gửi thông báo nhắc nhở chấm công muộn
  - Tạo attendance records tự động dựa trên schedules

### 3.2. Thiết kế cơ sở dữ liệu

#### 3.2.1. Mô hình ERD

Hệ thống sử dụng MongoDB (NoSQL) nên không có ERD truyền thống, nhưng có thể mô tả mối quan hệ giữa các collections:

```
Tenants (1) ──< (N) Users
Tenants (1) ──< (N) Employees
Tenants (1) ──< (N) Attendance
Tenants (1) ──< (N) Schedules
Tenants (1) ──< (N) LeaveRequests
Tenants (1) ──< (N) AttendanceAdjustments
Tenants (1) ──< (N) Notifications

Users (1) ──< (1) Employees
Employees (1) ──< (N) Attendance
Employees (1) ──< (N) LeaveRequests
Employees (1) ──< (N) AttendanceAdjustments
Employees (N) ──< (N) Notifications (qua recipients array)
```

#### 3.2.2. Các bảng (Collections)

**1. Collection: `tenants`**
```javascript
{
  _id: ObjectId,
  name: String,              // Tên tenant (ví dụ: "Quán Cà Phê ABC")
  domain: String,            // Domain (ví dụ: "abccafe.com")
  features: {
    qrCodeAttendance: Boolean,
    locationTracking: Boolean,
    leaveRequests: Boolean,
    // ...
  },
  settings: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**2. Collection: `users`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  email: String,            // Unique per tenant
  password: String,         // Hashed with bcrypt
  role: String,             // "admin" | "employee"
  createdAt: Date,
  updatedAt: Date
}
```

**3. Collection: `employees`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  userId: ObjectId,          // Foreign key to users (1-1)
  employeeId: String,       // Unique per tenant (ví dụ: "EMP-001")
  personalInfo: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,          // "male" | "female" | "other"
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  qrCode: {
    code: String,            // Unique QR code (ví dụ: "EMP-001")
    generatedAt: Date
  },
  statistics: {
    totalWorkingDays: Number,
    totalHours: Number,
    onTimeRate: Number       // Percentage
  },
  createdAt: Date,
  updatedAt: Date
}
```

**4. Collection: `attendance`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  employeeId: ObjectId,      // Foreign key to employees
  date: Date,                // Ngày chấm công (YYYY-MM-DD)
  clockIn: {
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  clockOut: {
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  workDurationMinutes: Number,  // Tổng thời gian làm việc (phút)
  breakDuration: Number,        // Thời gian nghỉ (phút, mặc định 60)
  netWorkMinutes: Number,       // Thời gian làm việc thực tế (phút)
  status: String,              // "on-time" | "late" | "absent" | "overtime"
  lateMinutes: Number,          // Số phút đi muộn
  overtimeMinutes: Number,      // Số phút làm thêm
  createdAt: Date,
  updatedAt: Date
}
```

**5. Collection: `schedules`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  employeeId: ObjectId,      // Foreign key to employees (null = all employees)
  dayOfWeek: Number,         // 0-6 (Sunday-Saturday)
  startTime: String,         // "HH:mm" (ví dụ: "09:00")
  endTime: String,           // "HH:mm" (ví dụ: "18:00")
  breakStartTime: String,    // "HH:mm"
  breakEndTime: String,      // "HH:mm"
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**6. Collection: `leaveRequests`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  employeeId: ObjectId,      // Foreign key to employees
  type: String,              // "sick" | "personal" | "vacation" | "other"
  startDate: Date,
  endDate: Date,
  reason: String,
  status: String,            // "PENDING" | "APPROVED" | "REJECTED"
  reviewedBy: ObjectId,      // Foreign key to users (admin)
  reviewedAt: Date,
  reviewNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**7. Collection: `attendanceAdjustments`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  employeeId: ObjectId,      // Foreign key to employees
  date: Date,                // Ngày cần điều chỉnh
  adjustmentType: String,    // "clock-in" | "clock-out" | "both"
  requestedClockIn: Date,     // Giờ vào yêu cầu
  requestedClockOut: Date,    // Giờ ra yêu cầu
  reason: String,
  status: String,             // "PENDING" | "APPROVED" | "REJECTED"
  reviewedBy: ObjectId,       // Foreign key to users (admin)
  reviewedAt: Date,
  reviewNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**8. Collection: `notifications`**
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Foreign key to tenants
  senderId: ObjectId,        // Foreign key to users (admin)
  type: String,              // "info" | "warning" | "urgent"
  priority: String,          // "low" | "medium" | "high"
  title: String,
  message: String,
  metadata: Object,          // Additional data
  recipients: [{
    employeeId: ObjectId,    // Foreign key to employees
    read: Boolean,
    readAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3.2.3. Ràng buộc và mối quan hệ

**Ràng buộc**:
1. `email` trong `users` phải unique per `tenantId`
2. `employeeId` trong `employees` phải unique per `tenantId`
3. `qrCode.code` trong `employees` phải unique globally
4. Mỗi `employee` chỉ có một `user` (1-1 relationship)
5. `attendance.date` + `employeeId` phải unique (một nhân viên chỉ chấm công một lần mỗi ngày)
6. Tất cả collections đều có `tenantId` để multi-tenant isolation

**Indexes**:
```javascript
// users
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true })

// employees
db.employees.createIndex({ tenantId: 1, employeeId: 1 }, { unique: true })
db.employees.createIndex({ tenantId: 1, userId: 1 }, { unique: true })
db.employees.createIndex({ "qrCode.code": 1 }, { unique: true })

// attendance
db.attendance.createIndex({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true })
db.attendance.createIndex({ tenantId: 1, employeeId: 1 })
db.attendance.createIndex({ tenantId: 1, date: 1 })

// leaveRequests
db.leaveRequests.createIndex({ tenantId: 1, employeeId: 1 })
db.leaveRequests.createIndex({ tenantId: 1, status: 1 })

// attendanceAdjustments
db.attendanceAdjustments.createIndex({ tenantId: 1, employeeId: 1 })
db.attendanceAdjustments.createIndex({ tenantId: 1, status: 1 })

// notifications
db.notifications.createIndex({ tenantId: 1, createdAt: -1 })
db.notifications.createIndex({ tenantId: 1, "recipients.employeeId": 1 })
```

### 3.3. Thiết kế hệ thống

#### 3.3.1. Use Case Diagram

**Actor: Employee**
- UC1: Đăng nhập hệ thống
- UC2: Chấm công vào ca (Clock In)
- UC3: Chấm công ra ca (Clock Out)
- UC4: Xem lịch sử chấm công
- UC5: Xem thông tin cá nhân
- UC6: Chỉnh sửa thông tin cá nhân
- UC7: Xem mã QR cá nhân
- UC8: Xin nghỉ phép
- UC9: Yêu cầu điều chỉnh chấm công
- UC10: Xem lịch sử yêu cầu nghỉ phép và điều chỉnh
- UC11: Nhận thông báo real-time
- UC12: Xem danh sách thông báo
- UC13: Đánh dấu thông báo đã đọc
- UC14: Cài đặt ứng dụng (theme, language, notifications)

**Actor: Admin** (chưa triển khai trên mobile)
- UC15: Quản lý nhân viên
- UC16: Quét QR code chấm công thay
- UC17: Gửi thông báo đến nhân viên
- UC18: Duyệt yêu cầu nghỉ phép
- UC19: Duyệt yêu cầu điều chỉnh chấm công

#### 3.3.2. Class Diagram

**Frontend Classes** (TypeScript/React):

```
┌─────────────────────────────────────┐
│         App (Root)                 │
│  - SettingsProvider                 │
│  - NotificationProvider             │
└─────────────────────────────────────┘
              │
              ├──────────────────────────────┐
              │                              │
┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐
│   SettingsContext         │   │  NotificationContext      │
│  - currentTheme           │   │  - notifications          │
│  - settings               │   │  - unreadCount            │
│  - setTheme()             │   │  - socket                 │
│  - setLanguage()          │   │  - refreshNotifications() │
└───────────────────────────┘   └───────────────────────────┘
              │                              │
              │                              │
┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐
│   API Services            │   │   Components               │
│  - authService            │   │  - Profile                 │
│  - attendanceService      │   │  - AttendanceScreen        │
│  - employeeService        │   │  - EditProfileModal        │
│  - leaveService           │   │  - LeaveRequestModal       │
│  - notificationService    │   │  - NotificationCenter       │
└───────────────────────────┘   └───────────────────────────┘
```

**Backend Classes** (JavaScript/Express):

```
┌─────────────────────────────────────┐
│         Server (Express)            │
│  - app                              │
│  - io (Socket.IO)                   │
└─────────────────────────────────────┘
              │
              ├──────────────────────────────┐
              │                              │
┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐
│   Middleware              │   │   Routes                  │
│  - authMiddleware         │   │  - auth.js                │
│  - tenantMiddleware       │   │  - attendance.js          │
│  - errorHandler           │   │  - employees.js           │
└───────────────────────────┘   │  - notifications.js       │
              │                 └───────────────────────────┘
              │                              │
┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐
│   Database                │   │   Utils                    │
│  - connectDatabase()      │   │  - jwt.js                  │
│  - getDatabase()          │   │  - password.js             │
└───────────────────────────┘   └───────────────────────────┘
```

#### 3.3.3. Sequence Diagram

**Sequence: Clock In**

```
Employee          Frontend          Backend           Database
   │                 │                 │                 │
   │  Click Clock In │                 │                 │
   │───────────────>│                 │                 │
   │                 │  POST /attendance/clock-in        │
   │                 │─────────────────>│                 │
   │                 │                 │  Verify JWT     │
   │                 │                 │─────────────────>│
   │                 │                 │<─────────────────│
   │                 │                 │  Get employeeId  │
   │                 │                 │─────────────────>│
   │                 │                 │<─────────────────│
   │                 │                 │  Create attendance
   │                 │                 │─────────────────>│
   │                 │                 │<─────────────────│
   │                 │  Success Response                 │
   │                 │<─────────────────│                 │
   │  Show Success   │                 │                 │
   │<───────────────│                 │                 │
```

**Sequence: Real-time Notification**

```
Admin             Backend           Socket.IO         Employee
  │                 │                 │                 │
  │  POST /notifications              │                 │
  │─────────────────>│                 │                 │
  │                 │  Save to DB     │                 │
  │                 │─────────────────>│                 │
  │                 │<─────────────────│                 │
  │                 │  Emit to recipients               │
  │                 │─────────────────>│                 │
  │                 │                 │  Emit event      │
  │                 │                 │─────────────────>│
  │                 │                 │                 │  Show notification
  │                 │                 │                 │<─┐
  │                 │                 │                 │  │
  │                 │                 │                 │  │
```

### 3.4. Thiết kế giao diện người dùng

#### 3.4.1. Màn hình đăng nhập (Login)

- **Layout**: Logo ở trên, form đăng nhập ở giữa, liên kết đăng ký ở dưới
- **Components**: 
  - Input email với validation
  - Input password với toggle visibility
  - Button đăng nhập với loading state
  - Link chuyển sang đăng ký
- **Styling**: Light yellow/cream background (#FFF8E7), orange accent (#FF6B35), gradient buttons

#### 3.4.2. Màn hình Home (Chấm công)

- **Layout**: Header với thông tin nhân viên, Clock In/Out button lớn ở giữa, thời gian làm việc hiện tại, lịch sử chấm công gần đây
- **Components**:
  - ClockButton: Button lớn với icon và text động (Clock In/Out)
  - TimeStats: Hiển thị giờ làm việc hiện tại
  - AttendanceHistory: Danh sách chấm công gần đây
- **Styling**: Card-based layout, dark mode support

#### 3.4.3. Màn hình Profile

- **Layout**: Avatar và thông tin cá nhân ở trên, menu items ở giữa, thống kê ở dưới
- **Components**:
  - Avatar với tên và email
  - MenuItem: Settings, Mã QR của tôi, About, Help, Logout
  - StatCard: Số ngày làm việc, tổng giờ, tỷ lệ đúng giờ
- **Styling**: Clean và modern, dark mode support

#### 3.4.4. Màn hình Attendance (Lịch sử chấm công)

- **Layout**: Header với filter, danh sách chấm công theo ngày
- **Components**:
  - AttendanceItem: Hiển thị ngày, giờ vào/ra, thời gian làm việc, trạng thái
  - Context menu: Xin nghỉ phép, Điều chỉnh chấm công
- **Styling**: List layout với cards, pull-to-refresh

#### 3.4.5. Màn hình Updates (Thông báo)

- **Layout**: Header với 2 tabs (Chưa đọc / Đã đọc), danh sách thông báo
- **Components**:
  - Tab buttons: Chuyển đổi giữa chưa đọc và đã đọc
  - NotificationItem: Icon, type, title, message, timestamp, badge priority
  - Action buttons: Đọc tất cả (chỉ ở tab Chưa đọc)
- **Styling**: Clean list với icons và badges, pull-to-refresh

#### 3.4.6. Màn hình Settings

- **Layout**: Danh sách các cài đặt theo nhóm
- **Components**:
  - SettingItem: Toggle switches, select options
  - ThemeOption: Light, Dark, Auto
  - LanguageOption: Tiếng Việt, English
- **Styling**: Grouped list với icons

---

## Chương 4 – PHÁT TRIỂN VÀ TRIỂN KHAI HỆ THỐNG

### 4.1. Môi trường phát triển và quá trình phát triển hệ thống

#### 4.1.1. Môi trường phát triển

**Frontend**:
- **OS**: Windows 10/11, macOS, Linux
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **Expo CLI**: Được cài đặt tự động với Expo
- **IDE**: VS Code với extensions:
  - ESLint
  - Prettier
  - TypeScript
  - React Native Tools

**Backend**:
- **OS**: Windows 10/11, macOS, Linux
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **MongoDB**: Local MongoDB hoặc MongoDB Atlas
- **IDE**: VS Code với extensions:
  - ESLint
  - Node.js extensions

**Database**:
- **MongoDB**: Local (MongoDB Community Server) hoặc MongoDB Atlas (cloud)
- **MongoDB Shell**: mongosh để chạy scripts

**Testing Devices**:
- **Android Emulator**: Android Studio
- **iOS Simulator**: Xcode (macOS only)
- **Physical Devices**: Expo Go app
- **Web Browser**: Chrome, Firefox, Safari

#### 4.1.2. Quá trình phát triển hệ thống

**Giai đoạn 1: Setup và cấu trúc dự án**
1. Tạo cấu trúc thư mục Frontend và Backend
2. Khởi tạo Expo project với TypeScript
3. Setup Backend với Express và MongoDB
4. Cấu hình routing, middleware, và error handling
5. Setup development environment (`.env` files, scripts)

**Giai đoạn 2: Database Design và Seed Data**
1. Thiết kế database schema cho 8 collections
2. Tạo MongoDB indexes
3. Viết scripts seed data cho development
4. Test database connections và queries

**Giai đoạn 3: Authentication System**
1. Implement JWT authentication trong Backend
2. Tạo auth routes (login, signup, me)
3. Implement auth service trong Frontend
4. Tạo Login và Signup pages với validation
5. Token management với AsyncStorage
6. Auto-redirect sau khi login

**Giai đoạn 4: Core Features - Chấm công**
1. Implement attendance routes trong Backend
2. Tạo attendance service trong Frontend
3. Xây dựng Home screen với Clock In/Out
4. Implement Attendance screen với lịch sử
5. Tính toán late, absent, overtime tự động

**Giai đoạn 5: Profile Management**
1. Implement employee routes trong Backend
2. Tạo employee service trong Frontend
3. Xây dựng Profile screen
4. Implement Edit Profile Modal với validation
5. Thêm Settings screen với Context API

**Giai đoạn 6: Leave Requests và Adjustments**
1. Implement leave routes trong Backend
2. Tạo leave service trong Frontend
3. Xây dựng Leave Request Modal
4. Xây dựng Attendance Adjustment Modal
5. Tích hợp vào Attendance screen với context menu
6. Hiển thị lịch sử yêu cầu trong Resources tab

**Giai đoạn 7: QR Code System**
1. Implement QR code generation trong Backend
2. Tạo script assign QR codes cho employees
3. Xây dựng Employee QR Card component
4. Tích hợp vào Profile screen

**Giai đoạn 8: Notification System**
1. Setup Socket.IO server trong Backend
2. Implement notification routes
3. Tạo NotificationContext với Socket.IO client
4. Xây dựng NotificationCenter và NotificationItem components
5. Tích hợp vào Updates tab với 2 tabs (Chưa đọc/Đã đọc)
6. Tạo Notification Detail Page
7. Implement pull-to-refresh

**Giai đoạn 9: UI/UX Improvements**
1. Implement dark mode với theme system
2. Thêm i18n support (Tiếng Việt, English)
3. Cải thiện animations với react-native-reanimated
4. Responsive design cho nhiều kích thước màn hình
5. Error handling và loading states

**Giai đoạn 10: Testing và Bug Fixes**
1. Test các chức năng chính
2. Fix bugs về network, authentication, notifications
3. Optimize performance
4. Cải thiện error messages và user experience

#### 4.1.3. Công cụ và thư viện sử dụng

**Version Control**: Git

**Package Managers**: npm

**API Testing**: Postman, curl

**Database Tools**: MongoDB Compass, mongosh

**Code Quality**: ESLint, Prettier

**Documentation**: Markdown files (README.md, scratchpad.md)

### 4.2. Hướng dẫn cài đặt và sử dụng hệ thống

#### 4.2.1. Yêu cầu hệ thống

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **MongoDB**: Local MongoDB hoặc MongoDB Atlas account
- **Git**: Để clone repository
- **Expo Go**: App trên điện thoại để test (tùy chọn)

#### 4.2.2. Cài đặt Backend

**Bước 1: Clone repository**
```bash
git clone <repository-url>
cd codeZoneMobile/Backend
```

**Bước 2: Cài đặt dependencies**
```bash
npm install
```

**Bước 3: Tạo file `.env`**
Tạo file `.env` trong folder `Backend/` với nội dung:
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

**Bước 4: Setup Database**
1. Đảm bảo MongoDB đang chạy (nếu dùng local):
   ```bash
   # Windows: Kiểm tra MongoDB service
   # Hoặc chạy: mongod
   ```

2. Import seed data (tùy chọn):
   ```bash
   mongosh < database-seed-mongosh-clean.js
   ```

3. Tạo indexes (tùy chọn):
   ```bash
   mongosh < scripts/create-indexes.js
   ```

**Bước 5: Chạy Backend Server**
```bash
npm run dev    # Development mode với auto-reload
# hoặc
npm start      # Production mode
```

Server sẽ chạy tại: `http://localhost:3000`

**Kiểm tra**: Mở browser và truy cập `http://localhost:3000/health`

#### 4.2.3. Cài đặt Frontend

**Bước 1: Di chuyển đến folder Frontend**
```bash
cd ../Frontend
```

**Bước 2: Cài đặt dependencies**
```bash
npm install
```

**Bước 3: Cấu hình API URL (nếu cần)**
Tạo file `.env` trong folder `Frontend/` (nếu cần thay đổi API URL):
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Lưu ý quan trọng**:
- **Điện thoại thật (Expo Go)**: Phải dùng **LAN IP của máy chạy Backend** (tìm bằng `ipconfig` trên Windows hoặc `ifconfig` trên macOS/Linux). Ví dụ: `EXPO_PUBLIC_API_URL=http://192.168.1.6:3000/api`
- **Android Emulator**: Nên dùng `http://10.0.2.2:3000/api` (app đã fallback tự động nếu không set env)
- **Web**: Dùng `http://localhost:3000/api`

**Bước 4: Chạy Frontend**
```bash
npm start
```

Sau đó chọn:
- **a** - Android emulator
- **i** - iOS simulator (macOS only)
- **w** - Web browser
- **r** - Reload app

**Hoặc chạy trực tiếp**:
```bash
npm run android    # Android
npm run ios        # iOS (macOS only)
npm run web        # Web
```

#### 4.2.4. Chạy cả Frontend và Backend

**Terminal 1 - Backend**:
```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd Frontend
npm start
```

#### 4.2.5. Tài khoản test (từ seed data)

**Tenant: Quán Cà Phê ABC**
- Email: `admin@abccafe.com`
- Password: (tạm thời skip password check trong development)

- Email: `nhanvien1@abccafe.com`
- Password: (tạm thời skip password check trong development)
- Employee ID: `EMP-001`

**Tenant: Công Ty XYZ**
- Email: `admin@xyzcompany.com`
- Password: (tạm thời skip password check trong development)

#### 4.2.6. Hướng dẫn sử dụng

**Đăng nhập**:
1. Mở app, nhập email và password
2. Nhấn "Đăng nhập"
3. Nếu thành công, sẽ chuyển đến màn hình Home

**Chấm công**:
1. Vào màn hình Home
2. Nhấn nút "Clock In" để chấm công vào ca
3. Nhấn nút "Clock Out" để chấm công ra ca
4. Xem thời gian làm việc hiện tại và lịch sử chấm công

**Xem Profile**:
1. Vào tab "Profile"
2. Xem thông tin cá nhân và thống kê
3. Nhấn "Chỉnh sửa" để sửa thông tin
4. Nhấn "Mã QR của tôi" để xem QR code

**Xin nghỉ phép**:
1. Vào tab "Attendance"
2. Nhấn và giữ một ngày trong lịch sử
3. Chọn "Xin nghỉ phép"
4. Điền thông tin và gửi yêu cầu

**Xem thông báo**:
1. Vào tab "Updates"
2. Xem danh sách thông báo (Chưa đọc / Đã đọc)
3. Nhấn vào thông báo để xem chi tiết
4. Nhấn "Đọc tất cả" để đánh dấu tất cả đã đọc

**Cài đặt**:
1. Vào tab "Profile"
2. Nhấn "Settings"
3. Thay đổi theme (Light/Dark/Auto)
4. Thay đổi ngôn ngữ (Tiếng Việt/English)
5. Cài đặt thông báo

#### 4.2.7. Troubleshooting

**Backend không kết nối được MongoDB**:
- Kiểm tra MongoDB đang chạy
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra firewall/network

**Frontend không kết nối được Backend**:
- Kiểm tra Backend đang chạy tại port 3000
- Kiểm tra `CORS_ORIGIN` trong Backend `.env`
- Kiểm tra API URL trong Frontend `.env` hoặc `api.ts`
- Trên mobile, đảm bảo dùng IP thực tế của máy, không dùng `localhost`

**Port đã được sử dụng**:
- Thay đổi `PORT` trong Backend `.env`
- Hoặc kill process đang dùng port đó:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

**Lỗi khi cài dependencies**:
- Xóa `node_modules` và `package-lock.json`
- Chạy lại `npm install`
- Nếu vẫn lỗi, thử `npm install --legacy-peer-deps`

**Lỗi network trên mobile**:
- Đảm bảo điện thoại và máy tính cùng WiFi network
- Kiểm tra firewall không chặn port 3000
- Sử dụng IP thực tế của máy, không dùng `localhost`

---

## Chương 5 – KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Tổng kết lại các kết quả đã đạt được

Đồ án "Hệ thống chấm công di động đa tenant" đã được phát triển thành công với các kết quả chính sau:

#### 5.1.1. Về mặt chức năng

**✅ Hệ thống xác thực hoàn chỉnh**:
- Đăng ký và đăng nhập với JWT authentication
- Quản lý token tự động với AsyncStorage
- Multi-tenant isolation đảm bảo dữ liệu riêng biệt

**✅ Chức năng chấm công đầy đủ**:
- Clock In/Out với timestamp và location
- Hiển thị thời gian làm việc hiện tại
- Lịch sử chấm công theo ngày/tháng
- Tự động tính toán late, absent, overtime

**✅ Quản lý Profile nhân viên**:
- Xem và chỉnh sửa thông tin cá nhân
- Xem thống kê làm việc (số ngày, tổng giờ, tỷ lệ đúng giờ)
- Xem mã QR cá nhân để admin quét chấm công
- Cài đặt ứng dụng (theme, language, notifications, privacy)

**✅ Xin nghỉ phép và điều chỉnh chấm công**:
- Gửi yêu cầu nghỉ phép với lý do
- Gửi yêu cầu điều chỉnh chấm công
- Xem lịch sử yêu cầu và trạng thái duyệt

**✅ Hệ thống thông báo real-time**:
- Nhận thông báo real-time từ admin qua Socket.IO
- Phân loại thông báo (chưa đọc / đã đọc)
- Đánh dấu đã đọc và xóa thông báo
- Badge hiển thị số lượng thông báo chưa đọc

**✅ Multi-tenant Architecture**:
- Shared database với `tenantId` isolation
- Mỗi tenant có dữ liệu riêng biệt và cách ly hoàn toàn
- Hỗ trợ nhiều tổ chức/công ty cùng sử dụng

#### 5.1.2. Về mặt kỹ thuật

**✅ Frontend**:
- Ứng dụng cross-platform (iOS, Android, Web) với React Native và Expo
- TypeScript cho type safety
- NativeWind (Tailwind CSS) cho styling
- React Native Reanimated cho animations mượt mà
- Context API cho state management
- File-based routing với Expo Router

**✅ Backend**:
- RESTful API với Express.js
- MongoDB với multi-tenant architecture
- JWT authentication và authorization
- Socket.IO cho real-time notifications
- Error handling và validation đầy đủ
- CORS configuration cho mobile devices

**✅ Database**:
- 8 collections với indexes tối ưu
- Multi-tenant isolation với `tenantId`
- Relationships và constraints được thiết kế hợp lý
- Seed data scripts cho development

**✅ UI/UX**:
- Dark mode và light mode
- Đa ngôn ngữ (Tiếng Việt, English)
- Responsive design
- Animations mượt mà
- Error handling và loading states
- Pull-to-refresh functionality

#### 5.1.3. Về mặt tài liệu

- ✅ README.md với hướng dẫn cài đặt và sử dụng
- ✅ scratchpad.md với lessons learned và task tracking
- ✅ Database design documentation
- ✅ API endpoints documentation
- ✅ Code comments và TypeScript types

### 5.2. Ưu, nhược điểm của hệ thống

#### 5.2.1. Ưu điểm

**1. Kiến trúc Multi-tenant linh hoạt**:
- Shared database giúp tiết kiệm tài nguyên
- Dễ mở rộng cho nhiều tenant mới
- Cách ly dữ liệu đảm bảo bảo mật

**2. Cross-platform**:
- Một codebase chạy trên iOS, Android và Web
- Tiết kiệm thời gian và chi phí phát triển
- Dễ bảo trì và nâng cấp

**3. Real-time Communication**:
- Thông báo được gửi và nhận ngay lập tức
- Cải thiện trải nghiệm người dùng
- Phù hợp với nhu cầu quản lý hiện đại

**4. UI/UX hiện đại**:
- Dark mode và light mode
- Đa ngôn ngữ
- Animations mượt mà
- Responsive design

**5. Bảo mật**:
- JWT authentication
- Password hashing với bcrypt
- Multi-tenant isolation
- CORS configuration

**6. Scalability**:
- Stateless API dễ scale horizontal
- Database indexes tối ưu performance
- Socket.IO hỗ trợ nhiều connections

#### 5.2.2. Nhược điểm

**1. Chức năng Admin chưa hoàn chỉnh**:
- Admin chưa có ứng dụng mobile để quản lý nhân viên
- Chưa có chức năng quét QR code từ mobile
- Chưa có dashboard để xem báo cáo và thống kê

**2. Báo cáo và thống kê hạn chế**:
- Chưa có báo cáo chi tiết về attendance
- Chưa có biểu đồ và visualization
- Chưa có export data (Excel, PDF)

**3. Chưa tích hợp với hệ thống khác**:
- Chưa tích hợp với hệ thống lương
- Chưa tích hợp với hệ thống HR
- Chưa có API để tích hợp với hệ thống bên thứ ba

**4. Performance có thể cải thiện**:
- Chưa có caching mechanism
- Chưa có pagination cho một số endpoints
- Chưa có image optimization

**5. Testing chưa đầy đủ**:
- Chưa có unit tests
- Chưa có integration tests
- Chưa có end-to-end tests

**6. Documentation có thể mở rộng**:
- Chưa có API documentation chi tiết (Swagger/OpenAPI)
- Chưa có user manual đầy đủ
- Chưa có deployment guide

### 5.3. Đề xuất hướng phát triển trong tương lai

#### 5.3.1. Ngắn hạn (3-6 tháng)

**1. Hoàn thiện chức năng Admin trên Mobile**:
- Xây dựng ứng dụng Admin với đầy đủ chức năng quản lý
- Chức năng quét QR code từ mobile để chấm công thay
- Dashboard để xem báo cáo và thống kê real-time
- Quản lý ca làm việc (schedules) từ mobile

**2. Cải thiện Báo cáo và Thống kê**:
- Báo cáo chi tiết về attendance theo ngày/tháng/năm
- Biểu đồ và visualization (charts, graphs)
- Export data ra Excel, PDF
- Báo cáo tổng hợp cho admin

**3. Testing và Quality Assurance**:
- Viết unit tests cho các services và utilities
- Viết integration tests cho API endpoints
- Viết end-to-end tests cho các luồng chính
- Setup CI/CD pipeline

**4. Performance Optimization**:
- Implement caching (Redis) cho các query thường dùng
- Thêm pagination cho tất cả list endpoints
- Optimize database queries
- Image optimization và lazy loading

**5. Documentation**:
- Tạo API documentation với Swagger/OpenAPI
- Viết user manual đầy đủ
- Tạo deployment guide cho production
- Video tutorials cho người dùng

#### 5.3.2. Trung hạn (6-12 tháng)

**1. Tích hợp với hệ thống khác**:
- Tích hợp với hệ thống lương để tự động tính lương
- Tích hợp với hệ thống HR để đồng bộ dữ liệu nhân viên
- API để tích hợp với hệ thống bên thứ ba (ERP, CRM)
- Webhook support cho các sự kiện quan trọng

**2. Nâng cao bảo mật**:
- Two-factor authentication (2FA)
- Biometric authentication (Face ID, Fingerprint)
- Rate limiting để chống DDoS
- Audit logs cho các hành động quan trọng

**3. Tính năng nâng cao**:
- Geofencing để tự động chấm công khi vào/ra văn phòng
- Face recognition để xác thực chấm công
- Shift management (ca làm việc linh hoạt)
- Overtime approval workflow

**4. Analytics và Insights**:
- Machine learning để dự đoán attendance patterns
- Anomaly detection để phát hiện hành vi bất thường
- Predictive analytics cho workforce planning
- Employee engagement metrics

**5. Mobile App Improvements**:
- Offline mode để chấm công khi không có internet
- Push notifications với rich content
- Widget cho home screen
- Apple Watch và Wear OS support

#### 5.3.3. Dài hạn (12+ tháng)

**1. Mở rộng Multi-tenant**:
- White-label solution cho các đối tác
- Custom branding cho mỗi tenant
- Tenant-specific features và configurations
- Marketplace cho plugins và extensions

**2. AI và Machine Learning**:
- AI chatbot để hỗ trợ nhân viên
- Predictive attendance analytics
- Automated scheduling optimization
- Fraud detection và prevention

**3. Enterprise Features**:
- SSO (Single Sign-On) integration
- Advanced role-based access control (RBAC)
- Compliance và audit trails
- Data retention policies

**4. Scalability và Infrastructure**:
- Microservices architecture
- Kubernetes deployment
- Multi-region support
- CDN cho static assets
- Database sharding cho large-scale tenants

**5. Mobile Platform Expansion**:
- Desktop app (Windows, macOS, Linux)
- Progressive Web App (PWA)
- Smartwatch apps (Apple Watch, Wear OS)
- Voice assistants integration (Siri, Google Assistant)

---

## Tài liệu tham khảo

1. React Native Documentation. https://reactnative.dev/
2. Expo Documentation. https://docs.expo.dev/
3. Express.js Documentation. https://expressjs.com/
4. MongoDB Documentation. https://www.mongodb.com/docs/
5. Socket.IO Documentation. https://socket.io/docs/
6. JWT.io. https://jwt.io/
7. Tailwind CSS Documentation. https://tailwindcss.com/
8. React Native Reanimated Documentation. https://docs.swmansion.com/react-native-reanimated/
9. Multi-Tenant Architecture Patterns. https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns
10. RESTful API Design Best Practices. https://restfulapi.net/

---

**Ngày hoàn thành**: [Ngày/Tháng/Năm]

**Sinh viên thực hiện**: [Tên sinh viên]

**Giảng viên hướng dẫn**: [Tên giảng viên]

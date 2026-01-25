# Hướng dẫn Test Notification System

## 📋 Yêu cầu

1. Backend server đang chạy (`npm run dev` trong `Backend/`)
2. Frontend app đang chạy (`npm start` trong `Frontend/`)
3. MongoDB đang chạy và có data (tenants, users, employees)
4. Có ít nhất 1 admin account và 1 employee account

## 🧪 Cách 1: Test bằng Script (Nhanh nhất)

### Bước 1: Cài đặt node-fetch (nếu chưa có)

```bash
cd Backend
npm install node-fetch@2
```

### Bước 2: Chỉnh sửa script test

Mở file `Backend/scripts/test-notifications.js` và thay đổi:

```javascript
const ADMIN_EMAIL = 'admin@example.com'; // Email admin thực tế
const ADMIN_PASSWORD = 'password123'; // Password admin thực tế
const TENANT_ID = null; // Hoặc tenantId nếu cần
```

### Bước 3: Chạy script

```bash
cd Backend
node scripts/test-notifications.js
```

Script sẽ:
- ✅ Login với admin account
- ✅ Gửi notification cho tất cả employees
- ✅ Hiển thị kết quả

## 🧪 Cách 2: Test bằng Postman/Thunder Client

### Bước 1: Login để lấy token

**Request:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "tenantId": null
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Lưu token** để dùng cho các request sau.

### Bước 2: Gửi notification

**Request:**
```
POST http://localhost:3000/api/notifications/send
Authorization: Bearer <TOKEN_TỪ_BƯỚC_1>
Content-Type: application/json

{
  "title": "Thông báo test",
  "message": "Đây là thông báo test từ admin",
  "type": "ANNOUNCEMENT",
  "priority": "MEDIUM",
  "targetAudience": "ALL"
}
```

**Các loại targetAudience:**
- `"ALL"` - Gửi cho tất cả employees
- `"DEPARTMENT"` - Gửi cho department cụ thể (cần thêm `targetDepartment`)
- `"SPECIFIC"` - Gửi cho employees cụ thể (cần thêm `targetEmployeeIds`)

**Ví dụ gửi cho department:**
```json
{
  "title": "Thông báo cho IT Department",
  "message": "Meeting lúc 2PM hôm nay",
  "type": "ANNOUNCEMENT",
  "priority": "HIGH",
  "targetAudience": "DEPARTMENT",
  "targetDepartment": "IT"
}
```

**Ví dụ gửi cho employees cụ thể:**
```json
{
  "title": "Thông báo cá nhân",
  "message": "Bạn có lịch hẹn mới",
  "type": "ANNOUNCEMENT",
  "priority": "MEDIUM",
  "targetAudience": "SPECIFIC",
  "targetEmployeeIds": ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent to 5 employee(s)",
  "data": {
    "notificationId": "507f1f77bcf86cd799439012",
    "recipientsCount": 5
  }
}
```

### Bước 3: Xem notifications đã gửi (Admin)

**Request:**
```
GET http://localhost:3000/api/notifications/sent?page=1&limit=10
Authorization: Bearer <ADMIN_TOKEN>
```

### Bước 4: Test với Employee account

**Login với employee:**
```
POST http://localhost:3000/api/auth/login
{
  "email": "employee@example.com",
  "password": "password123"
}
```

**Lấy notifications của employee:**
```
GET http://localhost:3000/api/notifications?page=1&limit=20
Authorization: Bearer <EMPLOYEE_TOKEN>
```

**Lấy số unread:**
```
GET http://localhost:3000/api/notifications/unread-count
Authorization: Bearer <EMPLOYEE_TOKEN>
```

**Đánh dấu đã đọc:**
```
PUT http://localhost:3000/api/notifications/<NOTIFICATION_ID>/read
Authorization: Bearer <EMPLOYEE_TOKEN>
```

## 🧪 Cách 3: Test Real-time trên Mobile App

### Bước 1: Setup

1. **Chạy Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Chạy Frontend:**
   ```bash
   cd Frontend
   npm start
   ```

3. **Mở app trên mobile/emulator:**
   - Login với **employee account**
   - Đảm bảo Socket.IO đã kết nối (check console logs)

### Bước 2: Gửi notification từ admin

Sử dụng **Cách 1** hoặc **Cách 2** để gửi notification.

### Bước 3: Kiểm tra trên app

**Trên mobile app, bạn sẽ thấy:**

1. **Notification Badge** xuất hiện:
   - Trên tab "Updates" (Bell icon)
   - Trên Profile screen (menu "Thông báo")

2. **NotificationCenter** tự động cập nhật:
   - Mở tab "Updates" hoặc click "Thông báo" trong Profile
   - Notification mới sẽ xuất hiện ngay lập tức (real-time)
   - Badge số unread tự động tăng

3. **Test các actions:**
   - Click notification → tự động mark as read
   - Click "Đọc tất cả" → mark all as read
   - Swipe/delete notification → xóa khỏi danh sách

## 🔍 Debug và Troubleshooting

### Kiểm tra Socket.IO connection

**Backend logs:**
```
✅ Client connected: <userId> (EMPLOYEE) from tenant <tenantId>
📦 Socket joined rooms: tenant:<tenantId>, user:<userId>
```

**Frontend logs (React Native debugger hoặc console):**
```
Connecting to Socket.IO server: http://192.168.1.6:3000
✅ Socket.IO connected
📬 New notification received: { ... }
```

### Lỗi thường gặp

1. **"Authentication token required"**
   - Kiểm tra token có được gửi trong `socket.handshake.auth.token`
   - Đảm bảo user đã login và có token trong AsyncStorage

2. **"Socket.IO connection error"**
   - Kiểm tra IP address trong `getSocketUrl()` có đúng không
   - Kiểm tra Backend server đang chạy
   - Kiểm tra CORS settings trong `Backend/config/socket.js`

3. **"No employees found to send notification"**
   - Kiểm tra có employees trong database không
   - Kiểm tra `employment.status` = 'ACTIVE'
   - Kiểm tra `targetAudience` và filters có đúng không

4. **Notification không hiển thị real-time**
   - Kiểm tra Socket.IO đã connect chưa
   - Kiểm tra event `new_notification` có được emit không
   - Kiểm tra `refreshNotifications()` có được gọi không

### Test với curl (Command line)

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.token')

# 2. Gửi notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "type": "ANNOUNCEMENT",
    "priority": "MEDIUM",
    "targetAudience": "ALL"
  }'

# 3. Xem notifications (employee)
EMPLOYEE_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@example.com","password":"password123"}' \
  | jq -r '.token')

curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

## ✅ Checklist Test

- [ ] Admin có thể login và lấy token
- [ ] Admin có thể gửi notification (ALL, DEPARTMENT, SPECIFIC)
- [ ] Notification được lưu vào database
- [ ] Socket.IO emit event `new_notification` đến đúng users
- [ ] Employee nhận notification real-time trên app
- [ ] Badge hiển thị số unread đúng
- [ ] Employee có thể mark as read
- [ ] Employee có thể mark all as read
- [ ] Employee có thể delete notification
- [ ] NotificationCenter hiển thị đúng danh sách
- [ ] Unread count tự động cập nhật

## 📝 Test Cases

### Test Case 1: Gửi notification cho tất cả
1. Admin gửi notification với `targetAudience: "ALL"`
2. Tất cả employees nhận notification
3. Badge hiển thị số unread đúng

### Test Case 2: Gửi notification cho department
1. Admin gửi notification với `targetAudience: "DEPARTMENT"`, `targetDepartment: "IT"`
2. Chỉ employees trong IT department nhận notification
3. Employees khác không nhận

### Test Case 3: Real-time update
1. Employee đang mở app
2. Admin gửi notification
3. Employee nhận notification ngay lập tức (không cần refresh)

### Test Case 4: Mark as read
1. Employee có unread notifications
2. Click vào notification
3. Notification tự động mark as read
4. Badge giảm số unread

### Test Case 5: Multiple devices
1. Employee login trên 2 devices
2. Admin gửi notification
3. Cả 2 devices đều nhận notification real-time

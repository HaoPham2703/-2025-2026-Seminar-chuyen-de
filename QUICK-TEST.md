# 🚀 Quick Test Guide - Notification System

## Cách nhanh nhất để test

### Bước 1: Chạy Backend và Frontend

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm start
```

### Bước 2: Login vào app với Employee account

Mở app trên mobile/emulator và login với employee account.

### Bước 3: Gửi notification từ Postman/Thunder Client

**Request:**
```
POST http://localhost:3000/api/notifications/send
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "Đây là thông báo test",
  "type": "ANNOUNCEMENT",
  "priority": "MEDIUM",
  "targetAudience": "ALL"
}
```

**Lấy ADMIN_TOKEN:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Bước 4: Kiểm tra trên app

1. ✅ Badge số unread xuất hiện trên tab "Updates" và Profile
2. ✅ Mở tab "Updates" → NotificationCenter hiển thị notification mới
3. ✅ Notification xuất hiện **ngay lập tức** (real-time) không cần refresh

## 🎯 Test Scenarios

### Scenario 1: Real-time Notification
1. Employee đang mở app (tab Home hoặc Profile)
2. Admin gửi notification
3. **Kết quả mong đợi:** Badge xuất hiện ngay, notification hiển thị real-time

### Scenario 2: Mark as Read
1. Employee có unread notifications
2. Click vào notification trong NotificationCenter
3. **Kết quả mong đợi:** Notification mark as read, badge giảm số

### Scenario 3: Multiple Notifications
1. Admin gửi 3 notifications liên tiếp
2. **Kết quả mong đợi:** Tất cả đều xuất hiện, badge hiển thị số đúng

## 🔧 Troubleshooting

### Notification không xuất hiện real-time?

1. **Kiểm tra Socket.IO connection:**
   - Backend logs: `✅ Client connected: ...`
   - Frontend console: `✅ Socket.IO connected`

2. **Kiểm tra IP address:**
   - Đảm bảo `EXPO_PUBLIC_API_URL` trong `.env` đúng IP của máy
   - Hoặc dùng auto-detect IP từ Expo

3. **Kiểm tra token:**
   - Token phải hợp lệ và chưa expire
   - User phải là employee (có employee record)

### Badge không hiển thị?

1. Kiểm tra `unreadCount > 0`
2. Kiểm tra NotificationBadge component có được render không
3. Check console logs xem có lỗi gì không

## 📱 Test trên Mobile Device

1. **Tìm IP của máy:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Cập nhật .env:**
   ```
   EXPO_PUBLIC_API_URL=http://<YOUR_IP>:3000/api
   ```

3. **Restart Expo:**
   ```bash
   cd Frontend
   npm start
   ```

4. **Scan QR code** và mở app trên device

5. **Test như bước 3-4** ở trên

# Hướng dẫn tạo tài khoản Admin

## 🚀 Cách nhanh nhất

### Bước 1: Chạy script tạo admin

```bash
cd Backend
npm run create-admin
```

Script sẽ tạo:
- ✅ Tenant mặc định (nếu chưa có)
- ✅ Admin user với email: `admin@example.com`
- ✅ Password: `admin123`
- ✅ Role: `TENANT_ADMIN`

### Bước 2: Login với Postman

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

## 🎯 Tùy chỉnh thông tin admin

### Cách 1: Dùng environment variables

```bash
ADMIN_EMAIL=myadmin@company.com \
ADMIN_PASSWORD=mypassword123 \
ADMIN_FIRST_NAME=John \
ADMIN_LAST_NAME=Doe \
ADMIN_ROLE=TENANT_ADMIN \
npm run create-admin
```

### Cách 2: Sửa trực tiếp trong script

Mở file `Backend/scripts/create-admin.js` và thay đổi:

```javascript
const ADMIN_EMAIL = 'your-admin@email.com';
const ADMIN_PASSWORD = 'your-password';
const ADMIN_ROLE = ROLES.TENANT_ADMIN; // hoặc ROLES.SUPER_ADMIN
```

## 📋 Các loại Role

- `TENANT_ADMIN` - Admin của một tenant (có thể gửi notifications)
- `SUPER_ADMIN` - Super admin (toàn quyền)

## 🔍 Kiểm tra admin đã được tạo

### Query MongoDB:

```javascript
// Trong MongoDB Shell hoặc MongoDB Compass
use DACN;

// Xem tất cả users
db.users.find().pretty();

// Xem admin users
db.users.find({ role: { $in: ['TENANT_ADMIN', 'SUPER_ADMIN'] } }).pretty();

// Xem tenants
db.tenants.find().pretty();
```

## 🛠️ Troubleshooting

### Lỗi: "User already exists"

Script sẽ tự động update password và role của user đã tồn tại.

### Lỗi: "Database not connected"

Đảm bảo:
1. MongoDB đang chạy
2. `MONGODB_URI` trong `.env` đúng
3. Database `DACN` đã được tạo

### Lỗi: "Invalid email or password" khi login

1. **Kiểm tra email có đúng không:**
   ```bash
   # Query MongoDB
   db.users.find({ email: "admin@example.com" }).pretty();
   ```

2. **Kiểm tra password đã được hash:**
   - Password trong database phải là hash (bắt đầu với `$2a$` hoặc `$2b$`)
   - Nếu password là plain text, chạy lại script `create-admin`

3. **Reset password:**
   ```bash
   # Chạy lại script với password mới
   ADMIN_PASSWORD=newpassword123 npm run create-admin
   ```

## 📝 Tạo nhiều admin accounts

Chạy script nhiều lần với email khác nhau:

```bash
ADMIN_EMAIL=admin1@company.com ADMIN_PASSWORD=pass123 npm run create-admin
ADMIN_EMAIL=admin2@company.com ADMIN_PASSWORD=pass123 npm run create-admin
ADMIN_EMAIL=superadmin@company.com ADMIN_PASSWORD=pass123 ADMIN_ROLE=SUPER_ADMIN npm run create-admin
```

## ✅ Test sau khi tạo

1. **Login với Postman:**
   ```
   POST http://localhost:3000/api/auth/login
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```

2. **Gửi notification:**
   ```
   POST http://localhost:3000/api/notifications/send
   Authorization: Bearer <TOKEN>
   {
     "title": "Test",
     "message": "Test notification",
     "type": "ANNOUNCEMENT",
     "priority": "MEDIUM",
     "targetAudience": "ALL"
   }
   ```

3. **Kiểm tra trên app:**
   - Employee login vào app
   - Notification xuất hiện real-time

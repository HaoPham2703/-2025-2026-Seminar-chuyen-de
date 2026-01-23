# 🚀 Quick Start Guide

Hướng dẫn nhanh để chạy project DACN Mobile Client.

## ⚡ Chạy nhanh (3 bước)

### 1️⃣ Setup Backend

```bash
# Cài đặt dependencies
cd Backend
npm install

# Tạo file .env (copy từ .env.example)
copy .env.example .env
# Hoặc tạo thủ công file .env với nội dung:
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/DACN
# JWT_SECRET=your-secret-key
# CORS_ORIGIN=http://localhost:8081

# Chạy server
npm run dev
```

✅ Backend chạy tại: `http://localhost:3000`

### 2️⃣ Setup Database (nếu chưa có data)

```bash
# Từ root project, import seed data
mongosh < database-seed-mongosh-clean.js
```

### 3️⃣ Setup Frontend

```bash
# Mở terminal mới
cd Frontend
npm install
npm start
```

✅ Chọn **a** (Android), **i** (iOS), hoặc **w** (Web)

## 📝 Test Account

**Email:** `nhanvien1@abccafe.com`  
**Password:** (tạm thời không cần password trong development)

## 🔧 Troubleshooting

### Backend không chạy được
- ✅ Kiểm tra MongoDB đang chạy: `mongosh` hoặc kiểm tra service
- ✅ Kiểm tra file `.env` trong `Backend/`
- ✅ Kiểm tra port 3000 chưa bị sử dụng

### Frontend không kết nối được Backend
- ✅ Đảm bảo Backend đang chạy
- ✅ Kiểm tra `CORS_ORIGIN` trong Backend `.env` = `http://localhost:8081`
- ✅ Kiểm tra API URL trong `Frontend/src/services/api.ts`

### Database connection error
- ✅ Kiểm tra MongoDB đang chạy
- ✅ Kiểm tra `MONGODB_URI` trong `.env`
- ✅ Thử kết nối: `mongosh "mongodb://localhost:27017/DACN"`

## 📚 Xem thêm

- `README.md` - Hướng dẫn chi tiết
- `Backend/README.md` - Backend documentation
- `database-design.md` - Database schema

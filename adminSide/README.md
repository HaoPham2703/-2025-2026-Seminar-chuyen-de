# Admin Dashboard - HRsync

Dashboard quản lý nhân sự cho admin, được xây dựng với React + Vite + TypeScript + Tailwind CSS.

## Cấu trúc Project

```
adminSide/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Layout chính với Sidebar và Header
│   │   ├── Sidebar.tsx         # Sidebar navigation
│   │   ├── Header.tsx           # Top header với actions
│   │   └── dashboard/           # Dashboard cards
│   │       ├── AttendanceReportCard.tsx
│   │       ├── TasksCard.tsx
│   │       ├── ScheduleCard.tsx
│   │       ├── LeaveRequestsCard.tsx
│   │       └── InternshipCard.tsx
│   ├── pages/                   # Các pages
│   │   ├── Dashboard.tsx
│   │   ├── Schedule.tsx
│   │   ├── Attendance.tsx
│   │   ├── Departments.tsx
│   │   ├── Integrations.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── HelpCenter.tsx
│   ├── App.tsx                  # Main app với routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles với Tailwind
├── package.json
└── vite.config.ts
```

## Cài đặt và Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

## Tính năng

### Đã hoàn thành:
- ✅ Layout chính với Sidebar và Header
- ✅ Dashboard với các cards:
  - Attendance Report (Absent/Present employees)
  - Tasks (với checkboxes, tags, due dates)
  - Schedule (calendar + meetings list)
  - Leave Requests (danh sách yêu cầu nghỉ phép)
  - Internship (tổng quan thực tập sinh)
- ✅ Navigation giữa các pages
- ✅ Responsive design với Tailwind CSS

### Đang phát triển:
- [ ] Tích hợp API từ Backend để load dữ liệu thực tế
- [ ] Xây dựng các pages chi tiết (Schedule, Attendance, Departments, Reports)
- [ ] Authentication và authorization
- [ ] Real-time updates với Socket.IO

## Công nghệ

- **React 19** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Lucide React** - Icons
- **date-fns** - Date utilities

## Kết nối với Backend

Dashboard sử dụng chung Backend với Frontend (ClientSide) tại `http://localhost:3000/api`.

### Cấu hình

1. Tạo file `.env` (copy từ `.env.example`):
```bash
VITE_API_URL=http://localhost:3000/api
```

2. Đảm bảo Backend đang chạy:
```bash
cd ../Backend
npm start
```

### Authentication

- Sử dụng JWT token được lưu trong `localStorage`
- Token tự động được thêm vào header `Authorization` cho mọi API request
- Có Login page tại `/login` để đăng nhập
- Tự động redirect đến `/login` nếu chưa đăng nhập

### API Services

Đã tạo các services để kết nối với Backend:
- `authService` - Login, logout, get current user
- `attendanceService` - Clock in/out, get attendance history
- `employeeService` - Get employee profile, leave requests
- `notificationService` - Get notifications, mark as read

Tất cả services sử dụng `api` client từ `src/services/api.ts` với token management tự động.

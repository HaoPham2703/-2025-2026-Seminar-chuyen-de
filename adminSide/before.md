# BEFORE.md - Tổng hợp hiện trạng adminSide (HR Management Admin)

## 1) Mục tiêu tài liệu
Tài liệu này tổng hợp hiện trạng kỹ thuật và chức năng của folder adminSide tại thời điểm hiện tại, làm bản gốc để chỉnh sửa thành after.md theo yêu cầu dự án.

Bối cảnh dự án:
- Hệ thống: quản lý nhân sự
- Phạm vi folder này: trang quản trị dành cho admin
- Vai trò ứng dụng: theo dõi nhân sự, chấm công, nghỉ phép, lương, cấu hình quản trị

## 2) Công nghệ đang dùng
Từ package hiện có:
- React 19
- TypeScript 5.9
- Vite 7
- React Router DOM 7
- Tailwind CSS 4 + PostCSS + Autoprefixer
- Lucide React (icons)
- date-fns (xử lý thời gian)
- ESLint 9 + typescript-eslint

Scripts chính:
- npm run dev: chạy local
- npm run build: type-check + build
- npm run preview: chạy bản build
- npm run lint: kiểm tra lint

## 3) Cấu trúc chính của adminSide
- src/App.tsx: cấu hình Router toàn app
- src/main.tsx: entry point
- src/components:
  - Layout.tsx: layout bảo vệ route (auth guard)
  - Sidebar.tsx: menu điều hướng
  - Header.tsx: header, search, action, đổi ngôn ngữ
  - dashboard/*: các card ở trang Dashboard
- src/pages:
  - Dashboard.tsx
  - Schedule.tsx
  - Attendance.tsx
  - Payroll.tsx
  - LeaveRequests.tsx
  - Departments.tsx
  - Integrations.tsx
  - Reports.tsx
  - Settings.tsx
  - HelpCenter.tsx
  - Login.tsx
  - Signup.tsx
- src/contexts:
  - AuthContext.tsx: quản lý đăng nhập, user hiện tại
  - LanguageContext.tsx: quản lý ngôn ngữ vi/en
- src/services:
  - api.ts: HTTP client + token bearer
  - authService.ts
  - adminService.ts
  - attendanceService.ts
  - employeeService.ts
  - payrollService.ts
  - notificationService.ts
- src/utils/i18n.ts: dictionary dịch vi/en
- .env: biến môi trường VITE_API_URL

## 4) Kiến trúc ứng dụng và luồng dữ liệu
Kiến trúc theo lớp:
1. UI Layer (pages/components)
2. State Layer (contexts)
3. Service Layer (gọi API)
4. Backend API

Luồng auth chính:
1. Login/Signup gọi AuthContext
2. AuthContext gọi authService
3. authService dùng api.ts để gọi endpoint
4. Token lưu localStorage key admin_token
5. Layout.tsx kiểm tra isAuthenticated để cho vào trang chính hoặc chuyển về /login

Token handling tại api.ts:
- Tự gắn Authorization: Bearer <token> cho mọi request nếu token tồn tại
- Base URL lấy từ VITE_API_URL, fallback http://localhost:3000/api

## 5) Route map hiện tại
Public:
- /login
- /signup

Protected (nằm trong Layout):
- /
- /schedule
- /attendance
- /payroll
- /leave-requests
- /departments
- /integrations
- /reports
- /settings
- /help

## 6) Tóm tắt chức năng theo trang
### 6.1 Dashboard
- Nạp dữ liệu tổng quan từ adminService.getDashboardData()
- Hiển thị nhóm card dashboard
- Kết hợp thống kê chấm công, nghỉ phép, tác vụ

### 6.2 Schedule
- Hiển thị lịch theo tuần + danh sách nhân viên
- Có điều hướng tuần trước/sau
- Mức độ dữ liệu thực tế phụ thuộc backend schedule (hiện thiên về giao diện hiển thị)

### 6.3 Attendance
- Dữ liệu attendance hôm nay qua adminService.getTodayAttendance()
- Hiển thị bảng bản ghi chấm công

### 6.4 Payroll
- Chức năng quản lý bảng lương tương đối đầy đủ:
  - lọc theo kỳ/nhân viên/trạng thái
  - tạo/sửa/revise bảng lương
  - auto-calculate bảng lương
- Có các rule thao tác theo trạng thái DRAFT/PENDING/APPROVED

### 6.5 LeaveRequests
- Tải danh sách đơn nghỉ theo trạng thái
- Duyệt hoặc từ chối đơn nghỉ

### 6.6 Departments
- Hiển thị phòng ban và danh sách nhân sự theo phòng

### 6.7 Reports
- Trang báo cáo tổng hợp KPI nhân sự/chấm công

### 6.8 Integrations
- Có UI tích hợp (Gmail, Calendar, Slack, Teams...)
- Trạng thái hiện tại chủ yếu là skeleton/chưa tích hợp thực

### 6.9 Settings
- Nhiều nhóm cấu hình: profile/password/preferences/company
- Có kết nối lấy/lưu attendance settings và payroll formula settings
- Một số phần profile/password vẫn đang TODO

### 6.10 HelpCenter
- FAQ + hướng dẫn sử dụng cơ bản

### 6.11 Login/Signup
- Login: email/password/tenantId (optional)
- Signup: thông tin cá nhân + password, có kiểm tra confirm password

## 7) Contexts hiện có
### 7.1 AuthContext
State và API:
- user
- isLoading
- isAuthenticated
- login(email, password, tenantId?)
- signup(credentials)
- logout()
- refreshUser()

Hành vi:
- Khi app khởi động, nếu có token sẽ gọi getCurrentUser
- Nếu lỗi refresh user thì xoá token và logout

### 7.2 LanguageContext
- Quản lý vi/en
- Cung cấp hàm t(key)
- Lưu lựa chọn ngôn ngữ trong localStorage

## 8) Service/API matrix
### 8.1 authService.ts
- POST /auth/login
- POST /auth/signup
- GET /auth/me
- logout local (xoá token)

### 8.2 adminService.ts
- GET /admin/dashboard
- GET /admin/employees
- GET /admin/attendance/today
- GET /admin/leave-requests?status=
- PATCH /admin/leave-requests/:id
- GET /admin/attendance-settings
- PUT /admin/attendance-settings
- GET /admin/payroll-formula-settings
- PUT /admin/payroll-formula-settings

### 8.3 attendanceService.ts
- GET /attendance/current?employeeId=
- GET /attendance/history?employeeId=&startDate=&endDate=
- POST /attendance/clock-in
- POST /attendance/clock-out

### 8.4 employeeService.ts
- GET /employees/profile
- GET /employees/:id
- GET /employees/:id/leave-requests
- POST /employees/:id/leave-requests

### 8.5 payrollService.ts
- GET /payrolls
- GET /payrolls/employees
- POST /payrolls
- PUT /payrolls/:id
- POST /payrolls/:id/revise
- POST /payrolls/auto-calculate

### 8.6 notificationService.ts
- GET /notifications
- GET /notifications/:id
- PATCH /notifications/:id/read
- PATCH /notifications/read-all
- DELETE /notifications/:id

## 9) i18n và đa ngôn ngữ
- Dùng src/utils/i18n.ts để map key sang vi/en
- Header có nút đổi ngôn ngữ
- Dictionary khá đầy đủ cho nhóm nav, common, dashboard, integrations, payroll, settings...

## 10) Cấu hình môi trường và chạy local
Biến môi trường hiện có:
- VITE_API_URL=http://localhost:3000/api

Quy trình chạy:
1. cd adminSide
2. npm install
3. npm run dev
4. đảm bảo backend đang chạy ở cổng tương ứng

Build:
- npm run build
- npm run preview

## 11) Điểm mạnh hiện tại
- Kiến trúc rõ tầng: page/component/context/service
- Tách service theo domain tốt
- Đã có auth guard cơ bản
- Có i18n vi/en
- Có module payroll tương đối sâu (CRUD + auto-calc + revise)

## 12) Tồn tại, TODO, và rủi ro
Các TODO/placeholder quan sát được:
- Header: create request mới chỉ alert, search chưa implement
- Integrations: connect/disconnect chưa có logic thật
- Settings: update profile/change password còn TODO

Rủi ro chức năng:
- Chưa có RBAC rõ ràng dù user có role
- Một số trang thiên về hiển thị, chưa có full workflow backend
- Một số nơi dùng alert để báo lỗi/trạng thái, chưa đồng bộ UX

Rủi ro kỹ thuật:
- Chưa thấy lớp xử lý lỗi tập trung (error boundary/toast thống nhất)
- Dữ liệu realtime chưa rõ (phần lớn fetch theo lượt)

## 13) Danh sách file trọng tâm để chỉnh trong giai đoạn after.md
Ưu tiên theo tác động business:
1. src/components/Header.tsx
2. src/pages/Settings.tsx
3. src/pages/Integrations.tsx
4. src/contexts/AuthContext.tsx + route guard
5. src/services/* (chuẩn hoá contract với backend)
6. src/pages/Payroll.tsx (nâng UX và validation)

## 14) Đề xuất khung sửa tài liệu cho after.md
Khi chuyển sang after.md, nên bổ sung theo format:
1. Mục tiêu business đã đạt/chưa đạt theo từng module
2. API contract chuẩn hoá sau chỉnh sửa
3. Luồng phân quyền chi tiết theo role
4. Checklist QA theo từng page
5. Các thay đổi UI/UX chính và ảnh hưởng vận hành
6. Các chỉ số kỹ thuật (build, lỗi, coverage nếu có)

## 15) Kết luận hiện trạng
Folder adminSide đã có nền tảng tốt cho một admin portal quản lý nhân sự với các module cốt lõi (dashboard, attendance, leave, payroll, settings). Tuy nhiên để đạt mức production hoàn chỉnh cho nghiệp vụ quản trị nhân sự, cần ưu tiên hoàn thiện các TODO còn mở, chuẩn hoá phân quyền, và nối đầy đủ các luồng tích hợp/API còn dang dở.

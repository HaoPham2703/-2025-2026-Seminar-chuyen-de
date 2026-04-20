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

#### Usecase 3: Xin nghỉ & Điều chỉnh chấm công
- As an employee, I can gửi yêu cầu nghỉ phép (leave request) cho từng ngày/khung thời gian.
- As an employee, I can gửi yêu cầu điều chỉnh chấm công khi quên chấm hoặc sai giờ.
- As an employee, I can xem lại toàn bộ lịch sử các yêu cầu nghỉ/điều chỉnh và trạng thái duyệt.

#### Usecase 4: Mã QR cá nhân & chấm công bằng QR
- As an employee, I can xem mã QR định danh cá nhân để admin/manager quét khi vào/ra ca.
- As an admin, I can quét QR của nhân viên để ghi nhận attendance theo tenant.

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
- Contexts trong `src/contexts/` cho app-wide state management
- Utilities trong `src/utils/` cho validation, animations, i18n
- Sử dụng TypeScript cho type safety

## You have learned in the past

### Lesson 26: Fix buttons không tương tác được trong Dashboard (React Web)
- **Vấn đề**: Các buttons trong Dashboard (See All, Add, Checkbox, Calendar navigation, etc.) không hoạt động khi click
- **Root cause**: 
  - Thiếu `type="button"` → buttons trong form có thể trigger form submission
  - Thiếu `cursor-pointer` → không rõ ràng là có thể click
  - Event propagation có thể bị chặn
- **Solution**:
  - **Thêm `type="button"`** cho tất cả buttons để tránh form submission không mong muốn
  - **Thêm `cursor-pointer`** để hiển thị con trỏ chuột khi hover
  - **Thêm `e.stopPropagation()`** cho checkbox trong TasksCard để tránh event bubbling
  - **Thêm `console.log` với emoji 🔵** để debug dễ dàng
  - **Sử dụng `useNavigate()` từ react-router-dom** cho navigation buttons
  - **State management** với `useState` cho interactive elements (tabs, search, calendar)
- **Best practices**:
  - Luôn thêm `type="button"` cho buttons không phải submit button
  - Thêm `cursor-pointer` cho tất cả clickable elements
  - Sử dụng console.log với emoji để dễ debug
  - Test buttons trong browser console để xem handlers có được gọi không
- **Files updated**:
  - `adminSide/src/components/dashboard/*.tsx` - Tất cả dashboard cards
  - `adminSide/src/components/Header.tsx` - Header buttons

### Lesson 27: Admin Working Hours & Schedule Change Logs
- **Mục tiêu**: Cho phép admin cấu hình giờ làm việc chung của công ty và chuẩn bị hạ tầng cho giờ làm riêng từng nhân viên, kèm lịch sử thay đổi.
- **Giải pháp (Backend)**:
  - Thêm API cho tenant-level attendance settings:
    - `GET /api/admin/attendance-settings` - Lấy `workStartTime`, `workEndTime`, `breakDuration`, `lateThreshold`, `overtimeThreshold`.
    - `PUT /api/admin/attendance-settings` - Cập nhật các field trên.
  - Mỗi lần update, ghi log vào collection `attendanceSettingsLogs` với `before`, `after`, `changedBy`, `reason`, `changedAt`.
  - Tạo routes `Backend/routes/schedules.js` và mount ở `server.js`:
    - `GET /api/schedules?employeeId=` - Lấy schedules cho tenant, filter theo employee.
    - `POST /api/schedules` - Tạo schedule cho 1 employee, lưu log vào `scheduleChangeLogs`.
    - `PUT /api/schedules/:id` - Cập nhật schedule, ghi log before/after.
    - `GET /api/schedules/logs?employeeId=` - Lấy lịch sử thay đổi giờ làm từng người.
- **Giải pháp (adminSide)**:
  - Mở rộng `adminService`:
    - `getAttendanceSettings()` gọi `GET /admin/attendance-settings`.
    - `updateAttendanceSettings()` gọi `PUT /admin/attendance-settings`.
  - Cập nhật `Settings.tsx`:
    - Thêm tab **“Giờ làm việc công ty / Company Working Hours”**.
    - Form chỉnh: giờ vào (`workStartTime`), giờ ra (`workEndTime`), thời gian nghỉ (`breakDuration`), ngưỡng đi trễ (`lateThreshold`), ngưỡng tăng ca (`overtimeThreshold`).
    - Load giá trị từ API khi mở Settings, lưu thay đổi qua `updateAttendanceSettings()`, hiển thị thông báo thành công/thất bại.
  - Cập nhật `i18n.ts` để hỗ trợ full vi/en cho tất cả label liên quan.
- **Best practices**:
  - Khi thay đổi các config quan trọng (giờ làm, policy chấm công), luôn có collection log riêng với before/after để audit.
  - Phân tách rõ:
    - **Tenant settings** (áp dụng mặc định cho toàn công ty).
    - **Employee schedules** (override ở mức cá nhân).
  - FE chỉ cần gọi 1 API cho config chung, không hardcode vào giao diện.

### Lesson 25: Tích hợp i18n (English/Vietnamese) vào adminSide
- **Mục đích**: Hỗ trợ đa ngôn ngữ cho admin dashboard
- **Giải pháp**:
  - Tạo `src/utils/i18n.ts` với translations cho cả English và Vietnamese
  - Tạo `LanguageContext` để quản lý ngôn ngữ hiện tại và lưu vào localStorage
  - Thêm language switcher (Globe icon) vào Header
  - Cập nhật tất cả components (Header, Sidebar, Login, Signup) để sử dụng `t()` function
  - Translations bao gồm: navigation, common terms, auth pages, dashboard cards
- **Cách sử dụng**: Click vào Globe icon trong Header để chuyển đổi giữa English và Vietnamese
- **Lưu ý**: Language preference được lưu trong localStorage và tự động load khi reload page

### Lesson 24: Tích hợp Swagger/OpenAPI vào Backend
- **Mục đích**: Tạo API documentation tự động với Swagger UI
- **Giải pháp**:
  - Cài đặt `swagger-jsdoc` và `swagger-ui-express`
  - Tạo file `Backend/config/swagger.js` với cấu hình OpenAPI 3.0
  - Tích hợp Swagger UI vào `server.js` tại route `/api-docs`
  - Thêm JSDoc comments vào các routes để tự động generate documentation
  - Định nghĩa schemas trong swagger config (User, LoginRequest, LoginResponse, Error, Success)
  - Thêm security scheme cho JWT Bearer authentication
- **Cách sử dụng**: Truy cập `http://localhost:3000/api-docs` để xem API documentation
- **Lưu ý**: Cần thêm JSDoc comments cho tất cả endpoints để có documentation đầy đủ

### Bug 23: Tailwind CSS v4 PostCSS Plugin Error
- **Error description**: `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package`
- **Root cause**: Tailwind CSS v4 đã tách PostCSS plugin ra package riêng `@tailwindcss/postcss`
- **Solution**: 
  - Cài đặt `@tailwindcss/postcss`: `npm install -D @tailwindcss/postcss`
  - Cập nhật `postcss.config.js`: thay `tailwindcss: {}` thành `'@tailwindcss/postcss': {}`
  - Vẫn giữ `@import "tailwindcss"` trong CSS file

### Lesson 22: Test nhanh API trên Windows (tránh lỗi quote PowerShell)
- **Triệu chứng**: PowerShell `Invoke-RestMethod` dễ lỗi parse/quote khi chạy inline command dài (đặc biệt có `$`, `@`, JSON).
- **Giải pháp**: Dùng Node fetch để test API nhanh, in ra `status` + response body.
  - Ví dụ:
    - `node -e "(async()=>{ const res=await fetch('http://localhost:3000/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'Test',lastName:'User',email:'test'+Date.now()+'@abccafe.com',phone:'0901234567',password:'Abcdefg1'})}); console.log('status',res.status); console.log(await res.text()); })().catch(console.error)"`.

### Lesson 19: Hiển thị QR trong Expo (Employee QR)
- **Triệu chứng**: Màn QR chỉ hiện fallback text (không render QR).
- **Giải pháp**:
  - Cài `react-native-qrcode-svg` (Expo) và đảm bảo `react-native-svg` đúng version tương thích.
  - Import trực tiếp `QRCode` từ `react-native-qrcode-svg` để render QR ổn định.

### Lesson 20: Tích hợp Theme và i18n vào SettingsScreen
- **Vấn đề**: SettingsScreen có toggle theme/language nhưng không hoạt động - UI không đổi theme và text không đổi ngôn ngữ.
- **Giải pháp**:
  - Tích hợp `useSettings()` hook để lấy `currentTheme` và `settings.language`.
  - Tạo `getThemeColors()` function để trả về màu sắc động dựa trên `currentTheme` (dark/light).
  - Sử dụng `t()` function từ `i18n.ts` để translate tất cả text trong SettingsScreen.
  - Sử dụng `getLanguage()` để hiển thị text động cho các phần chưa có translation key.
  - Áp dụng `themeColors` vào tất cả components (SettingItem, ThemeOption, LanguageOption).
  - Thêm `forceUpdate` state để force re-render khi language thay đổi (đảm bảo translations được cập nhật ngay).
  - Theme được áp dụng ngay lập tức khi user toggle (optimistic update + context sync).
  - Language được áp dụng ngay lập tức qua `setLanguage()` trong SettingsContext.

### Lesson 21: Áp dụng Dark Mode cho tất cả các tab
- **Vấn đề**: Dark mode chỉ hoạt động ở SettingsScreen, các tab khác (Home, Profile, Attendance) vẫn dùng màu sắc hardcoded.
- **Giải pháp**:
  - Tạo `useTheme()` hook trong `Frontend/src/hooks/use-theme.ts` để cung cấp theme colors cho tất cả components.
  - Hook trả về `colors` object với các màu sắc động dựa trên `currentTheme` từ SettingsContext.
  - Áp dụng theme vào Home screen (Index.tsx): container background, text colors, icon colors, button colors.
  - Áp dụng theme vào Profile screen: avatar, cards, menu items, stat cards, text colors.
  - Áp dụng theme vào Attendance screen: container background, header, loading indicator, text colors.
  - Loại bỏ hardcoded HSL colors trong styles và thay bằng dynamic colors từ theme.
  - Theme tự động cập nhật khi user thay đổi trong Settings (do SettingsContext cung cấp `currentTheme`).

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

### Bug 7: Clock In không hoạt động do API base URL hardcode sai IP
- **Error description**: Bấm Clock In không chạy / báo Network request failed (mobile/emulator)
- **Root cause**: `Frontend/src/services/api.ts` hardcode `http://192.168.1.6:3000/api` không đúng máy hiện tại
- **Solution**:
  - Ưu tiên cấu hình `.env` qua `EXPO_PUBLIC_API_URL`
  - Android emulator dùng `http://10.0.2.2:3000/api`
  - Có thể auto-detect IP từ Expo `hostUri` (khi dev)
  - Fallback có warning rõ ràng để tránh “bấm không được” mà không biết lý do

### Bug 8: Tổng giờ hiển thị âm sau clock-out nhanh (ví dụ `-1:-58`)
- **Error description**: Clock-in và clock-out cách nhau vài phút, mục “Giờ/Tổng giờ” hiển thị giá trị âm như `-1:-58`.
- **Root cause**: Backend tính `netWorkMinutes = workDurationMinutes - breakDuration` với `breakDuration` mặc định 60 phút → nếu làm < 60 phút thì ra số âm.
- **Solution**: Clamp về 0 trước khi lưu/trả về: `Math.max(0, workDurationMinutes - breakDuration)`.

### Lesson 11: Gán QR Code cho toàn bộ nhân viên
- **Pattern**: Tạo script Node.js trong `Backend/scripts/assign-employee-qrcodes.js` sử dụng `connectDatabase()` / `getDatabase()` để cập nhật batch.
- **Quy ước mã**: `EMP-<employeeId || _id>`, chỉ gán cho employee chưa có `qrCode.code` (không ghi đè).
- **Cách chạy**: `cd Backend && npm run assign-employee-qrcodes`.

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
  - `src/components/` - Business logic components (Profile, EditProfileModal, SettingsScreen)
  - `components/` - Shared UI components
- **Contexts**: `src/contexts/` - React Contexts cho app-wide state (SettingsContext)
- **Services**: `src/services/` - API service layer
- **Utils**: `src/utils/` - Utility functions (validation, animations, i18n)
- **Scripts**: `Backend/scripts/` - Utility scripts (update-ip, assign-employee-qrcodes)
- **Documentation**: 
  - `database-design.md` - Database design documentation
  - `README.md` - Hướng dẫn chạy project
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

### Bug 10: Notification Modal không hiện lại khi quay lại tab
- **Error description**: Khi đọc notification ở tab Updates, sau đó chuyển tab và quay lại, popup không hiện nữa mặc dù vẫn có thông báo chưa đọc
- **Root cause**: 
  - Updates tab sử dụng `NotificationCenter` như một Modal với state `showNotifications`
  - Khi user đóng modal (set `showNotifications = false`), state này được lưu
  - Khi quay lại tab, modal không tự động mở lại vì state vẫn là `false`
- **Solution**: 
  - Sửa Updates tab để hiển thị notifications trực tiếp như một danh sách, không dùng Modal
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - NotificationCenter component vẫn giữ Modal version để có thể dùng cho popup ở nơi khác nếu cần

### Bug 11: Notification vẫn hiển thị "chưa đọc" sau khi mark as read
- **Error description**: Khi bấm vào notification để xem chi tiết, badge "chưa đọc" vẫn hiển thị mặc dù đã mark as read
- **Root cause**: 
  - Notification có nhiều recipients, mỗi recipient có trạng thái `read` riêng trong `recipients` array
  - Backend cập nhật đúng `recipients[].read = true` cho employee hiện tại
  - Frontend không refresh notifications từ server sau khi mark as read, chỉ cập nhật local state
  - Local state không sync với database
  - Backend query có thể trả về notification với `read: true` do race condition hoặc query không đúng
- **Solution**: 
  - Sửa `markNotificationAsRead` và `markAllNotificationsAsRead` để gọi `refreshNotifications()` sau khi mark as read
  - Bỏ cập nhật local state thủ công, dùng data từ server sau khi refresh
  - `refreshNotifications()` tự động cập nhật cả `notifications` và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - Sửa backend query để hỗ trợ filter theo `unreadOnly=true/false`
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Thêm logging chi tiết để debug query và response

### Bug 12: Notification unreadCount không chính xác sau khi mark all as read
- **Error description**: Sau khi bấm "Đọc tất cả", badge vẫn hiển thị số lượng unread (ví dụ "2/2 chưa đọc") mặc dù tất cả notifications đã được mark as read
- **Root cause**: 
  - Backend tính `unreadCount` từ query riêng (database) nhưng có thể không đồng bộ với notifications trong response
  - Có thể có notifications khác trong database chưa đọc nhưng không có trong response (do pagination)
  - Logic tính `unreadCount` không nhất quán giữa query và response
- **Solution**: 
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Query database để đếm tất cả notifications có `recipients[].read: false` cho employee hiện tại
  - Đảm bảo `unreadCount` luôn phản ánh đúng số lượng unread trong database
  - Thêm logging để debug và so sánh `unreadCount` từ database và response

### Bug 9: Phải đổi IP trong .env mỗi khi đổi mạng
- **Error description**: Mỗi khi đổi mạng (WiFi khác, mobile hotspot), phải thủ công cập nhật IP trong file `.env`
- **Root cause**: 
  - IP address trong `EXPO_PUBLIC_API_URL` bị hardcode trong `.env`
  - Khi đổi mạng, IP address của máy thay đổi nhưng `.env` không tự động cập nhật
- **Solution**: 
  - Tạo script `Backend/scripts/update-ip.js` để tự động detect IP từ network interfaces
  - Script tự động tìm IPv4 address phù hợp (ưu tiên WiFi/Ethernet, loại bỏ loopback)
  - Tự động cập nhật `EXPO_PUBLIC_API_URL` trong file `.env`
  - Thêm npm script `npm run update-ip` để chạy dễ dàng
  - **Cách sử dụng**: Mỗi khi đổi mạng, chạy `cd Backend && npm run update-ip` để tự động cập nhật IP

### Lesson 12: Form Validation với Regex và Error Messages
- **Pattern**: Tạo validation utilities với regex patterns cho email, password, phone, name
- **File**: `Frontend/src/utils/validation.ts`
- **Features**:
  - Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Password validation: min 8 chars, uppercase, lowercase, number
  - Phone validation: Vietnamese format `(0|\+84)[0-9]{9,10}`
  - Name validation: Vietnamese names with accents, 2-50 chars
- **Error Display**: 
  - Hiển thị error messages màu đỏ dưới input
  - Tự động clear error khi user sửa
  - Validate on blur (khi rời khỏi input)
- **Best Practice**: Tách validation logic ra utility file để reuse

### Lesson 13: Animation Utilities với react-native-reanimated
- **Pattern**: Tạo reusable animation hooks trong `Frontend/src/utils/animations.ts`
- **Animations**:
  - `useShakeAnimation()`: Shake input khi có lỗi (translateX sequence)
  - `useFadeInAnimation(isVisible)`: Fade in error messages với translateY
  - `useSlideUpAnimation(delay)`: Slide up form elements với delay
  - `usePulseAnimation()`: Pulse animation cho logo
  - `useButtonPressAnimation()`: Scale animation cho buttons khi press
- **Implementation**: 
  - Sử dụng `useSharedValue` và `useAnimatedStyle` từ react-native-reanimated
  - Delay animation với `useEffect` và `setTimeout` (cleanup properly)
  - Tất cả animations dùng `useNativeDriver: true` cho performance

### Lesson 14: Profile Screen với Load Data từ API
- **Pattern**: Load employee profile data từ API như Home screen
- **Implementation**:
  - Sử dụng `getEmployeeProfile()` từ `employeeService`
  - Load data trong `useEffect` khi component mount
  - Hiển thị loading state với `ActivityIndicator`
  - Error handling với user-friendly messages
  - Display: fullName, email, role, employeeId, statistics từ database
- **Statistics**: Hiển thị thống kê thực từ database (totalWorkingDays, totalHours, onTimeRate)

### Lesson 15: Edit Profile Modal với Validation
- **Pattern**: Modal component để edit profile với form validation
- **File**: `Frontend/src/components/EditProfileModal.tsx`
- **Features**:
  - Form với các trường: firstName, lastName, phone, dateOfBirth, gender, address, emergencyContact
  - Validation với regex (firstName, lastName, phone)
  - Shake animation khi validation fail
  - Fade in error messages
  - Loading state khi save
- **API**: `PUT /api/employees/profile` để update profile
- **Backend**: Cập nhật nested fields trong MongoDB với dot notation (`personalInfo.firstName`)

### Lesson 16: Settings Screen với Context API
- **Pattern**: Sử dụng React Context để quản lý app-wide settings
- **Files**: 
  - `Frontend/src/contexts/SettingsContext.tsx` - Settings provider
  - `Frontend/src/components/SettingsScreen.tsx` - Settings UI
- **Settings**:
  - **Notifications**: enabled, clockInReminder, attendanceSummary
  - **Theme**: light, dark, auto (theo system)
  - **Language**: vi, en
  - **Privacy**: showEmail, showPhone
- **Storage**: Lưu vào AsyncStorage với key `@dacn_app_settings`
- **Auto-apply**: Settings được áp dụng tự động khi thay đổi

### Lesson 18: Real-time Notifications với Socket.IO
- **Pattern**: WebSocket/Socket.IO cho real-time notifications từ admin đến employees
- **Backend**:
  - Socket.IO server với JWT authentication middleware
  - Notification routes: send (admin), get, mark as read, delete
  - Database schema: notifications collection với recipients array
  - Real-time emit: `io.to('user:userId').emit('new_notification', data)`
- **Frontend**:
  - NotificationContext với Socket.IO client connection
  - Auto-connect khi có auth token
  - Listen event `new_notification` và auto-refresh
  - NotificationCenter, NotificationItem, NotificationBadge components
- **Integration**:
  - NotificationBadge hiển thị trên Profile screen và tab navigation
  - Updates tab hiển thị notifications trực tiếp (không dùng Modal)
- **UI Pattern**:
  - Updates tab (`Frontend/app/(tabs)/updates.tsx`) hiển thị notifications như một danh sách trực tiếp
  - Không dùng Modal để tránh vấn đề: khi đóng modal, quay lại tab thì không hiện nữa
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - Khi bấm vào notification, navigate đến trang chi tiết (`/notification/[id]`)
  - **Pull-to-refresh**: Thêm `RefreshControl` vào ScrollView để kéo từ trên xuống reload notifications
- **Notification Detail Page**:
  - Tạo trang chi tiết notification tại `Frontend/app/notification/[id].tsx`
  - Hiển thị đầy đủ thông tin: icon, type, priority, title, message, metadata, timestamps
  - Tự động đánh dấu đã đọc khi mở trang chi tiết
  - Có nút xóa notification
  - Sử dụng dynamic route với `[id]` trong Expo Router
  - Cần thêm route vào Stack trong `_layout.tsx`
  - Giao diện được cải thiện: background trắng, icon lớn hơn với shadow, badges đẹp hơn, card layout
- **Two-Tab System (Chưa đọc / Đã đọc)**:
  - Updates tab có 2 tab: "Chưa đọc" (mặc định) và "Đã đọc"
  - Mỗi tab query notifications khác nhau:
    - Tab "Chưa đọc": query với `unreadOnly=true` (chỉ lấy notifications có `read: false`)
    - Tab "Đã đọc": query với `unreadOnly=false` và filter `read: true` ở frontend
  - State management: `activeTab` state để track tab hiện tại
  - Auto-refresh khi chuyển tab
  - Badge hiển thị số lượng unread chỉ ở tab "Chưa đọc"
  - Nút "Đọc tất cả" chỉ hiển thị ở tab "Chưa đọc"
- **Read Status Management**:
  - **KHÔNG xóa recipient** khi mark as read, chỉ cập nhật `read: true` và `readAt`
  - Recipient vẫn tồn tại trong array `recipients`, chỉ thay đổi trạng thái `read`
  - Notification vẫn tồn tại cho tất cả recipients, mỗi recipient có trạng thái `read` riêng
  - Backend query hỗ trợ filter theo `unreadOnly=true/false` để lấy notifications chưa đọc hoặc tất cả
  - `unreadCount` được tính từ database (tất cả notifications, không chỉ trong response)
- **Data Sync Pattern**:
  - Sau khi mark as read (single hoặc all), phải gọi `refreshNotifications()` để lấy data mới từ server
  - Không cập nhật local state thủ công, dùng data từ server để đảm bảo sync với database
  - `refreshNotifications()` tự động cập nhật cả `notifications` array và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - `refreshNotifications()` nhận parameter `unreadOnly?: boolean` để query theo tab
- **Files**:
  - `Backend/config/socket.js` - Socket.IO initialization
  - `Backend/routes/notifications.js` - Notification API routes với query support `unreadOnly`
  - `Frontend/src/contexts/NotificationContext.tsx` - Socket.IO client và state, `refreshNotifications(unreadOnly?)`
  - `Frontend/src/services/notificationService.ts` - API service với `unreadOnly` parameter
  - `Frontend/src/components/NotificationCenter.tsx` - Notification list UI (Modal version, có thể dùng cho popup)
  - `Frontend/src/components/NotificationItem.tsx` - Single notification item
  - `Frontend/src/components/NotificationBadge.tsx` - Unread count badge
  - `Frontend/app/(tabs)/updates.tsx` - Updates tab với 2 tabs (Chưa đọc/Đã đọc), pull-to-refresh
  - `Frontend/app/notification/[id].tsx` - Notification detail page với dynamic route

### Lesson 17: Settings Context và App-wide State Management
- **Pattern**: Context API cho app-wide state management
- **Implementation**:
  - `SettingsProvider` wrap toàn bộ app trong `_layout.tsx`
  - `useSettings()` hook để access settings từ bất kỳ component nào
  - Auto-load settings từ AsyncStorage khi app start
  - Auto-apply theme vào ThemeProvider
  - Auto-apply language với i18n utility
  - Setup notifications với expo-notifications (dynamic import để tránh lỗi nếu chưa cài)
- **Theme Integration**: 
  - `currentTheme` được tính từ settings và system colorScheme
  - Áp dụng vào `ThemeProvider` và `StatusBar`
- **Privacy Integration**: 
  - Áp dụng privacy settings vào Profile component
  - Ẩn/hiện email và phone dựa trên `privacy.showEmail` và `privacy.showPhone`

### Lesson 31: Payroll Edit/Revise với audit log (Admin)
- **Mục tiêu**:
  - Không cho sửa trực tiếp phiếu `APPROVED`.
  - Chỉ cho sửa trực tiếp khi phiếu đang `DRAFT/PENDING`.
  - Với phiếu `APPROVED`, dùng luồng **Revise** tạo phiên bản mới + lưu audit log.

- **Backend (`Backend/routes/payrolls.js`)**:
  1. **Mở rộng dữ liệu payroll** khi tạo mới (`POST /api/payrolls`):
     - Thêm metadata revision: `revisionOf`, `revisedFrom`, `revisedAt`, `revisedBy`, `reviseReason`, `isSuperseded`, `supersededBy`, `updatedAt`, `updatedBy`.
     - Ghi audit `CREATE` vào collection `payroll_audits`.
  2. **Thêm API update trực tiếp** `PUT /api/payrolls/:id`:
     - Chỉ cho phép nếu trạng thái hiện tại của phiếu là `DRAFT` hoặc `PENDING`.
     - Nếu là `APPROVED` trả lỗi: `Only DRAFT/PENDING payroll can be edited directly`.
     - Tự tính lại `allowancesTotal`, `deductionsTotal`, `netSalary`.
     - Ghi audit `UPDATE` với `previousValues` và `nextValues`.
  3. **Thêm API revise** `POST /api/payrolls/:id/revise`:
     - Chỉ cho phép với phiếu nguồn `APPROVED`.
     - Bắt buộc `reason` (lý do điều chỉnh).
     - Tạo phiếu mới (revision) thay vì sửa phiếu cũ.
     - Đánh dấu phiếu cũ `isSuperseded = true`, `supersededBy = <newPayrollId>`.
     - Ghi 2 audit records:
       - `REVISE_SOURCE` (phiếu cũ bị thay thế)
       - `REVISE_CREATE` (phiếu revision mới)

- **Admin service (`adminSide/src/services/payrollService.ts`)**:
  - Thêm types:
    - `UpdatePayrollRequest`
    - `RevisePayrollRequest`
  - Thêm API methods:
    - `updatePayroll(id, data)` → gọi `PUT /payrolls/:id`
    - `revisePayroll(id, data)` → gọi `POST /payrolls/:id/revise`
  - Mở rộng `Payroll` type với fields revision/superseded.

- **Admin UI (`adminSide/src/pages/Payroll.tsx`)**:
  - Bổ sung mode modal: `create | edit | revise`.
  - Thêm cột **Hành động** trong bảng payroll:
    - Phiếu `DRAFT/PENDING`: nút **Sửa**.
    - Phiếu `APPROVED` (chưa superseded): nút **Điều chỉnh**.
    - Phiếu đã superseded: hiển thị “Đã được điều chỉnh”.
  - Luồng submit theo mode:
    - `create` → `createPayroll`
    - `edit` → `updatePayroll`
    - `revise` → `revisePayroll` (bắt buộc nhập lý do)
  - Modal prefill dữ liệu từ phiếu được chọn, có preview thực nhận.

- **Business rule đã enforce**:
  - `APPROVED` không chỉnh trực tiếp.
  - Muốn đổi `APPROVED` phải revise, có lý do và audit trail.

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

#### Usecase 3: Xin nghỉ & Điều chỉnh chấm công
- As an employee, I can gửi yêu cầu nghỉ phép (leave request) cho từng ngày/khung thời gian.
- As an employee, I can gửi yêu cầu điều chỉnh chấm công khi quên chấm hoặc sai giờ.
- As an employee, I can xem lại toàn bộ lịch sử các yêu cầu nghỉ/điều chỉnh và trạng thái duyệt.

#### Usecase 4: Mã QR cá nhân & chấm công bằng QR
- As an employee, I can xem mã QR định danh cá nhân để admin/manager quét khi vào/ra ca.
- As an admin, I can quét QR của nhân viên để ghi nhận attendance theo tenant.

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
- Contexts trong `src/contexts/` cho app-wide state management
- Utilities trong `src/utils/` cho validation, animations, i18n
- Sử dụng TypeScript cho type safety

## You have learned in the past

### Lesson 26: Fix buttons không tương tác được trong Dashboard (React Web)
- **Vấn đề**: Các buttons trong Dashboard (See All, Add, Checkbox, Calendar navigation, etc.) không hoạt động khi click
- **Root cause**: 
  - Thiếu `type="button"` → buttons trong form có thể trigger form submission
  - Thiếu `cursor-pointer` → không rõ ràng là có thể click
  - Event propagation có thể bị chặn
- **Solution**:
  - **Thêm `type="button"`** cho tất cả buttons để tránh form submission không mong muốn
  - **Thêm `cursor-pointer`** để hiển thị con trỏ chuột khi hover
  - **Thêm `e.stopPropagation()`** cho checkbox trong TasksCard để tránh event bubbling
  - **Thêm `console.log` với emoji 🔵** để debug dễ dàng
  - **Sử dụng `useNavigate()` từ react-router-dom** cho navigation buttons
  - **State management** với `useState` cho interactive elements (tabs, search, calendar)
- **Best practices**:
  - Luôn thêm `type="button"` cho buttons không phải submit button
  - Thêm `cursor-pointer` cho tất cả clickable elements
  - Sử dụng console.log với emoji để dễ debug
  - Test buttons trong browser console để xem handlers có được gọi không
- **Files updated**:
  - `adminSide/src/components/dashboard/*.tsx` - Tất cả dashboard cards
  - `adminSide/src/components/Header.tsx` - Header buttons

### Lesson 27: Admin Working Hours & Schedule Change Logs
- **Mục tiêu**: Cho phép admin cấu hình giờ làm việc chung của công ty và chuẩn bị hạ tầng cho giờ làm riêng từng nhân viên, kèm lịch sử thay đổi.
- **Giải pháp (Backend)**:
  - Thêm API cho tenant-level attendance settings:
    - `GET /api/admin/attendance-settings` - Lấy `workStartTime`, `workEndTime`, `breakDuration`, `lateThreshold`, `overtimeThreshold`.
    - `PUT /api/admin/attendance-settings` - Cập nhật các field trên.
  - Mỗi lần update, ghi log vào collection `attendanceSettingsLogs` với `before`, `after`, `changedBy`, `reason`, `changedAt`.
  - Tạo routes `Backend/routes/schedules.js` và mount ở `server.js`:
    - `GET /api/schedules?employeeId=` - Lấy schedules cho tenant, filter theo employee.
    - `POST /api/schedules` - Tạo schedule cho 1 employee, lưu log vào `scheduleChangeLogs`.
    - `PUT /api/schedules/:id` - Cập nhật schedule, ghi log before/after.
    - `GET /api/schedules/logs?employeeId=` - Lấy lịch sử thay đổi giờ làm từng người.
- **Giải pháp (adminSide)**:
  - Mở rộng `adminService`:
    - `getAttendanceSettings()` gọi `GET /admin/attendance-settings`.
    - `updateAttendanceSettings()` gọi `PUT /admin/attendance-settings`.
  - Cập nhật `Settings.tsx`:
    - Thêm tab **“Giờ làm việc công ty / Company Working Hours”**.
    - Form chỉnh: giờ vào (`workStartTime`), giờ ra (`workEndTime`), thời gian nghỉ (`breakDuration`), ngưỡng đi trễ (`lateThreshold`), ngưỡng tăng ca (`overtimeThreshold`).
    - Load giá trị từ API khi mở Settings, lưu thay đổi qua `updateAttendanceSettings()`, hiển thị thông báo thành công/thất bại.
  - Cập nhật `i18n.ts` để hỗ trợ full vi/en cho tất cả label liên quan.
- **Best practices**:
  - Khi thay đổi các config quan trọng (giờ làm, policy chấm công), luôn có collection log riêng với before/after để audit.
  - Phân tách rõ:
    - **Tenant settings** (áp dụng mặc định cho toàn công ty).
    - **Employee schedules** (override ở mức cá nhân).
  - FE chỉ cần gọi 1 API cho config chung, không hardcode vào giao diện.

### Lesson 25: Tích hợp i18n (English/Vietnamese) vào adminSide
- **Mục đích**: Hỗ trợ đa ngôn ngữ cho admin dashboard
- **Giải pháp**:
  - Tạo `src/utils/i18n.ts` với translations cho cả English và Vietnamese
  - Tạo `LanguageContext` để quản lý ngôn ngữ hiện tại và lưu vào localStorage
  - Thêm language switcher (Globe icon) vào Header
  - Cập nhật tất cả components (Header, Sidebar, Login, Signup) để sử dụng `t()` function
  - Translations bao gồm: navigation, common terms, auth pages, dashboard cards
- **Cách sử dụng**: Click vào Globe icon trong Header để chuyển đổi giữa English và Vietnamese
- **Lưu ý**: Language preference được lưu trong localStorage và tự động load khi reload page

### Lesson 24: Tích hợp Swagger/OpenAPI vào Backend
- **Mục đích**: Tạo API documentation tự động với Swagger UI
- **Giải pháp**:
  - Cài đặt `swagger-jsdoc` và `swagger-ui-express`
  - Tạo file `Backend/config/swagger.js` với cấu hình OpenAPI 3.0
  - Tích hợp Swagger UI vào `server.js` tại route `/api-docs`
  - Thêm JSDoc comments vào các routes để tự động generate documentation
  - Định nghĩa schemas trong swagger config (User, LoginRequest, LoginResponse, Error, Success)
  - Thêm security scheme cho JWT Bearer authentication
- **Cách sử dụng**: Truy cập `http://localhost:3000/api-docs` để xem API documentation
- **Lưu ý**: Cần thêm JSDoc comments cho tất cả endpoints để có documentation đầy đủ

### Bug 23: Tailwind CSS v4 PostCSS Plugin Error
- **Error description**: `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package`
- **Root cause**: Tailwind CSS v4 đã tách PostCSS plugin ra package riêng `@tailwindcss/postcss`
- **Solution**: 
  - Cài đặt `@tailwindcss/postcss`: `npm install -D @tailwindcss/postcss`
  - Cập nhật `postcss.config.js`: thay `tailwindcss: {}` thành `'@tailwindcss/postcss': {}`
  - Vẫn giữ `@import "tailwindcss"` trong CSS file

### Lesson 22: Test nhanh API trên Windows (tránh lỗi quote PowerShell)
- **Triệu chứng**: PowerShell `Invoke-RestMethod` dễ lỗi parse/quote khi chạy inline command dài (đặc biệt có `# Lessons

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

#### Usecase 3: Xin nghỉ & Điều chỉnh chấm công
- As an employee, I can gửi yêu cầu nghỉ phép (leave request) cho từng ngày/khung thời gian.
- As an employee, I can gửi yêu cầu điều chỉnh chấm công khi quên chấm hoặc sai giờ.
- As an employee, I can xem lại toàn bộ lịch sử các yêu cầu nghỉ/điều chỉnh và trạng thái duyệt.

#### Usecase 4: Mã QR cá nhân & chấm công bằng QR
- As an employee, I can xem mã QR định danh cá nhân để admin/manager quét khi vào/ra ca.
- As an admin, I can quét QR của nhân viên để ghi nhận attendance theo tenant.

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
- Contexts trong `src/contexts/` cho app-wide state management
- Utilities trong `src/utils/` cho validation, animations, i18n
- Sử dụng TypeScript cho type safety

## You have learned in the past

### Lesson 26: Fix buttons không tương tác được trong Dashboard (React Web)
- **Vấn đề**: Các buttons trong Dashboard (See All, Add, Checkbox, Calendar navigation, etc.) không hoạt động khi click
- **Root cause**: 
  - Thiếu `type="button"` → buttons trong form có thể trigger form submission
  - Thiếu `cursor-pointer` → không rõ ràng là có thể click
  - Event propagation có thể bị chặn
- **Solution**:
  - **Thêm `type="button"`** cho tất cả buttons để tránh form submission không mong muốn
  - **Thêm `cursor-pointer`** để hiển thị con trỏ chuột khi hover
  - **Thêm `e.stopPropagation()`** cho checkbox trong TasksCard để tránh event bubbling
  - **Thêm `console.log` với emoji 🔵** để debug dễ dàng
  - **Sử dụng `useNavigate()` từ react-router-dom** cho navigation buttons
  - **State management** với `useState` cho interactive elements (tabs, search, calendar)
- **Best practices**:
  - Luôn thêm `type="button"` cho buttons không phải submit button
  - Thêm `cursor-pointer` cho tất cả clickable elements
  - Sử dụng console.log với emoji để dễ debug
  - Test buttons trong browser console để xem handlers có được gọi không
- **Files updated**:
  - `adminSide/src/components/dashboard/*.tsx` - Tất cả dashboard cards
  - `adminSide/src/components/Header.tsx` - Header buttons

### Lesson 27: Admin Working Hours & Schedule Change Logs
- **Mục tiêu**: Cho phép admin cấu hình giờ làm việc chung của công ty và chuẩn bị hạ tầng cho giờ làm riêng từng nhân viên, kèm lịch sử thay đổi.
- **Giải pháp (Backend)**:
  - Thêm API cho tenant-level attendance settings:
    - `GET /api/admin/attendance-settings` - Lấy `workStartTime`, `workEndTime`, `breakDuration`, `lateThreshold`, `overtimeThreshold`.
    - `PUT /api/admin/attendance-settings` - Cập nhật các field trên.
  - Mỗi lần update, ghi log vào collection `attendanceSettingsLogs` với `before`, `after`, `changedBy`, `reason`, `changedAt`.
  - Tạo routes `Backend/routes/schedules.js` và mount ở `server.js`:
    - `GET /api/schedules?employeeId=` - Lấy schedules cho tenant, filter theo employee.
    - `POST /api/schedules` - Tạo schedule cho 1 employee, lưu log vào `scheduleChangeLogs`.
    - `PUT /api/schedules/:id` - Cập nhật schedule, ghi log before/after.
    - `GET /api/schedules/logs?employeeId=` - Lấy lịch sử thay đổi giờ làm từng người.
- **Giải pháp (adminSide)**:
  - Mở rộng `adminService`:
    - `getAttendanceSettings()` gọi `GET /admin/attendance-settings`.
    - `updateAttendanceSettings()` gọi `PUT /admin/attendance-settings`.
  - Cập nhật `Settings.tsx`:
    - Thêm tab **“Giờ làm việc công ty / Company Working Hours”**.
    - Form chỉnh: giờ vào (`workStartTime`), giờ ra (`workEndTime`), thời gian nghỉ (`breakDuration`), ngưỡng đi trễ (`lateThreshold`), ngưỡng tăng ca (`overtimeThreshold`).
    - Load giá trị từ API khi mở Settings, lưu thay đổi qua `updateAttendanceSettings()`, hiển thị thông báo thành công/thất bại.
  - Cập nhật `i18n.ts` để hỗ trợ full vi/en cho tất cả label liên quan.
- **Best practices**:
  - Khi thay đổi các config quan trọng (giờ làm, policy chấm công), luôn có collection log riêng với before/after để audit.
  - Phân tách rõ:
    - **Tenant settings** (áp dụng mặc định cho toàn công ty).
    - **Employee schedules** (override ở mức cá nhân).
  - FE chỉ cần gọi 1 API cho config chung, không hardcode vào giao diện.

### Lesson 25: Tích hợp i18n (English/Vietnamese) vào adminSide
- **Mục đích**: Hỗ trợ đa ngôn ngữ cho admin dashboard
- **Giải pháp**:
  - Tạo `src/utils/i18n.ts` với translations cho cả English và Vietnamese
  - Tạo `LanguageContext` để quản lý ngôn ngữ hiện tại và lưu vào localStorage
  - Thêm language switcher (Globe icon) vào Header
  - Cập nhật tất cả components (Header, Sidebar, Login, Signup) để sử dụng `t()` function
  - Translations bao gồm: navigation, common terms, auth pages, dashboard cards
- **Cách sử dụng**: Click vào Globe icon trong Header để chuyển đổi giữa English và Vietnamese
- **Lưu ý**: Language preference được lưu trong localStorage và tự động load khi reload page

### Lesson 24: Tích hợp Swagger/OpenAPI vào Backend
- **Mục đích**: Tạo API documentation tự động với Swagger UI
- **Giải pháp**:
  - Cài đặt `swagger-jsdoc` và `swagger-ui-express`
  - Tạo file `Backend/config/swagger.js` với cấu hình OpenAPI 3.0
  - Tích hợp Swagger UI vào `server.js` tại route `/api-docs`
  - Thêm JSDoc comments vào các routes để tự động generate documentation
  - Định nghĩa schemas trong swagger config (User, LoginRequest, LoginResponse, Error, Success)
  - Thêm security scheme cho JWT Bearer authentication
- **Cách sử dụng**: Truy cập `http://localhost:3000/api-docs` để xem API documentation
- **Lưu ý**: Cần thêm JSDoc comments cho tất cả endpoints để có documentation đầy đủ

### Bug 23: Tailwind CSS v4 PostCSS Plugin Error
- **Error description**: `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package`
- **Root cause**: Tailwind CSS v4 đã tách PostCSS plugin ra package riêng `@tailwindcss/postcss`
- **Solution**: 
  - Cài đặt `@tailwindcss/postcss`: `npm install -D @tailwindcss/postcss`
  - Cập nhật `postcss.config.js`: thay `tailwindcss: {}` thành `'@tailwindcss/postcss': {}`
  - Vẫn giữ `@import "tailwindcss"` trong CSS file

### Lesson 22: Test nhanh API trên Windows (tránh lỗi quote PowerShell)
- **Triệu chứng**: PowerShell `Invoke-RestMethod` dễ lỗi parse/quote khi chạy inline command dài (đặc biệt có `$`, `@`, JSON).
- **Giải pháp**: Dùng Node fetch để test API nhanh, in ra `status` + response body.
  - Ví dụ:
    - `node -e "(async()=>{ const res=await fetch('http://localhost:3000/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'Test',lastName:'User',email:'test'+Date.now()+'@abccafe.com',phone:'0901234567',password:'Abcdefg1'})}); console.log('status',res.status); console.log(await res.text()); })().catch(console.error)"`.

### Lesson 19: Hiển thị QR trong Expo (Employee QR)
- **Triệu chứng**: Màn QR chỉ hiện fallback text (không render QR).
- **Giải pháp**:
  - Cài `react-native-qrcode-svg` (Expo) và đảm bảo `react-native-svg` đúng version tương thích.
  - Import trực tiếp `QRCode` từ `react-native-qrcode-svg` để render QR ổn định.

### Lesson 20: Tích hợp Theme và i18n vào SettingsScreen
- **Vấn đề**: SettingsScreen có toggle theme/language nhưng không hoạt động - UI không đổi theme và text không đổi ngôn ngữ.
- **Giải pháp**:
  - Tích hợp `useSettings()` hook để lấy `currentTheme` và `settings.language`.
  - Tạo `getThemeColors()` function để trả về màu sắc động dựa trên `currentTheme` (dark/light).
  - Sử dụng `t()` function từ `i18n.ts` để translate tất cả text trong SettingsScreen.
  - Sử dụng `getLanguage()` để hiển thị text động cho các phần chưa có translation key.
  - Áp dụng `themeColors` vào tất cả components (SettingItem, ThemeOption, LanguageOption).
  - Thêm `forceUpdate` state để force re-render khi language thay đổi (đảm bảo translations được cập nhật ngay).
  - Theme được áp dụng ngay lập tức khi user toggle (optimistic update + context sync).
  - Language được áp dụng ngay lập tức qua `setLanguage()` trong SettingsContext.

### Lesson 21: Áp dụng Dark Mode cho tất cả các tab
- **Vấn đề**: Dark mode chỉ hoạt động ở SettingsScreen, các tab khác (Home, Profile, Attendance) vẫn dùng màu sắc hardcoded.
- **Giải pháp**:
  - Tạo `useTheme()` hook trong `Frontend/src/hooks/use-theme.ts` để cung cấp theme colors cho tất cả components.
  - Hook trả về `colors` object với các màu sắc động dựa trên `currentTheme` từ SettingsContext.
  - Áp dụng theme vào Home screen (Index.tsx): container background, text colors, icon colors, button colors.
  - Áp dụng theme vào Profile screen: avatar, cards, menu items, stat cards, text colors.
  - Áp dụng theme vào Attendance screen: container background, header, loading indicator, text colors.
  - Loại bỏ hardcoded HSL colors trong styles và thay bằng dynamic colors từ theme.
  - Theme tự động cập nhật khi user thay đổi trong Settings (do SettingsContext cung cấp `currentTheme`).

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

### Bug 7: Clock In không hoạt động do API base URL hardcode sai IP
- **Error description**: Bấm Clock In không chạy / báo Network request failed (mobile/emulator)
- **Root cause**: `Frontend/src/services/api.ts` hardcode `http://192.168.1.6:3000/api` không đúng máy hiện tại
- **Solution**:
  - Ưu tiên cấu hình `.env` qua `EXPO_PUBLIC_API_URL`
  - Android emulator dùng `http://10.0.2.2:3000/api`
  - Có thể auto-detect IP từ Expo `hostUri` (khi dev)
  - Fallback có warning rõ ràng để tránh “bấm không được” mà không biết lý do

### Bug 8: Tổng giờ hiển thị âm sau clock-out nhanh (ví dụ `-1:-58`)
- **Error description**: Clock-in và clock-out cách nhau vài phút, mục “Giờ/Tổng giờ” hiển thị giá trị âm như `-1:-58`.
- **Root cause**: Backend tính `netWorkMinutes = workDurationMinutes - breakDuration` với `breakDuration` mặc định 60 phút → nếu làm < 60 phút thì ra số âm.
- **Solution**: Clamp về 0 trước khi lưu/trả về: `Math.max(0, workDurationMinutes - breakDuration)`.

### Lesson 11: Gán QR Code cho toàn bộ nhân viên
- **Pattern**: Tạo script Node.js trong `Backend/scripts/assign-employee-qrcodes.js` sử dụng `connectDatabase()` / `getDatabase()` để cập nhật batch.
- **Quy ước mã**: `EMP-<employeeId || _id>`, chỉ gán cho employee chưa có `qrCode.code` (không ghi đè).
- **Cách chạy**: `cd Backend && npm run assign-employee-qrcodes`.

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
  - `src/components/` - Business logic components (Profile, EditProfileModal, SettingsScreen)
  - `components/` - Shared UI components
- **Contexts**: `src/contexts/` - React Contexts cho app-wide state (SettingsContext)
- **Services**: `src/services/` - API service layer
- **Utils**: `src/utils/` - Utility functions (validation, animations, i18n)
- **Scripts**: `Backend/scripts/` - Utility scripts (update-ip, assign-employee-qrcodes)
- **Documentation**: 
  - `database-design.md` - Database design documentation
  - `README.md` - Hướng dẫn chạy project
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

### Bug 10: Notification Modal không hiện lại khi quay lại tab
- **Error description**: Khi đọc notification ở tab Updates, sau đó chuyển tab và quay lại, popup không hiện nữa mặc dù vẫn có thông báo chưa đọc
- **Root cause**: 
  - Updates tab sử dụng `NotificationCenter` như một Modal với state `showNotifications`
  - Khi user đóng modal (set `showNotifications = false`), state này được lưu
  - Khi quay lại tab, modal không tự động mở lại vì state vẫn là `false`
- **Solution**: 
  - Sửa Updates tab để hiển thị notifications trực tiếp như một danh sách, không dùng Modal
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - NotificationCenter component vẫn giữ Modal version để có thể dùng cho popup ở nơi khác nếu cần

### Bug 11: Notification vẫn hiển thị "chưa đọc" sau khi mark as read
- **Error description**: Khi bấm vào notification để xem chi tiết, badge "chưa đọc" vẫn hiển thị mặc dù đã mark as read
- **Root cause**: 
  - Notification có nhiều recipients, mỗi recipient có trạng thái `read` riêng trong `recipients` array
  - Backend cập nhật đúng `recipients[].read = true` cho employee hiện tại
  - Frontend không refresh notifications từ server sau khi mark as read, chỉ cập nhật local state
  - Local state không sync với database
  - Backend query có thể trả về notification với `read: true` do race condition hoặc query không đúng
- **Solution**: 
  - Sửa `markNotificationAsRead` và `markAllNotificationsAsRead` để gọi `refreshNotifications()` sau khi mark as read
  - Bỏ cập nhật local state thủ công, dùng data từ server sau khi refresh
  - `refreshNotifications()` tự động cập nhật cả `notifications` và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - Sửa backend query để hỗ trợ filter theo `unreadOnly=true/false`
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Thêm logging chi tiết để debug query và response

### Bug 12: Notification unreadCount không chính xác sau khi mark all as read
- **Error description**: Sau khi bấm "Đọc tất cả", badge vẫn hiển thị số lượng unread (ví dụ "2/2 chưa đọc") mặc dù tất cả notifications đã được mark as read
- **Root cause**: 
  - Backend tính `unreadCount` từ query riêng (database) nhưng có thể không đồng bộ với notifications trong response
  - Có thể có notifications khác trong database chưa đọc nhưng không có trong response (do pagination)
  - Logic tính `unreadCount` không nhất quán giữa query và response
- **Solution**: 
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Query database để đếm tất cả notifications có `recipients[].read: false` cho employee hiện tại
  - Đảm bảo `unreadCount` luôn phản ánh đúng số lượng unread trong database
  - Thêm logging để debug và so sánh `unreadCount` từ database và response

### Bug 9: Phải đổi IP trong .env mỗi khi đổi mạng
- **Error description**: Mỗi khi đổi mạng (WiFi khác, mobile hotspot), phải thủ công cập nhật IP trong file `.env`
- **Root cause**: 
  - IP address trong `EXPO_PUBLIC_API_URL` bị hardcode trong `.env`
  - Khi đổi mạng, IP address của máy thay đổi nhưng `.env` không tự động cập nhật
- **Solution**: 
  - Tạo script `Backend/scripts/update-ip.js` để tự động detect IP từ network interfaces
  - Script tự động tìm IPv4 address phù hợp (ưu tiên WiFi/Ethernet, loại bỏ loopback)
  - Tự động cập nhật `EXPO_PUBLIC_API_URL` trong file `.env`
  - Thêm npm script `npm run update-ip` để chạy dễ dàng
  - **Cách sử dụng**: Mỗi khi đổi mạng, chạy `cd Backend && npm run update-ip` để tự động cập nhật IP

### Lesson 12: Form Validation với Regex và Error Messages
- **Pattern**: Tạo validation utilities với regex patterns cho email, password, phone, name
- **File**: `Frontend/src/utils/validation.ts`
- **Features**:
  - Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Password validation: min 8 chars, uppercase, lowercase, number
  - Phone validation: Vietnamese format `(0|\+84)[0-9]{9,10}`
  - Name validation: Vietnamese names with accents, 2-50 chars
- **Error Display**: 
  - Hiển thị error messages màu đỏ dưới input
  - Tự động clear error khi user sửa
  - Validate on blur (khi rời khỏi input)
- **Best Practice**: Tách validation logic ra utility file để reuse

### Lesson 13: Animation Utilities với react-native-reanimated
- **Pattern**: Tạo reusable animation hooks trong `Frontend/src/utils/animations.ts`
- **Animations**:
  - `useShakeAnimation()`: Shake input khi có lỗi (translateX sequence)
  - `useFadeInAnimation(isVisible)`: Fade in error messages với translateY
  - `useSlideUpAnimation(delay)`: Slide up form elements với delay
  - `usePulseAnimation()`: Pulse animation cho logo
  - `useButtonPressAnimation()`: Scale animation cho buttons khi press
- **Implementation**: 
  - Sử dụng `useSharedValue` và `useAnimatedStyle` từ react-native-reanimated
  - Delay animation với `useEffect` và `setTimeout` (cleanup properly)
  - Tất cả animations dùng `useNativeDriver: true` cho performance

### Lesson 14: Profile Screen với Load Data từ API
- **Pattern**: Load employee profile data từ API như Home screen
- **Implementation**:
  - Sử dụng `getEmployeeProfile()` từ `employeeService`
  - Load data trong `useEffect` khi component mount
  - Hiển thị loading state với `ActivityIndicator`
  - Error handling với user-friendly messages
  - Display: fullName, email, role, employeeId, statistics từ database
- **Statistics**: Hiển thị thống kê thực từ database (totalWorkingDays, totalHours, onTimeRate)

### Lesson 15: Edit Profile Modal với Validation
- **Pattern**: Modal component để edit profile với form validation
- **File**: `Frontend/src/components/EditProfileModal.tsx`
- **Features**:
  - Form với các trường: firstName, lastName, phone, dateOfBirth, gender, address, emergencyContact
  - Validation với regex (firstName, lastName, phone)
  - Shake animation khi validation fail
  - Fade in error messages
  - Loading state khi save
- **API**: `PUT /api/employees/profile` để update profile
- **Backend**: Cập nhật nested fields trong MongoDB với dot notation (`personalInfo.firstName`)

### Lesson 16: Settings Screen với Context API
- **Pattern**: Sử dụng React Context để quản lý app-wide settings
- **Files**: 
  - `Frontend/src/contexts/SettingsContext.tsx` - Settings provider
  - `Frontend/src/components/SettingsScreen.tsx` - Settings UI
- **Settings**:
  - **Notifications**: enabled, clockInReminder, attendanceSummary
  - **Theme**: light, dark, auto (theo system)
  - **Language**: vi, en
  - **Privacy**: showEmail, showPhone
- **Storage**: Lưu vào AsyncStorage với key `@dacn_app_settings`
- **Auto-apply**: Settings được áp dụng tự động khi thay đổi

### Lesson 18: Real-time Notifications với Socket.IO
- **Pattern**: WebSocket/Socket.IO cho real-time notifications từ admin đến employees
- **Backend**:
  - Socket.IO server với JWT authentication middleware
  - Notification routes: send (admin), get, mark as read, delete
  - Database schema: notifications collection với recipients array
  - Real-time emit: `io.to('user:userId').emit('new_notification', data)`
- **Frontend**:
  - NotificationContext với Socket.IO client connection
  - Auto-connect khi có auth token
  - Listen event `new_notification` và auto-refresh
  - NotificationCenter, NotificationItem, NotificationBadge components
- **Integration**:
  - NotificationBadge hiển thị trên Profile screen và tab navigation
  - Updates tab hiển thị notifications trực tiếp (không dùng Modal)
- **UI Pattern**:
  - Updates tab (`Frontend/app/(tabs)/updates.tsx`) hiển thị notifications như một danh sách trực tiếp
  - Không dùng Modal để tránh vấn đề: khi đóng modal, quay lại tab thì không hiện nữa
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - Khi bấm vào notification, navigate đến trang chi tiết (`/notification/[id]`)
  - **Pull-to-refresh**: Thêm `RefreshControl` vào ScrollView để kéo từ trên xuống reload notifications
- **Notification Detail Page**:
  - Tạo trang chi tiết notification tại `Frontend/app/notification/[id].tsx`
  - Hiển thị đầy đủ thông tin: icon, type, priority, title, message, metadata, timestamps
  - Tự động đánh dấu đã đọc khi mở trang chi tiết
  - Có nút xóa notification
  - Sử dụng dynamic route với `[id]` trong Expo Router
  - Cần thêm route vào Stack trong `_layout.tsx`
  - Giao diện được cải thiện: background trắng, icon lớn hơn với shadow, badges đẹp hơn, card layout
- **Two-Tab System (Chưa đọc / Đã đọc)**:
  - Updates tab có 2 tab: "Chưa đọc" (mặc định) và "Đã đọc"
  - Mỗi tab query notifications khác nhau:
    - Tab "Chưa đọc": query với `unreadOnly=true` (chỉ lấy notifications có `read: false`)
    - Tab "Đã đọc": query với `unreadOnly=false` và filter `read: true` ở frontend
  - State management: `activeTab` state để track tab hiện tại
  - Auto-refresh khi chuyển tab
  - Badge hiển thị số lượng unread chỉ ở tab "Chưa đọc"
  - Nút "Đọc tất cả" chỉ hiển thị ở tab "Chưa đọc"
- **Read Status Management**:
  - **KHÔNG xóa recipient** khi mark as read, chỉ cập nhật `read: true` và `readAt`
  - Recipient vẫn tồn tại trong array `recipients`, chỉ thay đổi trạng thái `read`
  - Notification vẫn tồn tại cho tất cả recipients, mỗi recipient có trạng thái `read` riêng
  - Backend query hỗ trợ filter theo `unreadOnly=true/false` để lấy notifications chưa đọc hoặc tất cả
  - `unreadCount` được tính từ database (tất cả notifications, không chỉ trong response)
- **Data Sync Pattern**:
  - Sau khi mark as read (single hoặc all), phải gọi `refreshNotifications()` để lấy data mới từ server
  - Không cập nhật local state thủ công, dùng data từ server để đảm bảo sync với database
  - `refreshNotifications()` tự động cập nhật cả `notifications` array và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - `refreshNotifications()` nhận parameter `unreadOnly?: boolean` để query theo tab
- **Files**:
  - `Backend/config/socket.js` - Socket.IO initialization
  - `Backend/routes/notifications.js` - Notification API routes với query support `unreadOnly`
  - `Frontend/src/contexts/NotificationContext.tsx` - Socket.IO client và state, `refreshNotifications(unreadOnly?)`
  - `Frontend/src/services/notificationService.ts` - API service với `unreadOnly` parameter
  - `Frontend/src/components/NotificationCenter.tsx` - Notification list UI (Modal version, có thể dùng cho popup)
  - `Frontend/src/components/NotificationItem.tsx` - Single notification item
  - `Frontend/src/components/NotificationBadge.tsx` - Unread count badge
  - `Frontend/app/(tabs)/updates.tsx` - Updates tab với 2 tabs (Chưa đọc/Đã đọc), pull-to-refresh
  - `Frontend/app/notification/[id].tsx` - Notification detail page với dynamic route

### Lesson 17: Settings Context và App-wide State Management
- **Pattern**: Context API cho app-wide state management
- **Implementation**:
  - `SettingsProvider` wrap toàn bộ app trong `_layout.tsx`
  - `useSettings()` hook để access settings từ bất kỳ component nào
  - Auto-load settings từ AsyncStorage khi app start
  - Auto-apply theme vào ThemeProvider
  - Auto-apply language với i18n utility
  - Setup notifications với expo-notifications (dynamic import để tránh lỗi nếu chưa cài)
- **Theme Integration**: 
  - `currentTheme` được tính từ settings và system colorScheme
  - Áp dụng vào `ThemeProvider` và `StatusBar`
- **Privacy Integration**: 
  - Áp dụng privacy settings vào Profile component
  - Ẩn/hiện email và phone dựa trên `privacy.showEmail` và `privacy.showPhone`

### Lesson 31: Payroll Edit/Revise với audit log (Admin)
- **Mục tiêu**:
  - Không cho sửa trực tiếp phiếu `APPROVED`.
  - Chỉ cho sửa trực tiếp khi phiếu đang `DRAFT/PENDING`.
  - Với phiếu `APPROVED`, dùng luồng **Revise** tạo phiên bản mới + lưu audit log.

- **Backend (`Backend/routes/payrolls.js`)**:
  1. **Mở rộng dữ liệu payroll** khi tạo mới (`POST /api/payrolls`):
     - Thêm metadata revision: `revisionOf`, `revisedFrom`, `revisedAt`, `revisedBy`, `reviseReason`, `isSuperseded`, `supersededBy`, `updatedAt`, `updatedBy`.
     - Ghi audit `CREATE` vào collection `payroll_audits`.
  2. **Thêm API update trực tiếp** `PUT /api/payrolls/:id`:
     - Chỉ cho phép nếu trạng thái hiện tại của phiếu là `DRAFT` hoặc `PENDING`.
     - Nếu là `APPROVED` trả lỗi: `Only DRAFT/PENDING payroll can be edited directly`.
     - Tự tính lại `allowancesTotal`, `deductionsTotal`, `netSalary`.
     - Ghi audit `UPDATE` với `previousValues` và `nextValues`.
  3. **Thêm API revise** `POST /api/payrolls/:id/revise`:
     - Chỉ cho phép với phiếu nguồn `APPROVED`.
     - Bắt buộc `reason` (lý do điều chỉnh).
     - Tạo phiếu mới (revision) thay vì sửa phiếu cũ.
     - Đánh dấu phiếu cũ `isSuperseded = true`, `supersededBy = <newPayrollId>`.
     - Ghi 2 audit records:
       - `REVISE_SOURCE` (phiếu cũ bị thay thế)
       - `REVISE_CREATE` (phiếu revision mới)

- **Admin service (`adminSide/src/services/payrollService.ts`)**:
  - Thêm types:
    - `UpdatePayrollRequest`
    - `RevisePayrollRequest`
  - Thêm API methods:
    - `updatePayroll(id, data)` → gọi `PUT /payrolls/:id`
    - `revisePayroll(id, data)` → gọi `POST /payrolls/:id/revise`
  - Mở rộng `Payroll` type với fields revision/superseded.

- **Admin UI (`adminSide/src/pages/Payroll.tsx`)**:
  - Bổ sung mode modal: `create | edit | revise`.
  - Thêm cột **Hành động** trong bảng payroll:
    - Phiếu `DRAFT/PENDING`: nút **Sửa**.
    - Phiếu `APPROVED` (chưa superseded): nút **Điều chỉnh**.
    - Phiếu đã superseded: hiển thị “Đã được điều chỉnh”.
  - Luồng submit theo mode:
    - `create` → `createPayroll`
    - `edit` → `updatePayroll`
    - `revise` → `revisePayroll` (bắt buộc nhập lý do)
  - Modal prefill dữ liệu từ phiếu được chọn, có preview thực nhận.

- **Business rule đã enforce**:
  - `APPROVED` không chỉnh trực tiếp.
  - Muốn đổi `APPROVED` phải revise, có lý do và audit trail.

, `@`, JSON).
- **Giải pháp**: Dùng Node fetch để test API nhanh, in ra `status` + response body.
  - Ví dụ:
    - `node -e "(async()=>{ const res=await fetch('http://localhost:3000/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'Test',lastName:'User',email:'test'+Date.now()+'@abccafe.com',phone:'0901234567',password:'Abcdefg1'})}); console.log('status',res.status); console.log(await res.text()); })().catch(console.error)"`.

### Lesson 19: Hiển thị QR trong Expo (Employee QR)
- **Triệu chứng**: Màn QR chỉ hiện fallback text (không render QR).
- **Giải pháp**:
  - Cài `react-native-qrcode-svg` (Expo) và đảm bảo `react-native-svg` đúng version tương thích.
  - Import trực tiếp `QRCode` từ `react-native-qrcode-svg` để render QR ổn định.

### Lesson 20: Tích hợp Theme và i18n vào SettingsScreen
- **Vấn đề**: SettingsScreen có toggle theme/language nhưng không hoạt động - UI không đổi theme và text không đổi ngôn ngữ.
- **Giải pháp**:
  - Tích hợp `useSettings()` hook để lấy `currentTheme` và `settings.language`.
  - Tạo `getThemeColors()` function để trả về màu sắc động dựa trên `currentTheme` (dark/light).
  - Sử dụng `t()` function từ `i18n.ts` để translate tất cả text trong SettingsScreen.
  - Sử dụng `getLanguage()` để hiển thị text động cho các phần chưa có translation key.
  - Áp dụng `themeColors` vào tất cả components (SettingItem, ThemeOption, LanguageOption).
  - Thêm `forceUpdate` state để force re-render khi language thay đổi (đảm bảo translations được cập nhật ngay).
  - Theme được áp dụng ngay lập tức khi user toggle (optimistic update + context sync).
  - Language được áp dụng ngay lập tức qua `setLanguage()` trong SettingsContext.

### Lesson 21: Áp dụng Dark Mode cho tất cả các tab
- **Vấn đề**: Dark mode chỉ hoạt động ở SettingsScreen, các tab khác (Home, Profile, Attendance) vẫn dùng màu sắc hardcoded.
- **Giải pháp**:
  - Tạo `useTheme()` hook trong `Frontend/src/hooks/use-theme.ts` để cung cấp theme colors cho tất cả components.
  - Hook trả về `colors` object với các màu sắc động dựa trên `currentTheme` từ SettingsContext.
  - Áp dụng theme vào Home screen (Index.tsx): container background, text colors, icon colors, button colors.
  - Áp dụng theme vào Profile screen: avatar, cards, menu items, stat cards, text colors.
  - Áp dụng theme vào Attendance screen: container background, header, loading indicator, text colors.
  - Loại bỏ hardcoded HSL colors trong styles và thay bằng dynamic colors từ theme.
  - Theme tự động cập nhật khi user thay đổi trong Settings (do SettingsContext cung cấp `currentTheme`).

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

### Bug 7: Clock In không hoạt động do API base URL hardcode sai IP
- **Error description**: Bấm Clock In không chạy / báo Network request failed (mobile/emulator)
- **Root cause**: `Frontend/src/services/api.ts` hardcode `http://192.168.1.6:3000/api` không đúng máy hiện tại
- **Solution**:
  - Ưu tiên cấu hình `.env` qua `EXPO_PUBLIC_API_URL`
  - Android emulator dùng `http://10.0.2.2:3000/api`
  - Có thể auto-detect IP từ Expo `hostUri` (khi dev)
  - Fallback có warning rõ ràng để tránh “bấm không được” mà không biết lý do

### Bug 8: Tổng giờ hiển thị âm sau clock-out nhanh (ví dụ `-1:-58`)
- **Error description**: Clock-in và clock-out cách nhau vài phút, mục “Giờ/Tổng giờ” hiển thị giá trị âm như `-1:-58`.
- **Root cause**: Backend tính `netWorkMinutes = workDurationMinutes - breakDuration` với `breakDuration` mặc định 60 phút → nếu làm < 60 phút thì ra số âm.
- **Solution**: Clamp về 0 trước khi lưu/trả về: `Math.max(0, workDurationMinutes - breakDuration)`.

### Lesson 11: Gán QR Code cho toàn bộ nhân viên
- **Pattern**: Tạo script Node.js trong `Backend/scripts/assign-employee-qrcodes.js` sử dụng `connectDatabase()` / `getDatabase()` để cập nhật batch.
- **Quy ước mã**: `EMP-<employeeId || _id>`, chỉ gán cho employee chưa có `qrCode.code` (không ghi đè).
- **Cách chạy**: `cd Backend && npm run assign-employee-qrcodes`.

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
  - `src/components/` - Business logic components (Profile, EditProfileModal, SettingsScreen)
  - `components/` - Shared UI components
- **Contexts**: `src/contexts/` - React Contexts cho app-wide state (SettingsContext)
- **Services**: `src/services/` - API service layer
- **Utils**: `src/utils/` - Utility functions (validation, animations, i18n)
- **Scripts**: `Backend/scripts/` - Utility scripts (update-ip, assign-employee-qrcodes)
- **Documentation**: 
  - `database-design.md` - Database design documentation
  - `README.md` - Hướng dẫn chạy project
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

### Bug 10: Notification Modal không hiện lại khi quay lại tab
- **Error description**: Khi đọc notification ở tab Updates, sau đó chuyển tab và quay lại, popup không hiện nữa mặc dù vẫn có thông báo chưa đọc
- **Root cause**: 
  - Updates tab sử dụng `NotificationCenter` như một Modal với state `showNotifications`
  - Khi user đóng modal (set `showNotifications = false`), state này được lưu
  - Khi quay lại tab, modal không tự động mở lại vì state vẫn là `false`
- **Solution**: 
  - Sửa Updates tab để hiển thị notifications trực tiếp như một danh sách, không dùng Modal
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - NotificationCenter component vẫn giữ Modal version để có thể dùng cho popup ở nơi khác nếu cần

### Bug 11: Notification vẫn hiển thị "chưa đọc" sau khi mark as read
- **Error description**: Khi bấm vào notification để xem chi tiết, badge "chưa đọc" vẫn hiển thị mặc dù đã mark as read
- **Root cause**: 
  - Notification có nhiều recipients, mỗi recipient có trạng thái `read` riêng trong `recipients` array
  - Backend cập nhật đúng `recipients[].read = true` cho employee hiện tại
  - Frontend không refresh notifications từ server sau khi mark as read, chỉ cập nhật local state
  - Local state không sync với database
  - Backend query có thể trả về notification với `read: true` do race condition hoặc query không đúng
- **Solution**: 
  - Sửa `markNotificationAsRead` và `markAllNotificationsAsRead` để gọi `refreshNotifications()` sau khi mark as read
  - Bỏ cập nhật local state thủ công, dùng data từ server sau khi refresh
  - `refreshNotifications()` tự động cập nhật cả `notifications` và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - Sửa backend query để hỗ trợ filter theo `unreadOnly=true/false`
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Thêm logging chi tiết để debug query và response

### Bug 12: Notification unreadCount không chính xác sau khi mark all as read
- **Error description**: Sau khi bấm "Đọc tất cả", badge vẫn hiển thị số lượng unread (ví dụ "2/2 chưa đọc") mặc dù tất cả notifications đã được mark as read
- **Root cause**: 
  - Backend tính `unreadCount` từ query riêng (database) nhưng có thể không đồng bộ với notifications trong response
  - Có thể có notifications khác trong database chưa đọc nhưng không có trong response (do pagination)
  - Logic tính `unreadCount` không nhất quán giữa query và response
- **Solution**: 
  - Tính `unreadCount` từ database (tất cả notifications) thay vì từ response để đảm bảo chính xác
  - Query database để đếm tất cả notifications có `recipients[].read: false` cho employee hiện tại
  - Đảm bảo `unreadCount` luôn phản ánh đúng số lượng unread trong database
  - Thêm logging để debug và so sánh `unreadCount` từ database và response

### Bug 9: Phải đổi IP trong .env mỗi khi đổi mạng
- **Error description**: Mỗi khi đổi mạng (WiFi khác, mobile hotspot), phải thủ công cập nhật IP trong file `.env`
- **Root cause**: 
  - IP address trong `EXPO_PUBLIC_API_URL` bị hardcode trong `.env`
  - Khi đổi mạng, IP address của máy thay đổi nhưng `.env` không tự động cập nhật
- **Solution**: 
  - Tạo script `Backend/scripts/update-ip.js` để tự động detect IP từ network interfaces
  - Script tự động tìm IPv4 address phù hợp (ưu tiên WiFi/Ethernet, loại bỏ loopback)
  - Tự động cập nhật `EXPO_PUBLIC_API_URL` trong file `.env`
  - Thêm npm script `npm run update-ip` để chạy dễ dàng
  - **Cách sử dụng**: Mỗi khi đổi mạng, chạy `cd Backend && npm run update-ip` để tự động cập nhật IP

### Lesson 12: Form Validation với Regex và Error Messages
- **Pattern**: Tạo validation utilities với regex patterns cho email, password, phone, name
- **File**: `Frontend/src/utils/validation.ts`
- **Features**:
  - Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Password validation: min 8 chars, uppercase, lowercase, number
  - Phone validation: Vietnamese format `(0|\+84)[0-9]{9,10}`
  - Name validation: Vietnamese names with accents, 2-50 chars
- **Error Display**: 
  - Hiển thị error messages màu đỏ dưới input
  - Tự động clear error khi user sửa
  - Validate on blur (khi rời khỏi input)
- **Best Practice**: Tách validation logic ra utility file để reuse

### Lesson 13: Animation Utilities với react-native-reanimated
- **Pattern**: Tạo reusable animation hooks trong `Frontend/src/utils/animations.ts`
- **Animations**:
  - `useShakeAnimation()`: Shake input khi có lỗi (translateX sequence)
  - `useFadeInAnimation(isVisible)`: Fade in error messages với translateY
  - `useSlideUpAnimation(delay)`: Slide up form elements với delay
  - `usePulseAnimation()`: Pulse animation cho logo
  - `useButtonPressAnimation()`: Scale animation cho buttons khi press
- **Implementation**: 
  - Sử dụng `useSharedValue` và `useAnimatedStyle` từ react-native-reanimated
  - Delay animation với `useEffect` và `setTimeout` (cleanup properly)
  - Tất cả animations dùng `useNativeDriver: true` cho performance

### Lesson 14: Profile Screen với Load Data từ API
- **Pattern**: Load employee profile data từ API như Home screen
- **Implementation**:
  - Sử dụng `getEmployeeProfile()` từ `employeeService`
  - Load data trong `useEffect` khi component mount
  - Hiển thị loading state với `ActivityIndicator`
  - Error handling với user-friendly messages
  - Display: fullName, email, role, employeeId, statistics từ database
- **Statistics**: Hiển thị thống kê thực từ database (totalWorkingDays, totalHours, onTimeRate)

### Lesson 15: Edit Profile Modal với Validation
- **Pattern**: Modal component để edit profile với form validation
- **File**: `Frontend/src/components/EditProfileModal.tsx`
- **Features**:
  - Form với các trường: firstName, lastName, phone, dateOfBirth, gender, address, emergencyContact
  - Validation với regex (firstName, lastName, phone)
  - Shake animation khi validation fail
  - Fade in error messages
  - Loading state khi save
- **API**: `PUT /api/employees/profile` để update profile
- **Backend**: Cập nhật nested fields trong MongoDB với dot notation (`personalInfo.firstName`)

### Lesson 16: Settings Screen với Context API
- **Pattern**: Sử dụng React Context để quản lý app-wide settings
- **Files**: 
  - `Frontend/src/contexts/SettingsContext.tsx` - Settings provider
  - `Frontend/src/components/SettingsScreen.tsx` - Settings UI
- **Settings**:
  - **Notifications**: enabled, clockInReminder, attendanceSummary
  - **Theme**: light, dark, auto (theo system)
  - **Language**: vi, en
  - **Privacy**: showEmail, showPhone
- **Storage**: Lưu vào AsyncStorage với key `@dacn_app_settings`
- **Auto-apply**: Settings được áp dụng tự động khi thay đổi

### Lesson 18: Real-time Notifications với Socket.IO
- **Pattern**: WebSocket/Socket.IO cho real-time notifications từ admin đến employees
- **Backend**:
  - Socket.IO server với JWT authentication middleware
  - Notification routes: send (admin), get, mark as read, delete
  - Database schema: notifications collection với recipients array
  - Real-time emit: `io.to('user:userId').emit('new_notification', data)`
- **Frontend**:
  - NotificationContext với Socket.IO client connection
  - Auto-connect khi có auth token
  - Listen event `new_notification` và auto-refresh
  - NotificationCenter, NotificationItem, NotificationBadge components
- **Integration**:
  - NotificationBadge hiển thị trên Profile screen và tab navigation
  - Updates tab hiển thị notifications trực tiếp (không dùng Modal)
- **UI Pattern**:
  - Updates tab (`Frontend/app/(tabs)/updates.tsx`) hiển thị notifications như một danh sách trực tiếp
  - Không dùng Modal để tránh vấn đề: khi đóng modal, quay lại tab thì không hiện nữa
  - Layout tương tự Home và Attendance: header với title, unread badge, action buttons, danh sách notifications
  - Sử dụng `useFocusEffect` để auto-refresh khi vào tab
  - Khi bấm vào notification, navigate đến trang chi tiết (`/notification/[id]`)
  - **Pull-to-refresh**: Thêm `RefreshControl` vào ScrollView để kéo từ trên xuống reload notifications
- **Notification Detail Page**:
  - Tạo trang chi tiết notification tại `Frontend/app/notification/[id].tsx`
  - Hiển thị đầy đủ thông tin: icon, type, priority, title, message, metadata, timestamps
  - Tự động đánh dấu đã đọc khi mở trang chi tiết
  - Có nút xóa notification
  - Sử dụng dynamic route với `[id]` trong Expo Router
  - Giao diện được cải thiện: background trắng, icon lớn hơn với shadow, badges đẹp hơn, card layout
- **Two-Tab System (Chưa đọc / Đã đọc)**:
  - Updates tab có 2 tab: "Chưa đọc" (mặc định) và "Đã đọc"
  - Mỗi tab query notifications khác nhau:
    - Tab "Chưa đọc": query với `unreadOnly=true` (chỉ lấy notifications có `read: false`)
    - Tab "Đã đọc": query với `unreadOnly=false` và filter `read: true` ở frontend
  - State management: `activeTab` state để track tab hiện tại
  - Auto-refresh khi chuyển tab
  - Badge hiển thị số lượng unread chỉ ở tab "Chưa đọc"
  - Nút "Đọc tất cả" chỉ hiển thị ở tab "Chưa đọc"
- **Read Status Management**:
  - **KHÔNG xóa recipient** khi mark as read, chỉ cập nhật `read: true` và `readAt`
  - Recipient vẫn tồn tại trong array `recipients`, chỉ thay đổi trạng thái `read`
  - Notification vẫn tồn tại cho tất cả recipients, mỗi recipient có trạng thái `read` riêng
  - Backend query hỗ trợ filter theo `unreadOnly=true/false` để lấy notifications chưa đọc hoặc tất cả
  - `unreadCount` được tính từ database (tất cả notifications, không chỉ trong response)
- **Data Sync Pattern**:
  - Sau khi mark as read (single hoặc all), phải gọi `refreshNotifications()` để lấy data mới từ server
  - Không cập nhật local state thủ công, dùng data từ server để đảm bảo sync với database
  - `refreshNotifications()` tự động cập nhật cả `notifications` array và `unreadCount` từ response
  - Notification Detail Page sync local state với notifications array từ context khi array thay đổi
  - `refreshNotifications()` nhận parameter `unreadOnly?: boolean` để query theo tab
- **Files**:
  - `Backend/config/socket.js` - Socket.IO initialization
  - `Backend/routes/notifications.js` - Notification API routes với query support `unreadOnly`
  - `Frontend/src/contexts/NotificationContext.tsx` - Socket.IO client và state, `refreshNotifications(unreadOnly?)`
  - `Frontend/src/services/notificationService.ts` - API service với `unreadOnly` parameter
  - `Frontend/src/components/NotificationCenter.tsx` - Notification list UI (Modal version, có thể dùng cho popup)
  - `Frontend/src/components/NotificationItem.tsx` - Single notification item
  - `Frontend/src/components/NotificationBadge.tsx` - Unread count badge
  - `Frontend/app/(tabs)/updates.tsx` - Updates tab với 2 tabs (Chưa đọc/Đã đọc), pull-to-refresh
  - `Frontend/app/notification/[id].tsx` - Notification detail page với dynamic route

### Lesson 17: Settings Context và App-wide State Management
- **Pattern**: Context API cho app-wide state management
- **Implementation**:
  - `SettingsProvider` wrap toàn bộ app trong `_layout.tsx`
  - `useSettings()` hook để access settings từ bất kỳ component nào
  - Auto-load settings từ AsyncStorage khi app start
  - Auto-apply theme vào ThemeProvider
  - Auto-apply language với i18n utility
  - Setup notifications với expo-notifications (dynamic import để tránh lỗi nếu chưa cài)
- **Theme Integration**: 
  - `currentTheme` được tính từ settings và system colorScheme
  - Áp dụng vào `ThemeProvider` và `StatusBar`
- **Privacy Integration**: 
  - Áp dụng privacy settings vào Profile component
  - Ẩn/hiện email và phone dựa trên `privacy.showEmail` và `privacy.showPhone`

### Lesson 31: Payroll Edit/Revise với audit log (Admin)
- **Mục tiêu**:
  - Không cho sửa trực tiếp phiếu `APPROVED`.
  - Chỉ cho sửa trực tiếp khi phiếu đang `DRAFT/PENDING`.
  - Với phiếu `APPROVED`, dùng luồng **Revise** tạo phiên bản mới + lưu audit log.

- **Backend (`Backend/routes/payrolls.js`)**:
  1. **Mở rộng dữ liệu payroll** khi tạo mới (`POST /api/payrolls`):
     - Thêm metadata revision: `revisionOf`, `revisedFrom`, `revisedAt`, `revisedBy`, `reviseReason`, `isSuperseded`, `supersededBy`, `updatedAt`, `updatedBy`.
     - Ghi audit `CREATE` vào collection `payroll_audits`.
  2. **Thêm API update trực tiếp** `PUT /api/payrolls/:id`:
     - Chỉ cho phép nếu trạng thái hiện tại của phiếu là `DRAFT` hoặc `PENDING`.
     - Nếu là `APPROVED` trả lỗi: `Only DRAFT/PENDING payroll can be edited directly`.
     - Tự tính lại `allowancesTotal`, `deductionsTotal`, `netSalary`.
     - Ghi audit `UPDATE` với `previousValues` và `nextValues`.
  3. **Thêm API revise** `POST /api/payrolls/:id/revise`:
     - Chỉ cho phép với phiếu nguồn `APPROVED`.
     - Bắt buộc `reason` (lý do điều chỉnh).
     - Tạo phiếu mới (revision) thay vì sửa phiếu cũ.
     - Đánh dấu phiếu cũ `isSuperseded = true`, `supersededBy = <newPayrollId>`.
     - Ghi 2 audit records:
       - `REVISE_SOURCE` (phiếu cũ bị thay thế)
       - `REVISE_CREATE` (phiếu revision mới)

- **Admin service (`adminSide/src/services/payrollService.ts`)**:
  - Thêm types:
    - `UpdatePayrollRequest`
    - `RevisePayrollRequest`
  - Thêm API methods:
    - `updatePayroll(id, data)` → gọi `PUT /payrolls/:id`
    - `revisePayroll(id, data)` → gọi `POST /payrolls/:id/revise`
  - Mở rộng `Payroll` type với fields revision/superseded.

- **Admin UI (`adminSide/src/pages/Payroll.tsx`)**:
  - Bổ sung mode modal: `create | edit | revise`.
  - Thêm cột **Hành động** trong bảng payroll:
    - Phiếu `DRAFT/PENDING`: nút **Sửa**.
    - Phiếu `APPROVED` (chưa superseded): nút **Điều chỉnh**.
    - Phiếu đã superseded: hiển thị “Đã được điều chỉnh”.
  - Luồng submit theo mode:
    - `create` → `createPayroll`
    - `edit` → `updatePayroll`
    - `revise` → `revisePayroll` (bắt buộc nhập lý do)
  - Modal prefill dữ liệu từ phiếu được chọn, có preview thực nhận.

- **Business rule đã enforce**:
  - `APPROVED` không chỉnh trực tiếp.
  - Muốn đổi `APPROVED` phải revise, có lý do và audit trail.

# Scratchpad
[X] Đọc plan `Plan/d-a-v-o-nh-ng-c-i-ancient-ladybug.md`
[X] Đọc `scratchpad.md` và lấy bối cảnh hiện tại
[X] Ưu tiên các plan rủi ro thấp trước
[ ] Thực hiện từng plan low-risk và xoá khỏi file sau khi hoàn thành
[ ] Cập nhật `scratchpad.md` theo tiến độ và lessons nếu có


### Cấu trúc Project:
```
codeZoneMobile/
├── Frontend/               # React Native + Expo
│   ├── app/                # Expo Router pages
│   │   ├── login.tsx       # Login page với validation
│   │   ├── signup.tsx      # Signup page với validation
│   │   ├── index.tsx       # Auth check & redirect
│   │   └── (tabs)/         # Tab navigation
│   ├── src/
│   │   ├── components/     # Business components
│   │   │   ├── Profile.tsx
│   │   │   ├── EditProfileModal.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── contexts/       # React Contexts
│   │   │   └── SettingsContext.tsx
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   │       ├── validation.ts
│   │       ├── animations.ts
│   │       └── i18n.ts
│   ├── styles/             # External CSS files
│   └── package.json
├── Backend/                # Node.js + Express
│   ├── config/             # Database, constants
│   ├── middleware/         # Auth, error handling
│   ├── routes/             # API endpoints
│   │   ├── auth.js         # Login, signup, me
│   │   ├── attendance.js   # Clock in/out
│   │   └── employees.js    # Employee profile, update profile
│   ├── scripts/            # Utility scripts
│   │   ├── update-ip.js    # Auto-detect và update IP
│   │   └── assign-employee-qrcodes.js
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
- **Animations**: react-native-reanimated ~4.1.1
- **State Management**: React Context API

### Chức năng đã hoàn thành:
1. ✅ **Database Design** - 7 collections với multi-tenant
2. ✅ **Backend API** - Authentication, Attendance, Employees endpoints (GET/PUT profile)
3. ✅ **Frontend Structure** - Folder organization, API services, contexts, utils
4. ✅ **Login/Signup Pages** - UI với regex validation, error messages, animations
5. ✅ **Network Configuration** - Platform-aware API URLs, auto IP detection script
6. ✅ **Authentication Flow** - Token management, auto-redirect
7. ✅ **Home Screen** - Load user data và attendance status từ API
8. ✅ **Attendance Screen** - Load attendance history từ API
9. ✅ **Profile Screen** - Load profile data, statistics từ API
10. ✅ **Edit Profile** - Modal edit profile với validation và animations
11. ✅ **Settings Screen** - Cài đặt ứng dụng với Context API, tích hợp theme (dark/light mode) và i18n (vi/en)
12. ✅ **Form Validation** - Regex validation utilities với error display
13. ✅ **Animations** - Reusable animation hooks với react-native-reanimated
14. ✅ **Settings Context** - App-wide state management cho settings
15. ✅ **Notification System** - Real-time notifications với Socket.IO, Updates tab với 2 tabs (Chưa đọc/Đã đọc), Notification Detail Page, Pull-to-refresh
16. ✅ **Leave & Adjustments (Employee)** - Xin nghỉ, điều chỉnh chấm công từ tab Attendance, xem lịch sử yêu cầu ở tab Resources
17. ✅ **Employee QR** - Màn “Mã QR của tôi” trong Profile hiển thị QR cá nhân từ backend

## Completed Features (Đã hoàn thành)

### Frontend (Mobile - React Native + Expo)
- ✅ Authentication: Login/Signup với validation
- ✅ Home Screen: Clock in/out, attendance status
- ✅ Attendance Screen: History với calendar view
- ✅ Profile Screen: Employee info, statistics, QR code
- ✅ Settings: Theme (dark/light), Language (vi/en), Notifications
- ✅ Notifications: Real-time với Socket.IO, 2 tabs (Chưa đọc/Đã đọc)
- ✅ Leave Requests & Adjustments: Xin nghỉ, điều chỉnh chấm công

### Backend (Node.js + Express + MongoDB)
- ✅ Multi-tenant architecture với tenant isolation
- ✅ JWT authentication
- ✅ API endpoints: Auth, Attendance, Employees, Notifications, Leave Requests
- ✅ Swagger/OpenAPI documentation tại `/api-docs`
- ✅ Socket.IO cho real-time notifications

### Admin Dashboard (React Web)
- ✅ Layout: Sidebar + Header với full navigation
- ✅ Dashboard: 5 cards với data từ MongoDB
- ✅ Authentication: Login/Signup với AuthContext
- ✅ i18n: English/Vietnamese support
- ✅ Interactive buttons: Tất cả buttons đã hoạt động
- ✅ **Pages**: Attendance, Schedule, Departments, Reports đã được implement đầy đủ
- ✅ **Settings Page**: Quản lý profile (firstName, lastName, phone), đổi password với validation, preferences (email notifications, push notifications, weekly reports)
- ✅ **HelpCenter Page**: FAQs với expandable sections, guides với step-by-step instructions, support contact (email, phone, office hours)
- ✅ **Integrations Page**: Hiển thị các tích hợp (Email, Google Calendar, Slack, Teams, Zoom, Payroll), filter theo status, connect/disconnect functionality
- ✅ **Modals**: Add Task modal với form validation
- ✅ **i18n**: Đã thêm đầy đủ translations cho Settings, HelpCenter, Integrations (Vietnamese và English)
 - ✅ **Company Working Hours**: Tab riêng trong Settings cho phép admin cấu hình giờ làm việc chung (workStartTime, workEndTime, breakDuration, lateThreshold, overtimeThreshold) dùng API `/api/admin/attendance-settings`, có backend log lịch sử thay đổi trong `attendanceSettingsLogs`.

### Bug 30: QR động vẫn không đổi sau fix lần 1
- **File**: `Frontend/src/components/EmployeeQrCard.tsx`
- **Root cause**: Có 2 vấn đề nghiêm trọng:
  1. **`setInterval` bị reset mỗi lần modal đóng/mở**: Effect dependencies `[employeeId, visible]` khiến interval cleanup + restart liên tục → closure capture `fetchNewQr` reference cũ → `employeeId` bị stale → API gọi sai hoặc không gọi.
  2. **`QRCode` component không re-render**: `react-native-qrcode-svg` giữ internal state, không tự cập nhật hình khi `value` prop thay đổi.
- **Giải pháp**:
  1. Dùng **refs** (`useRef`) cho interval IDs thay vì để trong effect → stable reference không bị reset.
  2. **`fetchInFlightRef`**: boolean ref chặn overlap API calls khi modal đóng rồi mở lại.
  3. **`useCallback` cho `fetchNewQr`**: đảm bảo function không bị re-create gây stale closure.
  4. **`key={displayValue}` trên QRCode**: bắt buộc React unmount + mount lại component khi value thay đổi → QR vẽ lại hoàn toàn.
  5. Chỉ khởi động interval khi modal `visible === true`, cleanup khi `false`.
- **Flow đúng**: Mở modal → fetch ngay → 5s interval → API mới → state update → `key` đổi → QR unmount/remount → **hình QR thay đổi**.

### Bug 29: QR động không tự đổi khi mở modal
- **File**: `Frontend/src/components/EmployeeQrCard.tsx`
- **Vấn đề**: QR chỉ đổi khi refresh lại trang, không tự đổi mỗi 5 giây khi modal đang mở.
- **Root cause**: Logic cũ có 2 vấn đề:
  1. `refreshQr` interval dùng `qrExpiresIn` từ prop — nhưng prop này được load từ lần mount Profile trước đó, không còn chính xác khi user mở modal sau đó.
  2. Countdown timer và refresh interval chạy độc lập, gây trùng lặp và không đồng bộ.
- **Giải pháp**: Thay thế hoàn toàn logic bằng:
  - **1 interval cố định 5 giây** (`QR_REFRESH_INTERVAL_MS = 5000`) — đồng bộ với `QR_WINDOW_SECONDS` backend.
  - Gọi `fetchNewQr()` ngay khi modal mở (`fetchNewQr` trong effect setup + `fetchNewQr` trong `setInterval`).
  - Countdown chỉ hiển thị, không trigger refresh — countdown về 0 thì interval đã tự chạy rồi.
  - Mỗi khi fetch thành công → reset countdown về 5.
  - Bỏ prop `qrExpiresIn` không còn cần thiết.
- **Files**: `EmployeeQrCard.tsx`, `Profile.tsx` (bỏ prop `qrExpiresIn`).

### Bug 28: Fix undefined `userId` và sai `method` trong Attendance
- **Files**: `Backend/routes/attendance.js`
- **Bug 1 — `userId` not defined** (dòng 194):
  - **Trước**: `userId: new ObjectId(userId)` → `userId` chưa được khai báo, sẽ throw `ReferenceError`
  - **Sau**: `userId: new ObjectId(req.user.userId)` → lấy từ JWT token đã decode trong middleware `authenticateToken`
- **Bug 2 — `clockOut.method` luôn là `'MOBILE_APP'`** (dòng 367):
  - **Trước**: `method: 'MOBILE_APP'` hardcoded → bất kể user quét QR hay bấm nút thường, đều ghi nhầm method
  - **Sau**: `method: method` → dùng đúng method từ request body (`QR_SCAN` hoặc `MOBILE_APP`)
  - **Ngoài ra**: `qrCode: qrCode || attendance.clockIn.qrCode` → ưu tiên qrCode mới nhất khi clock-out bằng QR
- **Root cause**: Cả 2 đều là lỗi copy-paste hoặc refactor sót. Không gây crash server (có try-catch), nhưng dữ liệu bị sai.

### Lesson 32: Workflow 2 — QR Scan Attendance (Admin quét QR → chấm công nhân viên)

#### Mục tiêu
Admin quét mã QR động của nhân viên → hiện thông tin nhân viên → bấm "Chấm công" → tạo bản ghi attendance.

#### Tình trạng trước khi sửa
- `scan-qr.tsx` chỉ `Alert.alert` thông tin nhân viên — **không có nút chấm công**
- `scannedValue` được set sau scan nhưng `employeeData` **không được lưu vào state**
- Backend `attendance.js` yêu cầu `qrCode` token khi `method === 'QR_SCAN'` — nhưng frontend không gửi
- Geofence check **luôn chạy** kể cả không có location → lỗi nếu không gửi location

#### Giải pháp — Frontend

**`Frontend/app/(tabs)/scan-qr.tsx`**:
1. Thêm state `scannedQrToken` để lưu QR token vừa quét
2. Sau khi scan → lưu cả `employeeData` và `qrToken` vào state (thay vì `Alert.alert`)
3. Block "QR vừa quét" hiện tên + mã NV thật, có hint "Nhấn để chấm công →"
4. Truyền `qrCode={scannedQrToken}` vào modal

**`Frontend/src/components/EmployeeAttendanceModal.tsx`** — **TẠO MỚI**:
- Props: `visible`, `employee`, `qrCode`, `onClose`, `onSuccess`
- State nội bộ: `'idle' | 'loading' | 'success' | 'error'`
- UI: header + avatar + tên/mã NV/vị trí/phòng ban + nút "Chấm công"
- Success: icon ✓ + "Chấm công thành công!" → auto-close 2s
- Error: banner đỏ + nút thử lại
- Gọi `clockIn({ employeeId, qrCode, method: 'QR_SCAN' })`

#### Giải pháp — Backend

**`Backend/routes/attendance.js`** (clock-in & clock-out):
- Bọc geofence check trong `if (location) { ... }` — chỉ check khi có location, không bắt lỗi khi không gửi
- QR token validation vẫn giữ nguyên cho `method === 'QR_SCAN'`

#### QR token expiry — tăng QR_WINDOW_SECONDS
- **Công thức**: Token hợp lệ trong `2 × QR_WINDOW_SECONDS` (vì có `QR_MAX_SKEW_WINDOWS = 1`)
- Mặc định `QR_WINDOW_SECONDS = 5` → token valid **~10 giây**
- Tăng lên `10` → token valid **~20 giây** → admin thoải mái thao tác hơn
- Cấu hình: `Backend/utils/qr.js` — sửa `parseInt(process.env.QR_WINDOW_SECONDS || '5', 10)` thành `'30'`

#### Test thủ công
1. Login TENANT_ADMIN → tab "Quét QR"
2. Bấm "Bắt đầu quét" → quét mã QR nhân viên
3. Card "Đã quét: [Tên NV]" hiện
4. Bấm vào card → modal: tên, mã NV, vị trí, phòng ban
5. Bấm "Chấm công" → spinner → "Chấm công thành công!" → auto-close 2s
6. Header "Trạng thái hôm nay" cập nhật

#### Files
- `Frontend/src/components/EmployeeAttendanceModal.tsx` — **TẠO MỚI**
- `Frontend/app/(tabs)/scan-qr.tsx` — Edit
- `Backend/routes/attendance.js` — Edit (clock-in + clock-out)
- `Backend/utils/qr.js` — Edit (`QR_WINDOW_SECONDS = 30`)

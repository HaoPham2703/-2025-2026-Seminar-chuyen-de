# AFTER.md - Tổng hợp trạng thái sau rà soát adminSide

## 1) Mục tiêu tài liệu
Tài liệu này là bản tổng hợp trạng thái sau vòng kiểm tra và cập nhật gần nhất cho trang admin của hệ thống quản lý nhân sự.

Phạm vi:
- Frontend admin: thư mục adminSide
- Backend liên quan trực tiếp đến adminSide: các route admin/auth/middleware

## 2) Kết quả đã xác nhận

### 2.1 Attendance đã hỗ trợ lọc theo ngày chọn
Trước đây trang Attendance luôn lấy dữ liệu hôm nay, nên đổi ngày không đổi dữ liệu.

Hiện tại đã có:
- API backend mới cho attendance theo ngày: GET /api/admin/attendance?date=YYYY-MM-DD
- Frontend Attendance gọi theo selectedDate thay vì cố định today
- Backend attendance filter theo timezone Asia/Ho_Chi_Minh

Tác động:
- Date picker trên trang Attendance giờ có hiệu lực thực tế
- Dữ liệu các ngày trước hiển thị đúng theo ngày chọn

### 2.2 Mapping phòng ban/position đã tương thích schema employee hiện tại
Dữ liệu employee trong DB đang thiên về schema:
- employment.department
- employment.position

Backend admin đã có fallback khi trả dữ liệu:
- department: emp.department || emp.employment?.department || 'N/A'
- position: emp.position || emp.employment?.position || 'N/A'

Tác động:
- Trang Attendance/Departments nhận được department/position ổn định hơn với dữ liệu seed và dữ liệu signup hiện có.

### 2.3 Xác nhận cơ chế multi-tenant đang hoạt động đúng
Khi login tenant A, hệ thống chỉ hiển thị employee/departments của tenant A.

Tác động nghiệp vụ:
- Không có bảng map tenant -> department riêng.
- Department hiện đang là kết quả gom nhóm từ employee thuộc tenant hiện tại.

## 3) Phân tích dữ liệu hiện tại theo tenant
Từ file dữ liệu employees đã kiểm tra:
- Tenant 507f1f77bcf86cd799439011: chủ yếu General, Phục vụ
- Tenant 6973d174d46658a26a11fdc1: HR, IT, Management, Sales

Kết luận:
- Nếu login tenant 507f1f77... mà chỉ thấy 2 phòng ban là đúng dữ liệu hiện có, không phải lỗi route/filter.

## 4) Những gì chưa thay đổi (vẫn cần xử lý nếu muốn)

### 4.1 Signup vẫn mặc định tạo employee thuộc department General
Luồng signup web hiện chưa có chọn department trong form.
Backend signup vẫn gán mặc định:
- employment.department = General
- employment.position = Employee

Tác động:
- Người dùng đăng ký mới sẽ dồn vào nhóm General nếu không có cơ chế quản trị gán phòng ban sau đó.

### 4.2 Departments page vẫn gom nhóm trực tiếp theo chuỗi department
Hiện tại trang Departments group theo emp.department đã trả về từ adminService.
Nếu dữ liệu có sai khác format (ví dụ khoảng trắng dư, khác hoa/thường), có thể tách nhóm thành nhiều cụm.

## 5) Trả lời các câu hỏi nghiệp vụ đã chốt
1. Sidebar có liệt kê từng card Dashboard không?
- Không. Sidebar là route chính, card chỉ là widget trong Dashboard.

2. Signup từ trang admin có tạo tenant_admin không?
- Không. Signup web tạo role EMPLOYEE.
- Muốn tạo TENANT_ADMIN dùng script create-admin trong Backend.

3. Vì sao phòng ban hiển thị ít?
- Do dữ liệu employee của tenant đang login chỉ có các department đó.

## 6) Dữ liệu test đã chuẩn bị
Đã có file seed attendance giai đoạn đầu tháng 4 để import bằng MongoDB Compass:
- adminSide/datatest/DACN.attendance.apr01-apr07.2026.seed.json

Mục đích:
- Tăng số bản ghi để test màn Attendance theo ngày.

## 7) Checklist kiểm thử nhanh sau cập nhật
1. Chọn nhiều ngày khác nhau trên Attendance, xác nhận số bản ghi thay đổi theo ngày.
2. Kiểm tra tenant A và tenant B đăng nhập riêng, xác nhận danh sách phòng ban khác nhau.
3. Kiểm tra Attendance hiển thị employeeName + department đúng với employee trong tenant.
4. Kiểm tra nếu import seed attendance mới, ngày trong seed phải map đúng tenantId + employeeId.

## 8) Khuyến nghị bước tiếp theo
1. Thêm chọn department/position trong signup hoặc tạo màn hình quản trị nhân sự để gán phòng ban sau signup.
2. Chuẩn hóa danh mục phòng ban (master departments) nếu muốn tránh nhập tự do gây lệch dữ liệu.
3. Bổ sung script seed users+employees+attendance đồng nhất tenant để test report ổn định.
4. Bổ sung validation dữ liệu attendance (tránh workDuration âm và dữ liệu trùng).

## 9) Kết luận
Sau vòng cập nhật hiện tại, lỗi chính ở Attendance theo ngày đã được xử lý, cơ chế hiển thị department đã tương thích schema employee phổ biến, và hành vi multi-tenant đã được xác minh rõ ràng. Tuy nhiên, để vận hành quản trị phòng ban tốt hơn, cần bổ sung quy trình gán department khi tạo nhân viên và chuẩn hóa dữ liệu phòng ban ở mức hệ thống.



# Note:
- Sửa set bộ lọc cho Attendance
- Sửa link liên kết leave requests ở dashboard
- Sửa hiển thị department 

#tạo seed data nhân viên, chấm công

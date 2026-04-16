export type Language = 'vi' | 'en'

interface Translations {
  [key: string]: {
    vi: string
    en: string
  }
}

const translations: Translations = {
  // Common
  'common.welcome': {
    vi: 'Chào mừng trở lại HRsync 👋',
    en: 'Welcome back to HRsync 👋',
  },
  'common.logout': {
    vi: 'Đăng xuất',
    en: 'Logout',
  },
  'common.search': {
    vi: 'Tìm kiếm',
    en: 'Search',
  },
  'common.schedule': {
    vi: 'Lịch trình',
    en: 'Schedule',
  },
  'common.createRequest': {
    vi: 'Tạo yêu cầu',
    en: 'Create Request',
  },
  'common.seeAll': {
    vi: 'Xem tất cả',
    en: 'See All',
  },
  'common.details': {
    vi: 'Chi tiết',
    en: 'Details',
  },
  'common.add': {
    vi: 'Thêm',
    en: 'Add',
  },
  'common.pending': {
    vi: 'Đang chờ',
    en: 'Pending',
  },
  'common.approved': {
    vi: 'Đã duyệt',
    en: 'Approved',
  },
  'common.rejected': {
    vi: 'Đã từ chối',
    en: 'Rejected',
  },
  'common.loading': {
    vi: 'Đang tải...',
    en: 'Loading...',
  },
  'common.all': {
    vi: 'Tất cả',
    en: 'All',
  },
  'common.select': {
    vi: 'Chọn',
    en: 'Select',
  },
  'common.save': {
    vi: 'Lưu',
    en: 'Save',
  },
  'common.saving': {
    vi: 'Đang lưu...',
    en: 'Saving...',
  },

  // Navigation
  'nav.dashboard': {
    vi: 'Bảng điều khiển',
    en: 'Dashboard',
  },
  'nav.schedule': {
    vi: 'Lịch trình',
    en: 'Schedule',
  },
  'nav.attendance': {
    vi: 'Chấm công',
    en: 'Attendance',
  },
  'nav.payroll': {
    vi: 'Lương',
    en: 'Payroll',
  },
  'nav.leaveRequests': {
    vi: 'Nghỉ phép',
    en: 'Leave Requests',
  },
  'nav.notifications': {
    vi: 'Thông báo',
    en: 'Notifications',
  },
  'nav.rewards': {
    vi: 'Khen thưởng & Kỷ luật',
    en: 'Rewards & Discipline',
  },
  'nav.employees': {
    vi: 'Quản lý Nhân viên',
    en: 'Employees',
  },
  'nav.departments': {
    vi: 'Phòng ban',
    en: 'Departments',
  },
  'nav.positions': {
    vi: 'Chức vụ',
    en: 'Positions',
  },
  'nav.integrations': {
    vi: 'Tích hợp',
    en: 'Integrations',
  },
  'nav.reports': {
    vi: 'Báo cáo',
    en: 'Reports',
  },
  'nav.settings': {
    vi: 'Cài đặt',
    en: 'Settings',
  },
  'nav.helpCenter': {
    vi: 'Trung tâm trợ giúp',
    en: 'Help Center',
  },

  // Shortcuts
  'shortcuts.newHireOnboarding': {
    vi: 'Tuyển dụng mới',
    en: 'New Hire Onboarding',
  },
  'shortcuts.leaveRequests': {
    vi: 'Yêu cầu nghỉ phép',
    en: 'Leave Requests',
  },
  'shortcuts.performanceReviews': {
    vi: 'Đánh giá hiệu suất',
    en: 'Performance Reviews',
  },

  // Dashboard Cards
  'dashboard.attendanceReport': {
    vi: 'Báo cáo chấm công',
    en: 'Attendance Report',
  },
  'dashboard.absent': {
    vi: 'Vắng mặt',
    en: 'Absent',
  },
  'dashboard.present': {
    vi: 'Có mặt',
    en: 'Present',
  },
  'dashboard.tasks': {
    vi: 'Nhiệm vụ',
    en: 'Tasks',
  },
  'dashboard.leaveRequests': {
    vi: 'Yêu cầu nghỉ phép',
    en: 'Leave Requests',
  },
  'dashboard.internship': {
    vi: 'Thực tập',
    en: 'Internship',
  },
  'dashboard.totalIntern': {
    vi: 'Tổng số thực tập sinh',
    en: 'Total Intern',
  },
  'dashboard.attended': {
    vi: 'Đã tham gia',
    en: 'Attended',
  },
  'dashboard.viewProgress': {
    vi: 'Xem tiến độ',
    en: 'View Progress',
  },
  'dashboard.meetings': {
    vi: 'Cuộc họp',
    en: 'Meetings',
  },
  'dashboard.events': {
    vi: 'Sự kiện',
    en: 'Events',
  },
  'dashboard.today': {
    vi: 'Hôm nay',
    en: 'Today',
  },
  'dashboard.yesterday': {
    vi: 'Hôm qua',
    en: 'Yesterday',
  },
  'dashboard.due': {
    vi: 'Hạn',
    en: 'Due',
  },
  'dashboard.recruitment': {
    vi: 'Tuyển dụng',
    en: 'Recruitment',
  },
  'dashboard.important': {
    vi: 'Quan trọng',
    en: 'Important',
  },
  'dashboard.annualLeave': {
    vi: 'Nghỉ phép năm',
    en: 'Annual Leave',
  },
  'dashboard.sickLeave': {
    vi: 'Nghỉ ốm',
    en: 'Sick Leave',
  },
  'dashboard.intern': {
    vi: 'Thực tập sinh',
    en: 'Intern',
  },

  // Status
  'status.absent': {
    vi: 'Vắng mặt',
    en: 'Absent',
  },
  'status.sick': {
    vi: 'Ốm',
    en: 'Sick',
  },
  'status.wfh': {
    vi: 'Làm việc tại nhà',
    en: 'WFH',
  },
  'status.present': {
    vi: 'Có mặt',
    en: 'Present',
  },
  'status.late': {
    vi: 'Trễ',
    en: 'Late',
  },

  // Login/Signup
  'auth.signIn': {
    vi: 'Đăng nhập',
    en: 'Sign in',
  },
  'auth.signUp': {
    vi: 'Đăng ký',
    en: 'Sign up',
  },
  'auth.signInToAccount': {
    vi: 'Đăng nhập vào tài khoản',
    en: 'Sign in to your account',
  },
  'auth.createAccount': {
    vi: 'Tạo tài khoản',
    en: 'Create your account',
  },
  'auth.email': {
    vi: 'Email',
    en: 'Email',
  },
  'auth.password': {
    vi: 'Mật khẩu',
    en: 'Password',
  },
  'auth.confirmPassword': {
    vi: 'Xác nhận mật khẩu',
    en: 'Confirm Password',
  },
  'auth.firstName': {
    vi: 'Tên',
    en: 'First Name',
  },
  'auth.lastName': {
    vi: 'Họ',
    en: 'Last Name',
  },
  'auth.phone': {
    vi: 'Số điện thoại',
    en: 'Phone',
  },
  'auth.tenantId': {
    vi: 'Mã Tenant (Tùy chọn)',
    en: 'Tenant ID (Optional)',
  },
  'auth.tenantIdPlaceholder': {
    vi: 'Để trống nếu single tenant',
    en: 'Leave empty if single tenant',
  },
  'auth.signingIn': {
    vi: 'Đang đăng nhập...',
    en: 'Signing in...',
  },
  'auth.creatingAccount': {
    vi: 'Đang tạo tài khoản...',
    en: 'Creating account...',
  },
  'auth.alreadyHaveAccount': {
    vi: 'Đã có tài khoản?',
    en: 'Already have an account?',
  },
  'auth.dontHaveAccount': {
    vi: 'Chưa có tài khoản?',
    en: "Don't have an account?",
  },
  'auth.passwordMinLength': {
    vi: 'Tối thiểu 8 ký tự',
    en: 'At least 8 characters',
  },
  'auth.passwordsNotMatch': {
    vi: 'Mật khẩu không khớp',
    en: 'Passwords do not match',
  },

  // Common additional
  'common.optional': {
    vi: 'Tùy chọn',
    en: 'Optional',
  },
  'common.shortcuts': {
    vi: 'Lối tắt',
    en: 'Shortcuts',
  },
  'common.noData': {
    vi: 'Không có dữ liệu',
    en: 'No data',
  },
  'common.noResults': {
    vi: 'Không tìm thấy kết quả',
    en: 'No results found',
  },
  'common.cancel': {
    vi: 'Hủy',
    en: 'Cancel',
  },
  'common.refresh': {
    vi: 'Làm mới',
    en: 'Refresh',
  },
  'common.total': {
    vi: 'Tổng cộng',
    en: 'Total',
  },

  // Payroll
  'payroll.title': {
    vi: 'Quản lý Lương',
    en: 'Payroll Management',
  },
  'payroll.subtitle': {
    vi: 'Tạo và quản lý phiếu lương nhân viên',
    en: 'Create and manage employee payroll',
  },
  'payroll.addNew': {
    vi: 'Tạo phiếu lương',
    en: 'Create Payroll',
  },
  'payroll.month': {
    vi: 'Tháng',
    en: 'Month',
  },
  'payroll.year': {
    vi: 'Năm',
    en: 'Year',
  },
  'payroll.employee': {
    vi: 'Nhân viên',
    en: 'Employee',
  },
  'payroll.period': {
    vi: 'Kỳ lương',
    en: 'Period',
  },
  'payroll.baseSalary': {
    vi: 'Lương cơ bản',
    en: 'Base Salary',
  },
  'payroll.allowances': {
    vi: 'Phụ cấp',
    en: 'Allowances',
  },
  'payroll.deductions': {
    vi: 'Khấu trừ',
    en: 'Deductions',
  },
  'payroll.netSalary': {
    vi: 'Thực nhận',
    en: 'Net Salary',
  },
  'payroll.status': {
    vi: 'Trạng thái',
    en: 'Status',
  },
  'payroll.approved': {
    vi: 'Đã duyệt',
    en: 'Approved',
  },
  'payroll.pending': {
    vi: 'Chờ duyệt',
    en: 'Pending',
  },
  'payroll.draft': {
    vi: 'Nháp',
    en: 'Draft',
  },
  'payroll.empty': {
    vi: 'Chưa có phiếu lương nào',
    en: 'No payroll records yet',
  },
  'payroll.createTitle': {
    vi: 'Tạo phiếu lương mới',
    en: 'Create New Payroll',
  },
  'payroll.createSubtitle': {
    vi: 'Điền thông tin bên dưới',
    en: 'Fill in the information below',
  },
  'payroll.itemName': {
    vi: 'Tên khoản',
    en: 'Item name',
  },
  'payroll.preview': {
    vi: 'Thực nhận dự kiến',
    en: 'Estimated Net Salary',
  },

  // Leave Requests
  'leaveRequests.title': {
    vi: 'Yêu cầu nghỉ phép',
    en: 'Leave Requests',
  },
  'leaveRequests.subtitle': {
    vi: 'Duyệt và quản lý yêu cầu nghỉ phép của nhân viên',
    en: 'Review and manage employee leave requests',
  },
  'leaveRequests.total': {
    vi: 'Tổng',
    en: 'Total',
  },
  'leaveRequests.pending': {
    vi: 'Chờ duyệt',
    en: 'Pending',
  },
  'leaveRequests.approved': {
    vi: 'Đã duyệt',
    en: 'Approved',
  },
  'leaveRequests.rejected': {
    vi: 'Từ chối',
    en: 'Rejected',
  },
  'leaveRequests.empty': {
    vi: 'Chưa có yêu cầu nào',
    en: 'No leave requests yet',
  },
  'leaveRequests.employee': {
    vi: 'Nhân viên',
    en: 'Employee',
  },
  'leaveRequests.type': {
    vi: 'Loại nghỉ',
    en: 'Leave Type',
  },
  'leaveRequests.dateRange': {
    vi: 'Thời gian',
    en: 'Date Range',
  },
  'leaveRequests.reason': {
    vi: 'Lý do',
    en: 'Reason',
  },
  'leaveRequests.submittedAt': {
    vi: 'Ngày gửi',
    en: 'Submitted',
  },
  'leaveRequests.status': {
    vi: 'Trạng thái',
    en: 'Status',
  },
  'leaveRequests.actions': {
    vi: 'Thao tác',
    en: 'Actions',
  },
  'leaveRequests.approve': {
    vi: 'Duyệt',
    en: 'Approve',
  },
  'leaveRequests.reject': {
    vi: 'Từ chối',
    en: 'Reject',
  },
  'leaveRequests.approveTitle': {
    vi: 'Duyệt yêu cầu',
    en: 'Approve Request',
  },
  'leaveRequests.rejectTitle': {
    vi: 'Từ chối yêu cầu',
    en: 'Reject Request',
  },
  'leaveRequests.reviewComment': {
    vi: 'Ghi chú',
    en: 'Comment',
  },
  'leaveRequests.reviewCommentPlaceholder': {
    vi: 'Nhập ghi chú (tùy chọn)...',
    en: 'Enter a comment (optional)...',
  },
  'leaveRequests.confirmApprove': {
    vi: 'Xác nhận duyệt',
    en: 'Confirm Approve',
  },
  'leaveRequests.confirmReject': {
    vi: 'Xác nhận từ chối',
    en: 'Confirm Reject',
  },

  // Attendance
  'attendance.employee': {
    vi: 'Nhân viên',
    en: 'Employee',
  },
  'attendance.clockIn': {
    vi: 'Giờ vào',
    en: 'Clock In',
  },
  'attendance.clockOut': {
    vi: 'Giờ ra',
    en: 'Clock Out',
  },
  'attendance.workHours': {
    vi: 'Giờ làm việc',
    en: 'Work Hours',
  },
  'attendance.status': {
    vi: 'Trạng thái',
    en: 'Status',
  },
  'attendance.noRecords': {
    vi: 'Không có bản ghi chấm công',
    en: 'No attendance records found',
  },

  // Schedule
  'schedule.weeklyView': {
    vi: 'Xem lịch theo tuần',
    en: 'Weekly Schedule View',
  },
  'schedule.default': {
    vi: 'Mặc định',
    en: 'Default',
  },
  'schedule.info': {
    vi: 'Thông tin lịch làm việc sẽ hiển thị ở đây. Click vào ô để chỉnh sửa lịch.',
    en: 'Schedule information will be displayed here. Click on a cell to edit schedule.',
  },
  'schedule.shiftTitle': {
    vi: 'Đặt lịch làm việc',
    en: 'Set Work Schedule',
  },
  'schedule.shiftType': {
    vi: 'Ca làm việc',
    en: 'Shift Type',
  },
  'schedule.startTime': {
    vi: 'Giờ vào',
    en: 'Start Time',
  },
  'schedule.endTime': {
    vi: 'Giờ ra',
    en: 'End Time',
  },
  'schedule.morning': {
    vi: 'Ca sáng (08:00-12:00)',
    en: 'Morning (08:00-12:00)',
  },
  'schedule.afternoon': {
    vi: 'Ca chiều (13:00-17:00)',
    en: 'Afternoon (13:00-17:00)',
  },
  'schedule.night': {
    vi: 'Ca tối (18:00-22:00)',
    en: 'Night (18:00-22:00)',
  },
  'schedule.fullDay': {
    vi: 'Cả ngày (09:00-18:00)',
    en: 'Full Day (09:00-18:00)',
  },
  'schedule.off': {
    vi: 'Nghỉ',
    en: 'Day Off',
  },
  'schedule.custom': {
    vi: 'Tùy chỉnh',
    en: 'Custom Hours',
  },
  'schedule.customized': {
    vi: 'Tùy chỉnh',
    en: 'Custom',
  },
  'schedule.history': {
    vi: 'Lịch sử',
    en: 'History',
  },
  'schedule.schedules': {
    vi: 'Lịch trình',
    en: 'Schedule',
  },
  'schedule.changedBy': {
    vi: 'Người thay đổi',
    en: 'Changed By',
  },
  'schedule.before': {
    vi: 'Trước',
    en: 'Before',
  },
  'schedule.after': {
    vi: 'Sau',
    en: 'After',
  },
  'schedule.reason': {
    vi: 'Lý do',
    en: 'Reason',
  },
  'schedule.delete': {
    vi: 'Xóa lịch',
    en: 'Remove Schedule',
  },
  'schedule.deleteConfirm': {
    vi: 'Xóa lịch tùy chỉnh? Nhân viên sẽ quay về lịch mặc định.',
    en: 'Remove custom schedule? Employee will return to default.',
  },
  'common.previous': {
    vi: 'Trước',
    en: 'Previous',
  },
  'common.next': {
    vi: 'Sau',
    en: 'Next',
  },
  'common.more': {
    vi: 'thêm',
    en: 'more',
  },

  // Departments
  'departments.total': {
    vi: 'Tổng',
    en: 'Total',
  },
  'departments.departments': {
    vi: 'phòng ban',
    en: 'departments',
  },
  'departments.totalDepartments': {
    vi: 'Tổng số phòng ban',
    en: 'Total Departments',
  },
  'departments.totalEmployees': {
    vi: 'Tổng số nhân viên',
    en: 'Total Employees',
  },
  'departments.avgEmployees': {
    vi: 'TB nhân viên/phòng ban',
    en: 'Avg Employees/Dept',
  },
  'departments.largestDept': {
    vi: 'Phòng ban lớn nhất',
    en: 'Largest Department',
  },
  'departments.employees': {
    vi: 'Nhân viên',
    en: 'Employees',
  },
  'departments.addDepartment': {
    vi: 'Thêm phòng ban',
    en: 'Add Department',
  },
  'departments.editDepartment': {
    vi: 'Sửa phòng ban',
    en: 'Edit Department',
  },
  'departments.deleteDepartment': {
    vi: 'Xóa phòng ban',
    en: 'Delete Department',
  },
  'departments.departmentName': {
    vi: 'Tên phòng ban',
    en: 'Department Name',
  },
  'departments.description': {
    vi: 'Mô tả',
    en: 'Description',
  },
  'departments.confirmDelete': {
    vi: 'Xác nhận xóa phòng ban này?',
    en: 'Confirm delete this department?',
  },
  'departments.cannotDelete': {
    vi: 'Không thể xóa phòng ban có nhân viên',
    en: 'Cannot delete department with employees',
  },
  'departments.manageEmployees': {
    vi: 'Quản lý nhân viên',
    en: 'Manage Employees',
  },
  'departments.assignEmployees': {
    vi: 'Gán nhân viên',
    en: 'Assign Employees',
  },
  'departments.removeEmployees': {
    vi: 'Xóa khỏi phòng ban',
    en: 'Remove from Department',
  },
  'departments.selectDepartment': {
    vi: 'Chọn phòng ban',
    en: 'Select Department',
  },
  'departments.unassigned': {
    vi: 'Chưa phân phòng',
    en: 'Unassigned',
  },
  'departments.confirmDeleteDesc': {
    vi: 'Hành động này không thể hoàn tác.',
    en: 'This action cannot be undone.',
  },

  // Employees
  'employees.title': {
    vi: 'Quản lý Nhân viên',
    en: 'Manage Employees',
  },
  'employees.totalEmployees': {
    vi: 'Tổng nhân viên',
    en: 'Total Employees',
  },
  'employees.assigned': {
    vi: 'Đã phân phòng',
    en: 'Assigned',
  },
  'employees.unassigned': {
    vi: 'Chưa phân phòng',
    en: 'Unassigned',
  },
  'employees.addEmployee': {
    vi: 'Thêm Nhân viên',
    en: 'Add Employee',
  },
  'employees.searchPlaceholder': {
    vi: 'Tìm kiếm theo tên, email, ID nhân viên...',
    en: 'Search by name, email, employee ID...',
  },
  'employees.allDepartments': {
    vi: 'Tất cả phòng ban',
    en: 'All Departments',
  },
  'employees.allStatus': {
    vi: 'Tất cả trạng thái',
    en: 'All Status',
  },
  'employees.statusAssigned': {
    vi: 'Đã phân phòng',
    en: 'Assigned',
  },
  'employees.statusUnassigned': {
    vi: 'Chưa phân phòng',
    en: 'Unassigned',
  },
  'employees.employeeId': {
    vi: 'ID Nhân viên',
    en: 'Employee ID',
  },
  'employees.name': {
    vi: 'Tên',
    en: 'Name',
  },
  'employees.email': {
    vi: 'Email',
    en: 'Email',
  },
  'employees.position': {
    vi: 'Vị trí',
    en: 'Position',
  },
  'employees.department': {
    vi: 'Phòng ban',
    en: 'Department',
  },
  'employees.actions': {
    vi: 'Thao tác',
    en: 'Actions',
  },
  'employees.assign': {
    vi: 'Gán',
    en: 'Assign',
  },
  'employees.move': {
    vi: 'Chuyển',
    en: 'Move',
  },
  'employees.removeDept': {
    vi: 'Xóa phòng',
    en: 'Remove Dept',
  },
  'employees.noResults': {
    vi: 'Không tìm thấy nhân viên nào',
    en: 'No employees found',
  },
  'employees.assignDeptTitle': {
    vi: 'Gán phòng ban',
    en: 'Assign Department',
  },
  'employees.moveDeptTitle': {
    vi: 'Chuyển phòng ban',
    en: 'Move to Department',
  },
  'employees.selectDept': {
    vi: 'Chọn phòng ban *',
    en: 'Select Department *',
  },
  'employees.selectDeptPlaceholder': {
    vi: '-- Chọn phòng ban --',
    en: '-- Select Department --',
  },
  'employees.currentDept': {
    vi: 'Phòng ban hiện tại:',
    en: 'Current Department:',
  },
  'employees.confirm': {
    vi: 'Xác nhận',
    en: 'Confirm',
  },
  'employees.notAssigned': {
    vi: 'Chưa phân',
    en: 'Not Assigned',
  },

  // Reports
  'reports.summary': {
    vi: 'Tổng hợp và Phân tích',
    en: 'Summary and Analytics',
  },
  'reports.from': {
    vi: 'Từ',
    en: 'From',
  },
  'reports.to': {
    vi: 'Đến',
    en: 'To',
  },
  'reports.totalEmployees': {
    vi: 'Tổng số nhân viên',
    en: 'Total Employees',
  },
  'reports.attendanceRate': {
    vi: 'Tỷ lệ chấm công',
    en: 'Attendance Rate',
  },
  'reports.pendingRequests': {
    vi: 'Yêu cầu đang chờ',
    en: 'Pending Requests',
  },
  'reports.attendanceStats': {
    vi: 'Thống kê chấm công',
    en: 'Attendance Statistics',
  },
  'reports.totalAttendance': {
    vi: 'Tổng bản ghi chấm công',
    en: 'Total Attendance Records',
  },
  'reports.leaveRequestsStats': {
    vi: 'Thống kê yêu cầu nghỉ phép',
    en: 'Leave Requests Statistics',
  },
  'reports.totalRequests': {
    vi: 'Tổng yêu cầu',
    en: 'Total Requests',
  },

  // Task
  'task.addTask': {
    vi: 'Thêm nhiệm vụ mới',
    en: 'Add New Task',
  },
  'task.title': {
    vi: 'Tiêu đề',
    en: 'Title',
  },
  'task.titlePlaceholder': {
    vi: 'Nhập tiêu đề nhiệm vụ',
    en: 'Enter task title',
  },
  'task.description': {
    vi: 'Mô tả',
    en: 'Description',
  },
  'task.descriptionPlaceholder': {
    vi: 'Nhập mô tả nhiệm vụ',
    en: 'Enter task description',
  },
  'task.tag': {
    vi: 'Nhãn',
    en: 'Tag',
  },
  'task.dueDate': {
    vi: 'Hạn chót',
    en: 'Due Date',
  },
  'task.tomorrow': {
    vi: 'Ngày mai',
    en: 'Tomorrow',
  },
  'task.nextWeek': {
    vi: 'Tuần sau',
    en: 'Next Week',
  },

  // Settings
  'settings.description': {
    vi: 'Quản lý cài đặt tài khoản và tùy chọn',
    en: 'Manage your account settings and preferences',
  },
  'settings.profile': {
    vi: 'Hồ sơ',
    en: 'Profile',
  },
  'settings.password': {
    vi: 'Mật khẩu',
    en: 'Password',
  },
  'settings.preferences': {
    vi: 'Tùy chọn',
    en: 'Preferences',
  },
  'settings.profileUpdated': {
    vi: 'Cập nhật hồ sơ thành công!',
    en: 'Profile updated successfully!',
  },
  'settings.passwordChanged': {
    vi: 'Đổi mật khẩu thành công!',
    en: 'Password changed successfully!',
  },
  'settings.preferencesSaved': {
    vi: 'Lưu tùy chọn thành công!',
    en: 'Preferences saved successfully!',
  },
  'settings.saveChanges': {
    vi: 'Lưu thay đổi',
    en: 'Save Changes',
  },
  'settings.emailCannotChange': {
    vi: 'Email không thể thay đổi',
    en: 'Email cannot be changed',
  },
  'settings.currentPassword': {
    vi: 'Mật khẩu hiện tại',
    en: 'Current Password',
  },
  'settings.newPassword': {
    vi: 'Mật khẩu mới',
    en: 'New Password',
  },
  'settings.changePassword': {
    vi: 'Đổi mật khẩu',
    en: 'Change Password',
  },
  'settings.emailNotifications': {
    vi: 'Thông báo qua Email',
    en: 'Email Notifications',
  },
  'settings.emailNotificationsDesc': {
    vi: 'Nhận thông báo qua email cho các cập nhật quan trọng',
    en: 'Receive email notifications for important updates',
  },
  'settings.pushNotifications': {
    vi: 'Thông báo đẩy',
    en: 'Push Notifications',
  },
  'settings.pushNotificationsDesc': {
    vi: 'Nhận thông báo đẩy trên thiết bị của bạn',
    en: 'Receive push notifications on your device',
  },
  'settings.weeklyReports': {
    vi: 'Báo cáo hàng tuần',
    en: 'Weekly Reports',
  },
  'settings.weeklyReportsDesc': {
    vi: 'Nhận báo cáo tóm tắt hàng tuần qua email',
    en: 'Receive weekly summary reports via email',
  },
  'settings.savePreferences': {
    vi: 'Lưu tùy chọn',
    en: 'Save Preferences',
  },
  'settings.company': {
    vi: 'Giờ làm việc công ty',
    en: 'Company Working Hours',
  },
  'settings.workStartTime': {
    vi: 'Giờ bắt đầu làm việc',
    en: 'Work Start Time',
  },
  'settings.workEndTime': {
    vi: 'Giờ kết thúc làm việc',
    en: 'Work End Time',
  },
  'settings.breakDuration': {
    vi: 'Thời gian nghỉ (phút)',
    en: 'Break Duration (minutes)',
  },
  'settings.lateThreshold': {
    vi: 'Ngưỡng đi trễ (phút)',
    en: 'Late Threshold (minutes)',
  },
  'settings.overtimeThreshold': {
    vi: 'Ngưỡng tăng ca (giờ)',
    en: 'Overtime Threshold (hours)',
  },
  'settings.saveCompanySettings': {
    vi: 'Lưu cài đặt công ty',
    en: 'Save Company Settings',
  },
  'settings.companySettingsUpdated': {
    vi: 'Cập nhật giờ làm việc công ty thành công!',
    en: 'Company working hours and attendance settings updated successfully!',
  },

  // Help Center
  'help.title': {
    vi: 'Trung tâm trợ giúp',
    en: 'Help Center',
  },
  'help.description': {
    vi: 'Tìm câu trả lời cho các câu hỏi thường gặp và hướng dẫn sử dụng',
    en: 'Find answers to frequently asked questions and usage guides',
  },
  'help.faq': {
    vi: 'Câu hỏi thường gặp',
    en: 'Frequently Asked Questions',
  },
  'help.guides': {
    vi: 'Hướng dẫn',
    en: 'Guides',
  },
  'help.support': {
    vi: 'Hỗ trợ',
    en: 'Support',
  },
  'help.contactSupport': {
    vi: 'Liên hệ hỗ trợ',
    en: 'Contact Support',
  },
  'help.email': {
    vi: 'Email',
    en: 'Email',
  },
  'help.phone': {
    vi: 'Điện thoại',
    en: 'Phone',
  },
  'help.officeHours': {
    vi: 'Giờ làm việc',
    en: 'Office Hours',
  },
  'help.hours': {
    vi: 'Thứ 2 - Thứ 6: 9:00 - 18:00',
    en: 'Mon - Fri: 9:00 AM - 6:00 PM',
  },
  'help.timezone': {
    vi: 'GMT+7 (Việt Nam)',
    en: 'GMT+7 (Vietnam)',
  },
  'help.responseTime': {
    vi: 'Phản hồi trong vòng 24 giờ',
    en: 'Response within 24 hours',
  },
  'help.faq1.question': {
    vi: 'Làm thế nào để thêm nhân viên mới?',
    en: 'How do I add a new employee?',
  },
  'help.faq1.answer': {
    vi: 'Để thêm nhân viên mới, vào trang Phòng ban, chọn phòng ban và nhấn nút "Thêm nhân viên". Điền thông tin cần thiết và lưu.',
    en: 'To add a new employee, go to the Departments page, click on the department, and use the "Add Employee" button. Fill in the required information and save.',
  },
  'help.faq2.question': {
    vi: 'Làm thế nào để duyệt yêu cầu nghỉ phép?',
    en: 'How do I approve leave requests?',
  },
  'help.faq2.answer': {
    vi: 'Điều hướng đến Dashboard và tìm card Yêu cầu nghỉ phép. Nhấn vào yêu cầu đang chờ để xem chi tiết, sau đó nhấn "Duyệt" hoặc "Từ chối" khi cần.',
    en: 'Navigate to the Dashboard and find the Leave Requests card. Click on a pending request to view details, then click "Approve" or "Reject" as needed.',
  },
  'help.faq3.question': {
    vi: 'Làm thế nào để xem báo cáo chấm công?',
    en: 'How do I view attendance reports?',
  },
  'help.faq3.answer': {
    vi: 'Vào trang Chấm công để xem bản ghi chấm công hôm nay. Bạn có thể lọc theo ngày và xem thống kê chi tiết cho từng nhân viên.',
    en: 'Go to the Attendance page to see today\'s attendance records. You can filter by date and view detailed statistics for each employee.',
  },
  'help.faq4.question': {
    vi: 'Làm thế nào để tạo báo cáo?',
    en: 'How do I generate reports?',
  },
  'help.faq4.answer': {
    vi: 'Truy cập trang Báo cáo để xem thống kê tổng hợp. Bạn có thể lọc theo khoảng thời gian và xuất dữ liệu nếu cần.',
    en: 'Visit the Reports page to view comprehensive statistics. You can filter by date range and export the data if needed.',
  },
  'help.faq5.question': {
    vi: 'Làm thế nào để quản lý phòng ban?',
    en: 'How do I manage departments?',
  },
  'help.faq5.answer': {
    vi: 'Trang Phòng ban hiển thị tất cả các phòng ban cùng nhân viên. Bạn có thể xem chi tiết nhân viên, thêm nhân viên mới và quản lý cấu trúc phòng ban.',
    en: 'The Departments page shows all departments with their employees. You can view employee details, add new employees, and manage department structure.',
  },
  'help.faq6.question': {
    vi: 'Làm thế nào để đổi mật khẩu?',
    en: 'How do I change my password?',
  },
  'help.faq6.answer': {
    vi: 'Vào Cài đặt > tab Mật khẩu. Nhập mật khẩu hiện tại và mật khẩu mới, sau đó nhấn "Đổi mật khẩu".',
    en: 'Go to Settings > Password tab. Enter your current password and new password, then click "Change Password".',
  },
  'help.guide1.title': {
    vi: 'Bắt đầu',
    en: 'Getting Started',
  },
  'help.guide1.description': {
    vi: 'Tìm hiểu những điều cơ bản về cách sử dụng HRsync',
    en: 'Learn the basics of using HRsync',
  },
  'help.guide1.step1': {
    vi: 'Đăng nhập vào tài khoản admin của bạn',
    en: 'Log in to your admin account',
  },
  'help.guide1.step2': {
    vi: 'Khám phá Dashboard để xem thống kê tổng quan',
    en: 'Explore the Dashboard to see overview statistics',
  },
  'help.guide1.step3': {
    vi: 'Điều hướng đến các phần khác nhau bằng sidebar',
    en: 'Navigate to different sections using the sidebar',
  },
  'help.guide1.step4': {
    vi: 'Bắt đầu quản lý nhân viên và chấm công',
    en: 'Start managing employees and attendance',
  },
  'help.guide2.title': {
    vi: 'Quản lý nhân viên',
    en: 'Managing Employees',
  },
  'help.guide2.description': {
    vi: 'Cách thêm và quản lý nhân viên',
    en: 'How to add and manage employees',
  },
  'help.guide2.step1': {
    vi: 'Vào trang Phòng ban',
    en: 'Go to Departments page',
  },
  'help.guide2.step2': {
    vi: 'Chọn một phòng ban',
    en: 'Select a department',
  },
  'help.guide2.step3': {
    vi: 'Nhấn nút "Thêm nhân viên"',
    en: 'Click "Add Employee" button',
  },
  'help.guide2.step4': {
    vi: 'Điền thông tin nhân viên và lưu',
    en: 'Fill in employee information and save',
  },
  'help.guide3.title': {
    vi: 'Xem báo cáo',
    en: 'Viewing Reports',
  },
  'help.guide3.description': {
    vi: 'Cách tạo và xem báo cáo',
    en: 'How to generate and view reports',
  },
  'help.guide3.step1': {
    vi: 'Điều hướng đến trang Báo cáo',
    en: 'Navigate to Reports page',
  },
  'help.guide3.step2': {
    vi: 'Chọn khoảng thời gian nếu cần',
    en: 'Select date range if needed',
  },
  'help.guide3.step3': {
    vi: 'Xem thống kê và phân tích',
    en: 'View statistics and analytics',
  },
  'help.guide3.step4': {
    vi: 'Xuất dữ liệu nếu cần',
    en: 'Export data if required',
  },

  // Integrations
  'integrations.description': {
    vi: 'Kết nối HRsync với các công cụ và dịch vụ yêu thích của bạn',
    en: 'Connect HRsync with your favorite tools and services',
  },
  'integrations.connected': {
    vi: 'Đã kết nối',
    en: 'Connected',
  },
  'integrations.available': {
    vi: 'Có sẵn',
    en: 'Available',
  },
  'integrations.comingSoon': {
    vi: 'Sắp ra mắt',
    en: 'Coming Soon',
  },
  'integrations.connect': {
    vi: 'Kết nối',
    en: 'Connect',
  },
  'integrations.disconnect': {
    vi: 'Ngắt kết nối',
    en: 'Disconnect',
  },
  'integrations.category': {
    vi: 'Danh mục',
    en: 'Category',
  },
  'integrations.category.communication': {
    vi: 'Giao tiếp',
    en: 'Communication',
  },
  'integrations.category.calendar': {
    vi: 'Lịch',
    en: 'Calendar',
  },
  'integrations.category.hr': {
    vi: 'Nhân sự',
    en: 'HR',
  },
  'integrations.category.analytics': {
    vi: 'Phân tích',
    en: 'Analytics',
  },
  'integrations.filter.all': {
    vi: 'Tất cả',
    en: 'All',
  },
  'integrations.filter.connected': {
    vi: 'Đã kết nối',
    en: 'Connected',
  },
  'integrations.filter.available': {
    vi: 'Có sẵn',
    en: 'Available',
  },
  'integrations.filter.comingSoon': {
    vi: 'Sắp ra mắt',
    en: 'Coming Soon',
  },
  'integrations.info.title': {
    vi: 'Về Tích hợp',
    en: 'About Integrations',
  },
  'integrations.info.description': {
    vi: 'Tích hợp cho phép bạn kết nối HRsync với các công cụ và dịch vụ khác mà bạn sử dụng. Điều này giúp tối ưu hóa quy trình làm việc và tự động hóa các tác vụ.',
    en: 'Integrations allow you to connect HRsync with other tools and services you use. This helps streamline your workflow and automate tasks.',
  },
  'integrations.learnMore': {
    vi: 'Tìm hiểu thêm',
    en: 'Learn more',
  },

  // Rewards & Discipline
  'rewards.title': {
    vi: 'Khen thưởng & Kỷ luật',
    en: 'Rewards & Discipline',
  },
  'rewards.subtitle': {
    vi: 'Quản lý thưởng phạt nhân viên',
    en: 'Manage employee rewards and discipline',
  },
  'rewards.rewards': {
    vi: 'Thưởng',
    en: 'Rewards',
  },
  'rewards.discipline': {
    vi: 'Kỷ luật',
    en: 'Discipline',
  },
  'rewards.settings': {
    vi: 'Cài đặt thưởng',
    en: 'Reward Settings',
  },
  'rewards.addReward': {
    vi: 'Thêm thưởng',
    en: 'Add Reward',
  },
  'rewards.addDiscipline': {
    vi: 'Ghi nhận lỗi',
    en: 'Record Violation',
  },
  'rewards.type': {
    vi: 'Loại',
    en: 'Type',
  },
  'rewards.material': {
    vi: 'Hiện vật',
    en: 'Material',
  },
  'rewards.money': {
    vi: 'Tiền',
    en: 'Money',
  },
  'rewards.value': {
    vi: 'Giá trị',
    en: 'Value',
  },
  'rewards.itemName': {
    vi: 'Tên vật',
    en: 'Item Name',
  },
  'rewards.pending': {
    vi: 'Chờ duyệt',
    en: 'Pending',
  },
  'rewards.approved': {
    vi: 'Đã duyệt',
    en: 'Approved',
  },
  'rewards.cancelled': {
    vi: 'Đã hủy',
    en: 'Cancelled',
  },
  'rewards.monthYear': {
    vi: 'Tháng/Năm',
    en: 'Month/Year',
  },
  'rewards.total': {
    vi: 'Tổng thưởng',
    en: 'Total Rewards',
  },
  'rewards.totalMaterial': {
    vi: 'Thưởng hiện vật',
    en: 'Material Rewards',
  },
  'rewards.totalMoney': {
    vi: 'Thưởng tiền',
    en: 'Money Rewards',
  },
  'rewards.disciplineType': {
    vi: 'Loại lỗi',
    en: 'Violation Type',
  },
  'rewards.late': {
    vi: 'Đi muộn',
    en: 'Late',
  },
  'rewards.absent': {
    vi: 'Vắng không phép',
    en: 'Absent without leave',
  },
  'rewards.violation': {
    vi: 'Vi phạm nội quy',
    en: 'Policy Violation',
  },
  'rewards.forgottenCheckout': {
    vi: 'Quên check-out',
    en: 'Forgot to check out',
  },
  'rewards.other': {
    vi: 'Khác',
    en: 'Other',
  },
  'rewards.penaltyAmount': {
    vi: 'Tiền phạt',
    en: 'Penalty Amount',
  },
  'rewards.description': {
    vi: 'Mô tả',
    en: 'Description',
  },
  'rewards.totalViolations': {
    vi: 'Tổng lỗi',
    en: 'Total Violations',
  },
  'rewards.ruleRequiredDays': {
    vi: 'Đi đúng giờ đủ (ngày)',
    en: 'On-time days required',
  },
  'rewards.ruleRewardType': {
    vi: 'Loại thưởng',
    en: 'Reward Type',
  },
  'rewards.ruleRewardAmount': {
    vi: 'Số tiền thưởng',
    en: 'Reward Amount',
  },
  'rewards.ruleRewardItem': {
    vi: 'Tên vật thưởng',
    en: 'Reward Item Name',
  },
  'rewards.runAutoReward': {
    vi: 'Chạy tính thưởng tự động',
    en: 'Run Auto Reward Calculation',
  },
  'rewards.ruleActive': {
    vi: 'Bật rule tự động',
    en: 'Enable auto reward rule',
  },
  'rewards.recorded': {
    vi: 'Đã ghi nhận',
    en: 'Recorded',
  },
  'rewards.waived': {
    vi: 'Miễn phạt',
    en: 'Waived',
  },
  'rewards.approve': {
    vi: 'Duyệt',
    en: 'Approve',
  },
  'rewards.waive': {
    vi: 'Miễn phạt',
    en: 'Waive',
  },
  'rewards.cancel': {
    vi: 'Hủy',
    en: 'Cancel',
  },
  'rewards.employeesQualified': {
    vi: 'nhân viên đủ điều kiện',
    en: 'employees qualified',
  },
  'rewards.autoRewardDesc': {
    vi: 'Thưởng khi đủ ngày đi đúng giờ',
    en: 'Reward for meeting on-time attendance threshold',
  },
  'rewards.noRule': {
    vi: 'Chưa có rule. Hãy tạo rule bên dưới.',
    en: 'No rule set. Create one below.',
  },
  'rewards.autoRewardResult': {
    vi: 'Đã tạo thưởng cho',
    en: 'Created rewards for',
  },
  'rewards.confirmRun': {
    vi: 'Chạy tính thưởng tự động cho tháng này?',
    en: 'Run auto reward for this month?',
  },

  // Notifications
  'notifications.title': {
    vi: 'Gửi thông báo',
    en: 'Send Notification',
  },
  'notifications.subtitle': {
    vi: 'Gửi thông báo cho nhân viên trong tổ chức',
    en: 'Send notifications to employees in the organization',
  },
  'notifications.compose': {
    vi: 'Soạn thông báo',
    en: 'Compose Notification',
  },
  'notifications.send': {
    vi: 'Gửi thông báo',
    en: 'Send Notification',
  },
  'notifications.sent': {
    vi: 'Đã gửi',
    en: 'Sent',
  },
  'notifications.sending': {
    vi: 'Đang gửi...',
    en: 'Sending...',
  },
}

let currentLanguage: Language = 'vi'

export const setLanguage = (lang: Language) => {
  currentLanguage = lang
  localStorage.setItem('admin_language', lang)
}

export const t = (key: string): string => {
  return translations[key]?.[currentLanguage] || key
}

export const getLanguage = (): Language => {
  const saved = localStorage.getItem('admin_language') as Language
  return saved || 'vi'
}

// Initialize language from localStorage
currentLanguage = getLanguage()

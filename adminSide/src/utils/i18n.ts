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
  'nav.departments': {
    vi: 'Phòng ban',
    en: 'Departments',
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

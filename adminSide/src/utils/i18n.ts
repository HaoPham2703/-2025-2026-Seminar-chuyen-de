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

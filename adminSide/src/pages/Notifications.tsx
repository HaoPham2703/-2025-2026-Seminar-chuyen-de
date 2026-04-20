import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { adminService } from '../services/adminService'
import { t } from '../utils/i18n'
import {
  Bell,
  BellRing,
  Send,
  X,
  Users,
  Building2,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Search,
} from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'ANNOUNCEMENT', labelVi: 'Thông báo', labelEn: 'Announcement', color: 'bg-blue-100 text-blue-700' },
  { value: 'ATTENDANCE', labelVi: 'Chấm công', labelEn: 'Attendance', color: 'bg-orange-100 text-orange-700' },
  { value: 'LEAVE', labelVi: 'Nghỉ phép', labelEn: 'Leave', color: 'bg-green-100 text-green-700' },
  { value: 'SYSTEM', labelVi: 'Hệ thống', labelEn: 'System', color: 'bg-gray-100 text-gray-700' },
  { value: 'URGENT', labelVi: 'Khẩn cấp', labelEn: 'Urgent', color: 'bg-red-100 text-red-700' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', labelVi: 'Thấp', labelEn: 'Low', color: 'bg-gray-100 text-gray-600' },
  { value: 'MEDIUM', labelVi: 'Trung bình', labelEn: 'Medium', color: 'bg-blue-100 text-blue-600' },
  { value: 'HIGH', labelVi: 'Cao', labelEn: 'High', color: 'bg-orange-100 text-orange-600' },
  { value: 'URGENT', labelVi: 'Khẩn cấp', labelEn: 'Urgent', color: 'bg-red-100 text-red-600' },
]

const AUDIENCE_OPTIONS = [
  { value: 'ALL', labelVi: 'Tất cả nhân viên', labelEn: 'All Employees' },
  { value: 'DEPARTMENT', labelVi: 'Theo phòng ban', labelEn: 'By Department' },
  { value: 'SPECIFIC', labelVi: 'Nhân viên cụ thể', labelEn: 'Specific Employees' },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  ANNOUNCEMENT: <Info size={14} />,
  ATTENDANCE: <Clock size={14} />,
  LEAVE: <CheckCircle size={14} />,
  SYSTEM: <Bell size={14} />,
  URGENT: <XCircle size={14} />,
}

export default function Notifications() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose')
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Compose form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('ANNOUNCEMENT')
  const [priority, setPriority] = useState('MEDIUM')
  const [targetAudience, setTargetAudience] = useState('ALL')
  const [targetDepartment, setTargetDepartment] = useState('')
  const [targetEmployeeIds, setTargetEmployeeIds] = useState<string[]>([])

  // History
  const [history, setHistory] = useState<any[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Data lists
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

  const loadHistory = async (page = 1) => {
    try {
      setLoadingHistory(true)
      const data = await adminService.getSentNotifications(page)
      setHistory(data.notifications || [])
      setHistoryPage(data.pagination.page)
      setHistoryTotal(data.pagination.total)
      setHistoryTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      console.error('Load history error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(historyPage)
    }
  }, [activeTab, historyPage])

  useEffect(() => {
    if (targetAudience === 'SPECIFIC' && employees.length === 0) {
      loadEmployees()
    }
    if (targetAudience === 'DEPARTMENT') {
      loadDepartments()
    }
  }, [targetAudience])

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const data = await adminService.getAllEmployees()
      setEmployees(data.employees || [])
    } catch (err: any) {
      console.error('Load employees error:', err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await adminService.getAllDepartments()
      setDepartments(data.departments?.map((d: any) => d.name) || [])
    } catch (err: any) {
      console.error('Load departments error:', err)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung thông báo')
      return
    }

    try {
      setSending(true)
      setError(null)

      const body: any = {
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        targetAudience,
        includeInactive: false,
      }

      if (targetAudience === 'DEPARTMENT') {
        body.targetDepartment = targetDepartment
      } else if (targetAudience === 'SPECIFIC') {
        body.targetEmployeeIds = targetEmployeeIds
        if (targetEmployeeIds.length === 0) {
          setError('Vui lòng chọn ít nhất 1 nhân viên')
          setSending(false)
          return
        }
      }

      await adminService.sendNotification(body)

      const count = targetAudience === 'ALL' ? 'tất cả'
        : targetAudience === 'DEPARTMENT' ? targetDepartment
        : `${targetEmployeeIds.length} nhân viên`

      setSuccessMsg(`Đã gửi thông báo đến ${count}`)
      setShowCompose(false)
      resetForm()
      setActiveTab('history')
      loadHistory(1)
    } catch (err: any) {
      const msg = err.message || 'Gửi thông báo thất bại'
      if (msg.includes('No employees found') || msg.includes('No valid employees')) {
        setError(
          'Không tìm thấy nhân viên hợp lệ để gửi.\n\n' +
          '💡 Kiểm tra: Employee cần có userId và status ACTIVE.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setType('ANNOUNCEMENT')
    setPriority('MEDIUM')
    setTargetAudience('ALL')
    setTargetDepartment('')
    setTargetEmployeeIds([])
    setError(null)
  }

  const toggleEmployee = (id: string) => {
    setTargetEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const filteredEmployees = employees.filter((emp) => {
  const q = employeeSearch.trim().toLowerCase()
  if (!q) return true
  return emp.name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q)
    || emp.employeeId?.toLowerCase().includes(q) || emp.department?.toLowerCase().includes(q)
})

  const getTypeLabel = (v: string) =>
    TYPE_OPTIONS.find(o => o.value === v)?.[language === 'vi' ? 'labelVi' : 'labelEn'] || v

  const getTypeColor = (v: string) =>
    TYPE_OPTIONS.find(o => o.value === v)?.color || 'bg-gray-100 text-gray-700'

  const getPriorityLabel = (v: string) =>
    PRIORITY_OPTIONS.find(o => o.value === v)?.[language === 'vi' ? 'labelVi' : 'labelEn'] || v

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getAudienceLabel = (v: string) =>
    AUDIENCE_OPTIONS.find(o => o.value === v)?.[language === 'vi' ? 'labelVi' : 'labelEn'] || v

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('notifications.title') || 'Gửi thông báo'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('notifications.subtitle') || 'Gửi thông báo real-time cho nhân viên trong tổ chức'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'compose'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send size={15} />
          {language === 'vi' ? 'Soạn thông báo' : 'Compose'}
        </button>
        <button
          onClick={() => { setActiveTab('history'); loadHistory(1) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BellRing size={15} />
          {language === 'vi' ? 'Lịch sử gửi' : 'Sent History'}
        </button>
      </div>

      {/* ── COMPOSE TAB ── */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          {/* Info card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-medium">Cách hoạt động của thông báo:</p>
              <ul className="space-y-0.5 text-blue-600">
                <li>• Gửi qua <strong>Socket.IO</strong> — nhân viên nhận ngay khi app đang mở</li>
                <li>• Chỉ gửi đến nhân viên có <strong>userId</strong> và status <strong>ACTIVE</strong></li>
                <li>• App đóng/background → cần <strong>Firebase FCM</strong> để nhận push notification</li>
              </ul>
            </div>
          </div>

          {/* Compose card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {language === 'vi' ? 'Soạn thông báo mới' : 'Compose New Notification'}
              </h2>
              <button
                onClick={() => { setShowCompose(true); resetForm() }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send size={13} />
                <span>{language === 'vi' ? 'Soạn thông báo' : 'Compose'}</span>
              </button>
            </div>

            {/* Quick compose */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thông báo lịch nghỉ Tết 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        type === opt.value
                          ? `${opt.color} border-current`
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {TYPE_ICON[opt.value]}
                      {language === 'vi' ? opt.labelVi : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPriority(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        priority === opt.value
                          ? `${opt.color} border-current`
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {language === 'vi' ? opt.labelVi : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người nhận</label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTargetAudience(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        targetAudience === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.value === 'ALL' && <Users size={12} />}
                      {opt.value === 'DEPARTMENT' && <Building2 size={12} />}
                      {opt.value === 'SPECIFIC' && <UserCheck size={12} />}
                      {language === 'vi' ? opt.labelVi : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn phòng ban</label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetAudience === 'SPECIFIC' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm nhân viên ({targetEmployeeIds.length} đã chọn)
                  </label>

                  {/* Search input */}
                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={employeeSearch}
                      onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true) }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      placeholder="Tìm theo tên, email, mã nhân viên..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Selected chips */}
                  {targetEmployeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {targetEmployeeIds.slice(0, 5).map((id) => {
                        const emp = employees.find(e => e._id === id)
                        return emp ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {emp.name}
                            <button type="button" onClick={() => toggleEmployee(id)}
                              className="hover:text-blue-900 font-bold">×</button>
                          </span>
                        ) : null
                      })}
                      {targetEmployeeIds.length > 5 && (
                        <span className="text-xs text-gray-500 py-1">+{targetEmployeeIds.length - 5} khác</span>
                      )}
                    </div>
                  )}

                  {/* Dropdown */}
                  {showEmployeeDropdown && (
                    <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-100">
                      {loadingEmployees ? (
                        <p className="p-4 text-sm text-gray-400">Đang tải...</p>
                      ) : filteredEmployees.length === 0 ? (
                        <p className="p-4 text-sm text-gray-400">Không tìm thấy nhân viên</p>
                      ) : filteredEmployees.map((emp) => {
                        const selected = targetEmployeeIds.includes(emp._id)
                        return (
                          <label key={emp._id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-blue-50 ${selected ? 'bg-blue-50' : ''}`}>
                            <input type="checkbox" checked={selected} onChange={() => toggleEmployee(emp._id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                              <p className="text-xs text-gray-400 truncate">{emp.email || emp.department || ''}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {targetEmployeeIds.length > 0 && (
                    <button type="button" onClick={() => setTargetEmployeeIds([])}
                      className="text-xs text-red-500 hover:text-red-700 mt-2 cursor-pointer">
                      Xóa tất cả đã chọn
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{language === 'vi' ? 'Gửi thông báo' : 'Send Notification'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="text-center py-12 text-gray-400">
              {language === 'vi' ? 'Đang tải...' : 'Loading...'}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Bell size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {language === 'vi' ? 'Chưa có thông báo nào được gửi' : 'No notifications sent yet'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {language === 'vi'
                  ? 'Soạn và gửi thông báo đầu tiên của bạn ngay bây giờ'
                  : 'Compose and send your first notification now'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notif.type)}`}>
                            {TYPE_ICON[notif.type]}
                            {getTypeLabel(notif.type)}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(notif.sentAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">{notif.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            👥 {notif.recipientsCount} {language === 'vi' ? 'người nhận' : 'recipients'}
                          </span>
                          <span className="text-xs text-gray-400">
                            → {getAudienceLabel(notif.targetAudience)}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            notif.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                            notif.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                            notif.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {getPriorityLabel(notif.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-600 px-3">
                    {historyPage} / {historyTotalPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <Bell size={20} />
          <span className="text-sm font-medium">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="ml-1 hover:opacity-80 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

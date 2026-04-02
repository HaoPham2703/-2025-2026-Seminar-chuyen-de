import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { adminService, type LeaveRequest } from '../services/adminService'
import { t } from '../utils/i18n'

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const TYPE_LABELS: Record<string, { vi: string; en: string }> = {
  SICK: { vi: 'Nghỉ ốm', en: 'Sick Leave' },
  ANNUAL: { vi: 'Nghỉ phép năm', en: 'Annual Leave' },
  UNPAID: { vi: 'Nghỉ không lương', en: 'Unpaid Leave' },
  MATERNITY: { vi: 'Nghỉ thai sản', en: 'Maternity Leave' },
  PATERNITY: { vi: 'Nghỉ paternity', en: 'Paternity Leave' },
  BEREAVEMENT: { vi: 'Nghỉ tang', en: 'Bereavement Leave' },
  OTHER: { vi: 'Khác', en: 'Other' },
}

const formatDate = (dateStr: string, lang: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function LeaveRequests() {
  const { language } = useLanguage()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalRequest, setModalRequest] = useState<LeaveRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getAllLeaveRequests(filterStatus || undefined)
      setRequests(data.requests || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (request: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setModalRequest(request)
    setReviewAction(action)
    setReviewComment('')
    setShowModal(true)
  }

  const handleReview = async () => {
    if (!modalRequest) return
    try {
      setProcessingId(modalRequest._id)
      await adminService.updateLeaveRequest(modalRequest._id, reviewAction, reviewComment)
      setShowModal(false)
      setModalRequest(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update request')
    } finally {
      setProcessingId(null)
    }
  }

  const getTypeLabel = (type: string) => {
    return TYPE_LABELS[type]?.[language] || type
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('leaveRequests.title') || 'Yêu cầu nghỉ phép'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('leaveRequests.subtitle') || 'Duyệt và quản lý yêu cầu nghỉ phép của nhân viên'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: t('leaveRequests.total') || 'Tổng', value: stats.total, color: 'bg-gray-100 text-gray-700' },
          { label: t('leaveRequests.pending') || 'Chờ duyệt', value: stats.pending, color: 'bg-yellow-50 text-yellow-700' },
          { label: t('leaveRequests.approved') || 'Đã duyệt', value: stats.approved, color: 'bg-green-50 text-green-700' },
          { label: t('leaveRequests.rejected') || 'Từ chối', value: stats.rejected, color: 'bg-red-50 text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('leaveRequests.status') || 'Trạng thái'}:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">-- {t('common.all') || 'Tất cả'} --</option>
              <option value="PENDING">{t('leaveRequests.pending') || 'Chờ duyệt'}</option>
              <option value="APPROVED">{t('leaveRequests.approved') || 'Đã duyệt'}</option>
              <option value="REJECTED">{t('leaveRequests.rejected') || 'Từ chối'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            {t('common.loading') || 'Đang tải...'}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {t('leaveRequests.empty') || 'Chưa có yêu cầu nào'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.employee') || 'Nhân viên'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.type') || 'Loại nghỉ'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.dateRange') || 'Thời gian'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.reason') || 'Lý do'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.submittedAt') || 'Ngày gửi'}
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.status') || 'Trạng thái'}
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('leaveRequests.actions') || 'Thao tác'}
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.employeeName}</div>
                    <div className="text-xs text-gray-400">{r.employeeRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{getTypeLabel(r.type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">
                      {formatDate(r.startDate, language)} — {formatDate(r.endDate, language)}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm text-gray-600 truncate" title={r.reason}>
                      {r.reason || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(r.createdAt, language)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[r.status] || ''}`}>
                      {r.status === 'PENDING' ? (t('leaveRequests.pending') || 'Chờ duyệt')
                        : r.status === 'APPROVED' ? (t('leaveRequests.approved') || 'Đã duyệt')
                        : (t('leaveRequests.rejected') || 'Từ chối')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status === 'PENDING' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openReviewModal(r, 'APPROVED')}
                          disabled={processingId === r._id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {t('leaveRequests.approve') || 'Duyệt'}
                        </button>
                        <button
                          onClick={() => openReviewModal(r, 'REJECTED')}
                          disabled={processingId === r._id}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {t('leaveRequests.reject') || 'Từ chối'}
                        </button>
                      </div>
                    )}
                    {r.status !== 'PENDING' && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {showModal && modalRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {reviewAction === 'APPROVED'
                  ? (t('leaveRequests.approveTitle') || 'Duyệt yêu cầu')
                  : (t('leaveRequests.rejectTitle') || 'Từ chối yêu cầu')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {modalRequest.employeeName} — {getTypeLabel(modalRequest.type)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('leaveRequests.reviewComment') || 'Ghi chú (tùy chọn)'}:
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder={t('leaveRequests.reviewCommentPlaceholder') || 'Nhập ghi chú...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t('common.cancel') || 'Hủy'}
                </button>
                <button
                  onClick={handleReview}
                  disabled={processingId !== null}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                    reviewAction === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingId !== null
                    ? (t('common.saving') || 'Đang xử lý...')
                    : (reviewAction === 'APPROVED'
                      ? (t('leaveRequests.confirmApprove') || 'Xác nhận duyệt')
                      : (t('leaveRequests.confirmReject') || 'Xác nhận từ chối'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

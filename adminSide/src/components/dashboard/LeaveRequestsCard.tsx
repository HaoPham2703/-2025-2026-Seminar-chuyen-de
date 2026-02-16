import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../utils/i18n'

interface LeaveRequest {
  _id?: string
  name: string
  role: string
  type: string
  dateRange: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'Pending' | 'Approved'
}

interface LeaveRequestsCardProps {
  leaveRequests?: LeaveRequest[]
}

export default function LeaveRequestsCard({ leaveRequests = [] }: LeaveRequestsCardProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSeeAll = () => {
    console.log('🔵 LeaveRequestsCard: See All clicked')
    navigate('/attendance') // Có thể tạo page riêng cho leave requests
  }

  const filteredRequests = leaveRequests.filter(req => 
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.leaveRequests')}</h3>
        <button 
          type="button"
          onClick={handleSeeAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          {t('common.seeAll')}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Leave Requests List */}
      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request, index) => {
            const status = request.status.toUpperCase() === 'PENDING' ? 'pending' : 
                          request.status.toUpperCase() === 'APPROVED' ? 'approved' : 
                          request.status.toLowerCase()
            return (
              <div key={request._id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{request.name}</p>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'pending' ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{request.role}</p>
                  <p className="text-xs text-gray-600">
                    {request.type === 'Annual Leave' || request.type === 'ANNUAL' ? t('dashboard.annualLeave') :
                     request.type === 'Sick Leave' || request.type === 'SICK' ? t('dashboard.sickLeave') :
                     request.type} ({request.dateRange})
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    status === 'pending' ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  {t(`common.${status}`)}
                </span>
              </div>
            )
          })
        ) : (
          <p className="text-xs text-gray-500 py-4 text-center">
            {searchQuery ? t('common.noResults') || 'No results found' : t('common.noData') || 'No leave requests'}
          </p>
        )}
      </div>
    </div>
  )
}

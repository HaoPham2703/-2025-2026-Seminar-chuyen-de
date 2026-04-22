import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../utils/i18n'

interface AttendanceItem {
  _id?: string
  name: string
  department: string
  status: string
  time?: string
}

interface AttendanceReportCardProps {
  absent?: AttendanceItem[]
  present?: AttendanceItem[]
  sick?: AttendanceItem[]
  wfh?: AttendanceItem[]
}

const statusColors: Record<string, string> = {
  Absent: 'bg-gray-100 text-gray-700',
  Sick: 'bg-orange-100 text-orange-700',
  WFH: 'bg-blue-100 text-blue-700',
  Present: 'bg-green-100 text-green-700',
}

export default function AttendanceReportCard({
  absent = [],
  present = [],
  sick = [],
  wfh = []
}: AttendanceReportCardProps) {
  const navigate = useNavigate()
  // Combine absent, sick, and wfh for display
  const absentEmployees = [...absent, ...sick, ...wfh].slice(0, 3)
  
  const handleSeeAll = () => {
    console.log('🔵 AttendanceReportCard: See All clicked')
    navigate('/attendance')
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.attendanceReport')}</h3>
        <button 
          type="button"
          onClick={handleSeeAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          {t('common.seeAll')}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Absent Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('dashboard.absent')}</h4>
        <div className="space-y-3">
          {absentEmployees.length > 0 ? (
            absentEmployees.map((employee, index) => (
              <div key={employee._id || index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.department}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[employee.status] || 'bg-gray-100 text-gray-700'}`}>
                  {employee.status === 'Absent' ? t('status.absent') :
                   employee.status === 'Sick' ? t('status.sick') :
                   employee.status === 'WFH' ? t('status.wfh') :
                   employee.status === 'Present' ? t('status.present') :
                   employee.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">{t('common.noData') || 'No data'}</p>
          )}
        </div>
      </div>

      {/* Present Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('dashboard.present')}</h4>
        <div className="space-y-3">
          {present.length > 0 ? (
            present.slice(0, 3).map((employee, index) => (
              <div key={employee._id || index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.department}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[employee.status] || 'bg-gray-100 text-gray-700'}`}>
                  {employee.time}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">{t('common.noData') || 'No data'}</p>
          )}
        </div>
      </div>
    </div>
  )
}

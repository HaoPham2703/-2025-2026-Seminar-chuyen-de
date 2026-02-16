import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../utils/i18n'

interface InternshipCardProps {
  totalInterns?: number
}

export default function InternshipCard({ totalInterns = 0 }: InternshipCardProps) {
  const navigate = useNavigate()

  const handleDetails = () => {
    console.log('🔵 InternshipCard: Details clicked')
    navigate('/departments') // Có thể tạo page riêng cho internship
  }

  const handleViewProgress = () => {
    console.log('🔵 InternshipCard: View Progress clicked')
    navigate('/departments') // Có thể tạo page riêng cho internship progress
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.internship')}</h3>
        <button 
          type="button"
          onClick={handleDetails}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
        >
          {t('common.details')}
        </button>
      </div>

      <div className="mb-6">
        <p className="text-2xl font-bold text-gray-900 mb-1">{t('dashboard.totalIntern')} {totalInterns}</p>
        <p className="text-sm text-gray-500">{t('dashboard.intern')}</p>
      </div>

      {/* Profile Pictures */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.min(totalInterns, 3) }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white"
            />
          ))}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{totalInterns} {t('dashboard.attended')}</p>
        </div>
      </div>

      {/* View Progress Button */}
      <button 
        type="button"
        onClick={handleViewProgress}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
      >
        {t('dashboard.viewProgress')}
      </button>
    </div>
  )
}

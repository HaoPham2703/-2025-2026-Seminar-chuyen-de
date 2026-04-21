import { useNavigate } from 'react-router-dom'
import { t } from '../../utils/i18n'

interface InternshipCardProps {
  totalEmployees?: number
}

export default function InternshipCard({ totalEmployees = 0 }: InternshipCardProps) {
  const navigate = useNavigate()

  const goEmployees = () => {
    console.log('EmployeeCard: navigate to employees')
    navigate('/employees')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('nav.employees')}</h3>
        <button
          type="button"
          onClick={goEmployees}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
        >
          {t('common.details')}
        </button>
      </div>

      <div className="mb-6">
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {t('common.total')}: {totalEmployees}
        </p>
        <p className="text-sm text-gray-500">Employee overview</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.min(totalEmployees, 3) }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white"
            />
          ))}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{totalEmployees} employees</p>
        </div>
      </div>

      <button
        type="button"
        onClick={goEmployees}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
      >
        {t('common.seeAll')}
      </button>
    </div>
  )
}

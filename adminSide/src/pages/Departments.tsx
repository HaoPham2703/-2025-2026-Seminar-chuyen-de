import { useEffect, useState } from 'react'
import { adminService, type Employee } from '../services/adminService'
import { t } from '../utils/i18n'

interface DepartmentStats {
  name: string
  employeeCount: number
  employees: Employee[]
}

export default function Departments() {
  const [departments, setDepartments] = useState<DepartmentStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading departments...')
      const data = await adminService.getAllEmployees()
      console.log('✅ Employees loaded:', data)

      // Group employees by department
      const departmentMap = new Map<string, Employee[]>()
      data.employees.forEach((emp) => {
        const dept = emp.department || 'N/A'
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, [])
        }
        departmentMap.get(dept)!.push(emp)
      })

      // Convert to array and sort by employee count
      const deptStats: DepartmentStats[] = Array.from(departmentMap.entries())
        .map(([name, employees]) => ({
          name,
          employeeCount: employees.length,
          employees,
        }))
        .sort((a, b) => b.employeeCount - a.employeeCount)

      setDepartments(deptStats)
    } catch (err: any) {
      console.error('❌ Failed to load departments:', err)
      setError(err.message || 'Failed to load departments')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.departments')}</h1>
          <p className="text-gray-600 mt-1">
            {t('departments.total') || 'Total'}: {departments.length}{' '}
            {t('departments.departments') || 'departments'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
          />
          <button
            type="button"
            onClick={loadDepartments}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('departments.totalDepartments') || 'Total Departments'}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {departments.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('departments.totalEmployees') || 'Total Employees'}</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {departments.reduce((sum, dept) => sum + dept.employeeCount, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('departments.avgEmployees') || 'Avg Employees/Dept'}</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {departments.length > 0
              ? Math.round(
                  departments.reduce((sum, dept) => sum + dept.employeeCount, 0) /
                    departments.length
                )
              : 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">{t('departments.largestDept') || 'Largest Department'}</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {departments.length > 0 ? departments[0].employeeCount : 0}
          </div>
        </div>
      </div>

      {/* Departments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            {t('common.noResults')}
          </div>
        ) : (
          filteredDepartments.map((dept) => (
            <div
              key={dept.name}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {dept.employeeCount} {t('departments.employees') || 'employees'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  {t('departments.employees') || 'Employees'}:
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {dept.employees.slice(0, 10).map((emp) => (
                    <div
                      key={emp._id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {emp.name}
                        </div>
                        <div className="text-xs text-gray-500">{emp.position}</div>
                      </div>
                      <div className="text-xs text-gray-400">{emp.email}</div>
                    </div>
                  ))}
                  {dept.employees.length > 10 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{dept.employees.length - 10} {t('common.more') || 'more'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

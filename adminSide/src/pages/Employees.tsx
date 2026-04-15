import { useEffect, useState } from 'react'
import { adminService, type Employee } from '../services/adminService'
import {
    assignEmployeesToDepartment,
    getDepartments,
    removeEmployeesFromDepartment,
    type Department,
} from '../services/departmentService'
import { t } from '../utils/i18n'

export default function Employees() {
  // ─── State: Employee List ───────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all')

  // ─── State: Modals ──────────────────────────────────────────────────────
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [removingDeptFrom, setRemovingDeptFrom] = useState<string | null>(null)

  // ─── Load Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      adminService.getAllEmployees().catch(() => ({ employees: [] })),
      getDepartments().catch(() => []),
    ]).then(([empData, depts]) => {
      setEmployees(empData.employees || [])
      setDepartments(depts)
    }).catch((err: Error | unknown) => {
      if (err instanceof Error) setError(err.message || 'Failed to load')
      else setError('Failed to load')
    }).finally(() => setLoading(false))
  }, [])

  // ─── Computed Values ───────────────────────────────────────────────────
  const totalEmployees = employees.length
  const assignedEmployees = employees.filter(
    e => e.department && e.department !== 'N/A' && e.department.trim() !== ''
  ).length
  const unassignedEmployees = totalEmployees - assignedEmployees

  // ─── Filter Logic ──────────────────────────────────────────────────────
  const filteredEmployees = employees.filter(emp => {
    // Search filter
    const matchesSearch = 
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Department filter
    if (filterDept !== 'all' && emp.department !== filterDept) return false

    // Status filter
    if (filterStatus === 'assigned' && (!emp.department || emp.department === 'N/A')) return false
    if (filterStatus === 'unassigned' && emp.department && emp.department !== 'N/A') return false

    return true
  })

  // ─── Actions ───────────────────────────────────────────────────────────
  const openAssignModal = (emp: Employee) => {
    setSelectedEmployee(emp)
    setSelectedDeptId('')
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedEmployee(null)
    setSelectedDeptId('')
  }

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedDeptId) return

    try {
      setAssignLoading(true)
      const selectedDept = departments.find(d => d._id === selectedDeptId)
      if (!selectedDept) throw new Error('Department not found')

      // Call API to assign employee to department
      await assignEmployeesToDepartment(selectedDeptId, [selectedEmployee._id])

      // Refresh employee data
      const empData = await adminService.getAllEmployees()
      setEmployees(empData.employees || [])
      closeAssignModal()
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message || 'Failed to assign employee')
      else alert('Failed to assign employee')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveDept = async (emp: Employee) => {
    if (!emp._id || !emp.department) return

    if (!window.confirm(`Remove ${emp.name} from ${emp.department}?`)) return

    try {
      setRemovingDeptFrom(emp._id)
      // Find the current department ID to pass to the API
      const currentDept = departments.find(d => d.name === emp.department)
      if (!currentDept) throw new Error('Department not found')

      await removeEmployeesFromDepartment(currentDept._id, [emp._id])

      // Refresh employee data
      const empData = await adminService.getAllEmployees()
      setEmployees(empData.employees || [])
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message || 'Failed to remove employee from department')
      else alert('Failed to remove employee from department')
    } finally {
      setRemovingDeptFrom(null)
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('employees.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalEmployees} {t('employees.totalEmployees')} — {assignedEmployees} {t('employees.assigned')} — {unassignedEmployees} {t('employees.unassigned')}
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm"
        >
          + {t('employees.addEmployee')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('employees.totalEmployees'), value: totalEmployees, color: 'text-blue-600' },
          { label: t('employees.assigned'), value: assignedEmployees, color: 'text-green-600' },
          { label: t('employees.unassigned'), value: unassignedEmployees, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder={t('employees.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">{t('employees.allDepartments')}</option>
          {departments.map(d => (
            <option key={d._id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'all' | 'assigned' | 'unassigned')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">{t('employees.allStatus')}</option>
          <option value="assigned">{t('employees.statusAssigned')}</option>
          <option value="unassigned">{t('employees.statusUnassigned')}</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.employeeId')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.email')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.position')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.department')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{t('employees.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                  {t('employees.noResults')}
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {emp.department && emp.department !== 'N/A' ? (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {emp.department}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {t('employees.notAssigned')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openAssignModal(emp)}
                      className="px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-medium cursor-pointer"
                    >
                      {emp.department && emp.department !== 'N/A' ? t('employees.move') : t('employees.assign')}
                    </button>
                    {emp.department && emp.department !== 'N/A' && (
                      <button
                        onClick={() => handleRemoveDept(emp)}
                        disabled={removingDeptFrom === emp._id}
                        className="px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer disabled:opacity-50"
                      >
                        {removingDeptFrom === emp._id ? t('common.removing') || 'Removing...' : t('employees.removeDept')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── ASSIGN DEPARTMENT MODAL ─────────────────────────────────── */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedEmployee.department && selectedEmployee.department !== 'N/A' ? t('employees.moveDeptTitle') : t('employees.assignDeptTitle')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{selectedEmployee.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('employees.selectDept')}
                </label>
                <select
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('employees.selectDeptPlaceholder')}</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {selectedEmployee.department && selectedEmployee.department !== 'N/A' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>{t('employees.currentDept')}</strong> {selectedEmployee.department}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeAssignModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAssign}
                disabled={assignLoading || !selectedDeptId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {assignLoading ? t('common.saving') : t('employees.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { adminService, type Employee } from '../services/adminService'
import {
  assignEmployeesToDepartment,
  createDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartments,
  removeEmployeesFromDepartment,
  updateDepartment,
  type Department,
  type DepartmentEmployee,
} from '../services/departmentService'
import { t } from '../utils/i18n'

export default function Departments() {
  // ─── State: Department List ──────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ─── State: Department Modal ──────────────────────────────────────────────
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [deptModalMode, setDeptModalMode] = useState<'create' | 'edit'>('create')
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptName, setDeptName] = useState('')
  const [deptDesc, setDeptDesc] = useState('')
  const [submittingDept, setSubmittingDept] = useState(false)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)

  // ─── State: Employee Modal ──────────────────────────────────────────────
  const [showEmpModal, setShowEmpModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deptEmployees, setDeptEmployees] = useState<DepartmentEmployee[]>([])
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)

  // ─── State: Unassigned Modal ────────────────────────────────────────────
  const [showUnassignedModal, setShowUnassignedModal] = useState(false)

  // ─── Load Departments + Employees ───────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getDepartments().catch(() => []),
      adminService.getAllEmployees().catch(() => ({ employees: [] })),
    ]).then(([depts, empData]) => {
      const emps = empData.employees || []
      setAllEmployees(emps)
      // Compute employee count per department
      const countMap: Record<string, number> = {}
      emps.forEach(e => {
        const dept = e.department || 'N/A'
        countMap[dept] = (countMap[dept] || 0) + 1
      })
      const deptsWithCount = depts.map(d => ({ ...d, employeeCount: countMap[d.name] || 0 }))
      setDepartments(deptsWithCount)
    }).catch((err: Error | unknown) => {
      if (err instanceof Error) setError(err.message || 'Failed to load')
      else setError('Failed to load')
    }).finally(() => setLoading(false))
  }, [])

  const filteredDepts = departments
    .map(d => ({
      ...d,
      employeeCount: allEmployees.filter(e => e.department === d.name).length,
    }))
    .filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // ─── Stats ───────────────────────────────────────────────────────────────
  const totalEmployees = allEmployees.length
  const assignedEmployees = allEmployees.filter(
    e => e.department && e.department !== 'N/A' && e.department.trim() !== ''
  ).length
  const unassignedCount = totalEmployees - assignedEmployees

  // ─── Department CRUD ───────────────────────────────────────────────────
  const openCreateModal = () => {
    setDeptModalMode('create')
    setEditingDept(null)
    setDeptName('')
    setDeptDesc('')
    setShowDeptModal(true)
  }

  const openEditModal = (dept: Department) => {
    setDeptModalMode('edit')
    setEditingDept(dept)
    setDeptName(dept.name)
    setDeptDesc(dept.description)
    setShowDeptModal(true)
  }

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptName.trim()) { alert('Vui lòng nhập tên phòng ban'); return }
    try {
      setSubmittingDept(true)
      if (deptModalMode === 'create') {
        await createDepartment(deptName.trim(), deptDesc)
      } else if (editingDept) {
        await updateDepartment(editingDept._id, deptName.trim(), deptDesc)
      }
      setShowDeptModal(false)
      const depts = await getDepartments()
      setDepartments(depts)
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message || 'Lỗi khi lưu phòng ban')
      else alert('Lỗi khi lưu phòng ban')
    } finally {
      setSubmittingDept(false)
    }
  }

  const handleDeleteDept = async (dept: Department) => {
    if (!window.confirm(`${t('departments.confirmDelete')}\n${dept.name}\n\n${t('departments.confirmDeleteDesc')}`)) return
    try {
      setDeletingDept(dept)
      await deleteDepartment(dept._id)
      const depts = await getDepartments()
      setDepartments(depts)
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message || t('departments.cannotDelete'))
      else alert(t('departments.cannotDelete'))
    } finally {
      setDeletingDept(null)
    }
  }

  // ─── Employee Modal ───────────────────────────────────────────────────
  const openEmployeeModal = async (dept: Department) => {
    setSelectedDept(dept)
    setSelectedEmpIds(new Set())
    setShowEmpModal(true)
    setLoadingEmp(true)
    try {
      const data = await getDepartmentEmployees(dept._id)
      setDeptEmployees(data.employees)
    } catch {
      setDeptEmployees([])
    } finally {
      setLoadingEmp(false)
    }
  }

  const closeEmpModal = () => {
    setShowEmpModal(false)
    setSelectedDept(null)
    setDeptEmployees([])
    setSelectedEmpIds(new Set())
  }

  const closeUnassignedModal = () => {
    setShowUnassignedModal(false)
  }

  // Employees available to assign to a department (not currently in this dept)
  const availableEmployees = selectedDept
    ? allEmployees.filter(e => !deptEmployees.some(de => de._id === e._id))
    : []

  // Employees without any department assignment (truly unassigned)
  const unassignedEmployees = allEmployees.filter(
    e => !e.department || e.department === 'N/A' || e.department.trim() === ''
  )

  const toggleEmpSelection = (id: string) => {
    setSelectedEmpIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (!selectedDept || selectedEmpIds.size === 0) return
    try {
      setAssigning(true)
      await assignEmployeesToDepartment(selectedDept._id, Array.from(selectedEmpIds))
      const [depts, data, empData] = await Promise.all([
        getDepartments(),
        getDepartmentEmployees(selectedDept._id),
        adminService.getAllEmployees(),
      ])
      setDepartments(depts)
      setDeptEmployees(data.employees)
      setAllEmployees(empData.employees || [])
      setSelectedEmpIds(new Set())
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (employeeId: string) => {
    if (!selectedDept) return
    try {
      setAssigning(true)
      await removeEmployeesFromDepartment(selectedDept._id, [employeeId])
      const [depts, data, empData] = await Promise.all([
        getDepartments(),
        getDepartmentEmployees(selectedDept._id),
        adminService.getAllEmployees(),
      ])
      setDepartments(depts)
      setDeptEmployees(data.employees)
      setAllEmployees(empData.employees || [])
    } catch (err: Error | unknown) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setAssigning(false)
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.departments')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {departments.length} {t('departments.departments')} — {totalEmployees} {t('departments.employees')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm"
          >
            + {t('departments.addDepartment')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('departments.totalDepartments'), value: departments.length, color: 'text-gray-900' },
          { label: t('departments.totalEmployees'), value: totalEmployees, color: 'text-blue-600' },
          { label: 'Đã phân phòng', value: assignedEmployees, color: 'text-green-600' },
          { label: t('departments.unassigned'), value: unassignedCount, color: 'text-orange-600', clickable: true },
        ].map(s => (
          <div
            key={s.label}
            onClick={() => s.clickable && setShowUnassignedModal(true)}
            className={`bg-white rounded-lg border border-gray-200 p-4 ${'clickable' in s && s.clickable ? 'cursor-pointer hover:border-orange-300 hover:shadow-md transition-all' : ''}`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-400">
            {t('common.noData')}
          </div>
        ) : (
          filteredDepts.map(dept => (
            <div key={dept._id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{dept.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Sửa"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteDept(dept)}
                    disabled={deletingDept?._id === dept._id}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                    title="Xóa"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {dept.employeeCount || 0} {t('departments.employees')}
                </span>
              </div>

              <button
                onClick={() => openEmployeeModal(dept)}
                className="w-full px-3 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {t('departments.manageEmployees')} →
              </button>
            </div>
          ))
        )}
      </div>

      {/* ─── DEPARTMENT CREATE/EDIT MODAL ─────────────────────────────── */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {deptModalMode === 'create' ? t('departments.addDepartment') : t('departments.editDepartment')}
              </h2>
            </div>
            <form onSubmit={handleSaveDept} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('departments.departmentName')} *
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  placeholder="VD: Phòng Kỹ thuật"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('departments.description')}
                </label>
                <textarea
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  placeholder="Mô tả phòng ban (tùy chọn)"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingDept}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingDept ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EMPLOYEE MANAGEMENT MODAL ───────────────────────────────── */}
      {showEmpModal && selectedDept && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{t('departments.manageEmployees')}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedDept.name}</p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Current employees */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('departments.employees')} ({deptEmployees.length})
                </h3>
                {loadingEmp ? (
                  <p className="text-sm text-gray-400">{t('common.loading')}</p>
                ) : deptEmployees.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có nhân viên nào trong phòng ban này.</p>
                ) : (
                  <div className="space-y-2">
                    {deptEmployees.map(emp => (
                      <div key={emp._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(emp._id)}
                          disabled={assigning}
                          className="px-3 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                        >
                          {t('departments.removeEmployees')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other employees */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Nhân viên khả thi ({availableEmployees.length})
                </h3>
                {availableEmployees.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Không còn nhân viên nào khả thi.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableEmployees.map(emp => (
                      <div key={emp._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedEmpIds.has(emp._id)}
                          onChange={() => toggleEmpSelection(emp._id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email} · {emp.department || 'Chưa phân'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={closeEmpModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || selectedEmpIds.size === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {assigning
                  ? 'Đang gán...'
                  : `${t('departments.assignEmployees')} (${selectedEmpIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── UNASSIGNED EMPLOYEES MODAL ─────────────────────────────── */}
      {showUnassignedModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Nhân viên chưa phân phòng</h2>
              <p className="text-sm text-gray-500 mt-1">
                {unassignedEmployees.length} nhân viên cần được gán vào phòng ban
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {unassignedEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-base font-medium text-gray-900">Tuyệt vời!</p>
                  <p className="text-sm text-gray-500 mt-1">Tất cả nhân viên đều đã được phân phòng.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {unassignedEmployees.map(emp => (
                    <div key={emp._id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{emp.email}</p>
                        <p className="text-xs text-gray-500">{emp.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
                          Chưa phân phòng
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={closeUnassignedModal}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('common.close') || 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

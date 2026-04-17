import { Briefcase, Edit, Plus, Search, Trash2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  createDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartments,
  updateDepartment,
} from '../services/departmentService'
import { getPositionsByDepartment } from '../services/positionService'

//  TypeScript Interfaces 
interface DepartmentHead {
  _id: string
  name: string
  email: string
  phone?: string
}

interface Department {
  _id: string
  name: string
  description: string
  employeeCount: number
  positionCount: number
  head?: DepartmentHead | null
}

interface Employee {
  _id: string
  employeeId: string
  name: string
  email: string
  phone: string
  department?: string
}

interface Position {
  _id: string
  name: string
  departmentId: string
  baseSalary: number
  employeeCount: number
}

interface FormModalState {
  show: boolean
  mode: 'create' | 'edit'
  dept: Department | null
  name: string
  description: string
  headEmployeeId: string | null
  // Employees of the department being edited (for TP dropdown)
  deptEmployees: Employee[]
  deptEmployeesLoading: boolean
  submitting: boolean
  error: string | null
}

interface EmployeesModalState {
  show: boolean
  dept: Department | null
  employees: Employee[]
  loading: boolean
  searchEmp: string
}

interface PositionsModalState {
  show: boolean
  dept: Department | null
  positions: Position[]
  loading: boolean
}

export default function Departments() {
  //  State: Department List
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  //  State: Form Modal
  const [modal, setModal] = useState<FormModalState>({
    show: false,
    mode: 'create',
    dept: null,
    name: '',
    description: '',
    headEmployeeId: null,
    deptEmployees: [],
    deptEmployeesLoading: false,
    submitting: false,
    error: null,
  })

  //  State: Employees Modal 
  const [empModal, setEmpModal] = useState<EmployeesModalState>({
    show: false,
    dept: null,
    employees: [],
    loading: false,
    searchEmp: '',
  })

  //  State: Positions Modal 
  const [posModal, setPosModal] = useState<PositionsModalState>({
    show: false,
    dept: null,
    positions: [],
    loading: false,
  })

  //  State: Delete confirmation 
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)

  //  Load Data 
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const depts = await getDepartments().catch(() => [])
      setDepartments(depts)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  //  Filter 
  const filtered = departments
    .filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.head?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  //  Stats 
  const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0)
  const totalPositions = departments.reduce((sum, d) => sum + (d.positionCount || 0), 0)

  //  Modal Handlers
  const openCreateModal = () => {
    setModal({
      show: true,
      mode: 'create',
      dept: null,
      name: '',
      description: '',
      headEmployeeId: null,
      deptEmployees: [],
      deptEmployeesLoading: false,
      submitting: false,
      error: null,
    })
  }

  const openEditModal = (dept: Department) => {
    setModal(prev => ({
      ...prev,
      show: true,
      mode: 'edit',
      dept,
      name: dept.name,
      description: dept.description,
      headEmployeeId: dept.head?._id || null,
      deptEmployees: [],
      deptEmployeesLoading: true,
      submitting: false,
      error: null,
    }))

    // Fetch employees of this department for the TP dropdown
    const fetchDeptEmployees = async () => {
      try {
        const data = await getDepartmentEmployees(dept._id)
        setModal(prev => ({
          ...prev,
          deptEmployees: data.employees,
          deptEmployeesLoading: false,
        }))
      } catch {
        setModal(prev => ({
          ...prev,
          deptEmployees: [],
          deptEmployeesLoading: false,
        }))
      }
    }

    fetchDeptEmployees()
  }

  const closeModal = () => {
    setModal({
      show: false,
      mode: 'create',
      dept: null,
      name: '',
      description: '',
      headEmployeeId: null,
      deptEmployees: [],
      deptEmployeesLoading: false,
      submitting: false,
      error: null,
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setModal(prev => ({ ...prev, error: null }))

    if (!modal.name.trim()) {
      setModal(prev => ({ ...prev, error: 'Tên phòng ban là bắt buộc' }))
      return
    }

    try {
      setModal(prev => ({ ...prev, submitting: true }))

      if (modal.mode === 'create') {
        await createDepartment(modal.name, modal.description, modal.headEmployeeId)
      } else if (modal.dept) {
        await updateDepartment(
          modal.dept._id,
          modal.name,
          modal.description,
          modal.headEmployeeId
        )
      }

      await loadData()
      closeModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu'
      setModal(prev => ({ ...prev, error: message }))
    } finally {
      setModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const handleDelete = async () => {
    if (!deletingDept) return

    try {
      setModal(prev => ({ ...prev, submitting: true }))
      await deleteDepartment(deletingDept._id)
      await loadData()
      setDeletingDept(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xóa thất bại'
      setModal(prev => ({ ...prev, error: message }))
    } finally {
      setModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const openEmployeesModal = async (dept: Department) => {
    try {
      setEmpModal(prev => ({ ...prev, show: true, dept, loading: true }))
      const data = await getDepartmentEmployees(dept._id)
      setEmpModal(prev => ({
        ...prev,
        employees: data.employees,
        loading: false,
      }))
    } catch (err) {
      setEmpModal(prev => ({ ...prev, loading: false }))
    }
  }

  const closeEmployeesModal = () => {
    setEmpModal({
      show: false,
      dept: null,
      employees: [],
      loading: false,
      searchEmp: '',
    })
  }

  const openPositionsModal = async (dept: Department) => {
    try {
      setPosModal(prev => ({ ...prev, show: true, dept, loading: true }))
      const positions = await getPositionsByDepartment(dept._id)
      setPosModal(prev => ({
        ...prev,
        positions: positions as any,
        loading: false,
      }))
    } catch (err) {
      setPosModal(prev => ({ ...prev, loading: false }))
    }
  }

  const closePositionsModal = () => {
    setPosModal({
      show: false,
      dept: null,
      positions: [],
      loading: false,
    })
  }

  const filteredEmployees = empModal.employees.filter(e =>
    e.name.toLowerCase().includes(empModal.searchEmp.toLowerCase()) ||
    e.email.toLowerCase().includes(empModal.searchEmp.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phòng Ban</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý {departments.length} phòng ban, {totalEmployees} nhân viên, {totalPositions} chức vụ
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm Phòng Ban
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên phòng ban hoặc trưởng phòng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có phòng ban nào</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tên Phòng Ban</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trưởng Phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Số NV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Số Chức Vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(dept => (
                  <tr key={dept._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        {dept.description && (
                          <p className="text-sm text-gray-500">{dept.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {dept.head ? (
                        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 inline-block">
                          <p className="font-medium text-blue-900">{dept.head.name}</p>
                          <p className="text-xs text-blue-600">{dept.head.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEmployeesModal(dept)}
                        className="text-blue-600 hover:text-blue-900 hover:underline font-medium"
                      >
                        {dept.employeeCount}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openPositionsModal(dept)}
                        className="text-blue-600 hover:text-blue-900 hover:underline font-medium flex items-center gap-1"
                      >
                        <Briefcase size={16} />
                        {dept.positionCount}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2 flex">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeletingDept(dept)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Form Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modal.mode === 'create' ? 'Tạo Phòng Ban Mới' : 'Sửa Phòng Ban'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Phòng Ban *</label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vd: Kỹ thuật..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modal.submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
                <textarea
                  value={modal.description}
                  onChange={e => setModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả phòng ban..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modal.submitting}
                />
              </div>

              {/* Trưởng Phòng - always show, but content depends on mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng Phòng</label>

                {/* CREATE mode: disabled, no dept yet */}
                {modal.mode === 'create' && (
                  <>
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                    >
                      <option value="">-- Chưa có nhân viên --</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Gán trưởng phòng sau khi tạo phòng ban
                    </p>
                  </>
                )}

                {/* EDIT mode: show employees of this department */}
                {modal.mode === 'edit' && (
                  <>
                    <select
                      value={modal.headEmployeeId || ''}
                      onChange={e =>
                        setModal(prev => ({
                          ...prev,
                          headEmployeeId: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={modal.submitting || modal.deptEmployeesLoading}
                    >
                      <option value="">-- Chọn Trưởng Phòng --</option>
                      {modal.deptEmployeesLoading ? (
                        <option disabled>Đang tải...</option>
                      ) : modal.deptEmployees.length === 0 ? (
                        <option disabled>Không có nhân viên trong phòng</option>
                      ) : (
                        modal.deptEmployees.map(e => (
                          <option key={e._id} value={e._id}>
                            {e.name} ({e.employeeId})
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Trưởng phòng phải là nhân viên của phòng ban này
                    </p>
                  </>
                )}
              </div>

              {modal.error && (
                <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{modal.error}</div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={modal.submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={modal.submitting}
                >
                  {modal.submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees Modal */}
      {empModal.show && empModal.dept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Nhân viên - {empModal.dept.name}
              </h2>
              <button
                onClick={closeEmployeesModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Tìm kiếm tên hoặc email..."
              value={empModal.searchEmp}
              onChange={e => setEmpModal(prev => ({ ...prev, searchEmp: e.target.value }))}
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {empModal.loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có nhân viên nào</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Tên</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">SDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEmployees.map(emp => {
                    const isHead = empModal.dept?.head?.email === emp.email
                    return (
                      <tr
                        key={emp._id}
                        className={isHead ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      >
                        <td className={`px-4 py-2 ${isHead ? 'font-bold text-blue-900' : 'text-gray-900'}`}>
                          {emp.name}
                          {isHead && <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs font-semibold">Trưởng phòng</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{emp.email}</td>
                        <td className="px-4 py-2 text-gray-600">{emp.phone}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Positions Modal */}
      {posModal.show && posModal.dept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Chức Vụ - {posModal.dept.name}
              </h2>
              <button
                onClick={closePositionsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {posModal.loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            ) : posModal.positions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có chức vụ nào</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Tên Chức Vụ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Lương</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {posModal.positions.map(pos => (
                    <tr key={pos._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{pos.name}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrency(pos.baseSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            {/* Blocked: has employees */}
            {deletingDept.employeeCount > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Không thể xóa</h2>
                </div>
                <p className="text-gray-600 mb-2">
                  Phòng ban <strong>{deletingDept.name}</strong> đang có{' '}
                  <strong>{deletingDept.employeeCount} nhân viên</strong>.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Hãy chuyển hoặc xóa hết nhân viên trước khi xóa phòng ban.
                </p>
                <button
                  onClick={() => setDeletingDept(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </>
            ) : (
              <>
                {/* Safe to delete */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa Phòng Ban</h2>
                <p className="text-gray-600 mb-6">
                  Bạn có chắc muốn xóa phòng ban <strong>{deletingDept.name}</strong>?
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    Hành động này không thể hoàn tác.
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingDept(null)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={modal.submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {modal.submitting ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { Edit, Plus, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDepartments, type Department } from '../services/departmentService'
import {
    createPosition,
    deletePosition,
    getPositionEmployees,
    getPositions,
    updatePosition,
    type Position,
    type PositionEmployee,
} from '../services/positionService'

interface ModalState {
  show: boolean
  mode: 'create' | 'edit'
  position: Position | null
  name: string
  departmentId: string
  baseSalary: string
  submitting: boolean
  error: string | null
}

interface EmployeesModalState {
  show: boolean
  position: Position | null
  employees: PositionEmployee[]
  loading: boolean
}

export default function Positions() {
  // ─── State: Position List ────────────────────────────────────────────────
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')

  // ─── State: Form Modal ───────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({
    show: false,
    mode: 'create',
    position: null,
    name: '',
    departmentId: '',
    baseSalary: '',
    submitting: false,
    error: null,
  })

  // ─── State: Employees Modal ─────────────────────────────────────────────
  const [empModal, setEmpModal] = useState<EmployeesModalState>({
    show: false,
    position: null,
    employees: [],
    loading: false,
  })

  // ─── State: Delete confirmation ──────────────────────────────────────────
  const [deletingPos, setDeletingPos] = useState<Position | null>(null)

  // ─── Load Data ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [posList, deptList] = await Promise.all([
        getPositions().catch(() => []),
        getDepartments().catch(() => []),
      ])
      setPositions(posList)
      setDepartments(deptList)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ─── Filter ─────────────────────────────────────────────────────────────
  const filtered = positions
    .filter(p => {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchDept = !filterDept || p.departmentId === filterDept
      return matchName && matchDept
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // ─── Stats ──────────────────────────────────────────────────────────────
  const totalEmployees = positions.reduce((sum, p) => sum + p.employeeCount, 0)
  const totalPositions = positions.length

  // ─── Modal Handlers ─────────────────────────────────────────────────────
  const openCreateModal = () => {
    setModal({
      show: true,
      mode: 'create',
      position: null,
      name: '',
      departmentId: departments[0]?._id || '',
      baseSalary: '',
      submitting: false,
      error: null,
    })
  }

  const openEditModal = (pos: Position) => {
    setModal({
      show: true,
      mode: 'edit',
      position: pos,
      name: pos.name,
      departmentId: pos.departmentId,
      baseSalary: String(pos.baseSalary || 0),
      submitting: false,
      error: null,
    })
  }

  const closeModal = () => {
    setModal({
      show: false,
      mode: 'create',
      position: null,
      name: '',
      departmentId: '',
      baseSalary: '',
      submitting: false,
      error: null,
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setModal(prev => ({ ...prev, error: null }))

    if (!modal.name.trim()) {
      setModal(prev => ({ ...prev, error: 'Position name is required' }))
      return
    }

    if (!modal.departmentId) {
      setModal(prev => ({ ...prev, error: 'Department is required' }))
      return
    }

    const baseSalaryNum = modal.baseSalary ? Number(modal.baseSalary) : 0
    if (baseSalaryNum < 0) {
      setModal(prev => ({ ...prev, error: 'Base salary must be positive' }))
      return
    }

    try {
      setModal(prev => ({ ...prev, submitting: true }))

      if (modal.mode === 'create') {
        await createPosition(modal.name, modal.departmentId, baseSalaryNum)
      } else if (modal.position) {
        await updatePosition(modal.position._id, modal.name, modal.departmentId, baseSalaryNum)
      }

      await loadData()
      closeModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed'
      setModal(prev => ({ ...prev, error: message }))
    } finally {
      setModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const handleDelete = async () => {
    if (!deletingPos) return

    try {
      setModal(prev => ({ ...prev, submitting: true }))
      await deletePosition(deletingPos._id)
      await loadData()
      setDeletingPos(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      setModal(prev => ({ ...prev, error: message }))
    } finally {
      setModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const openEmployeesModal = async (pos: Position) => {
    try {
      setEmpModal(prev => ({ ...prev, show: true, position: pos, loading: true }))
      const data = await getPositionEmployees(pos._id)
      setEmpModal(prev => ({
        ...prev,
        employees: data.employees,
        loading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load employees'
      setEmpModal(prev => ({ ...prev, error: message, loading: false }))
    }
  }

  const closeEmployeesModal = () => {
    setEmpModal({ show: false, position: null, employees: [], loading: false })
  }

  const getDeptName = (deptId: string) => {
    return departments.find(d => d._id === deptId)?.name || 'N/A'
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Chức Vụ</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý {totalPositions} chức vụ, {totalEmployees} nhân viên
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm Chức Vụ
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Tìm tên chức vụ..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map(d => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
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
            <div className="text-center py-8 text-gray-500">Không có chức vụ nào</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Chức Vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phòng Ban</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Lương Cơ Bản</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Số NV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(pos => (
                  <tr key={pos._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pos.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pos.departmentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(pos.baseSalary)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <button
                        onClick={() => openEmployeesModal(pos)}
                        className="text-blue-600 hover:text-blue-900 hover:underline flex items-center gap-1"
                      >
                        <Users size={16} />
                        {pos.employeeCount}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2 flex">
                      <button
                        onClick={() => openEditModal(pos)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeletingPos(pos)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modal.mode === 'create' ? 'Tạo Chức Vụ Mới' : 'Sửa Chức Vụ'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Chức Vụ *</label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vd: Quản lý..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modal.submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng Ban *</label>
                <select
                  value={modal.departmentId}
                  onChange={e => setModal(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modal.submitting}
                >
                  <option value="">-- Chọn Phòng Ban --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lương Cơ Bản</label>
                <input
                  type="number"
                  value={modal.baseSalary}
                  onChange={e => setModal(prev => ({ ...prev, baseSalary: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={modal.submitting}
                />
              </div>

              {modal.error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{modal.error}</div>}

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
      {empModal.show && empModal.position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Nhân viên - {empModal.position.name}
              </h2>
              <button
                onClick={closeEmployeesModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {empModal.loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            ) : empModal.employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có nhân viên nào</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Tên</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Phòng Ban</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">SDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {empModal.employees.map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-2 text-gray-600">{emp.email}</td>
                      <td className="px-4 py-2 text-gray-600">{emp.department}</td>
                      <td className="px-4 py-2 text-gray-600">{emp.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingPos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa Chức Vụ</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa chức vụ <strong>{deletingPos.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPos(null)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={modal.submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={modal.submitting}
              >
                {modal.submitting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

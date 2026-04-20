import { Check, Edit, Eye, Trash2, User, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { adminService, type Employee } from '../services/adminService'
import { getPositionsByDepartment } from '../services/positionService'

const GENDERS = [
  { value: 'MALE', labelVi: 'Nam', labelEn: 'Male' },
  { value: 'FEMALE', labelVi: 'Nữ', labelEn: 'Female' },
  { value: 'OTHER', labelVi: 'Khác', labelEn: 'Other' },
]

interface Position {
  _id: string
  name: string
  baseSalary: number
}

interface Department {
  _id: string
  name: string
}

interface CreateFormData {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  dateOfBirth: string
  gender: string
  department: string
  departmentId: string
  position: string
  positionId: string
  hireDate: string
  baseSalary: string
  street: string
  city: string
  province: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

const emptyForm = (): CreateFormData => ({
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  department: '',
  departmentId: '',
  position: '',
  positionId: '',
  hireDate: new Date().toISOString().split('T')[0],
  baseSalary: '',
  street: '',
  city: '',
  province: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
})

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [departmentObjects, setDepartmentObjects] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null)

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateFormData>(emptyForm())
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [empData, deptData] = await Promise.all([
        adminService.getAllEmployees(),
        adminService.getAllDepartments(),
      ])
      setEmployees(empData.employees || [])
      const depts: Department[] = deptData.departments || []
      setDepartmentObjects(depts)
      setDepartments(depts.map((d: Department) => d.name) || [])
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ─── Form helpers ────────────────────────────────────────────────────
  const setField = (field: keyof CreateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDepartmentChange = async (deptName: string) => {
    setField('department', deptName)
    setField('position', '')   // reset position on dept change
    setField('positionId', '')
    setField('baseSalary', '')
    setPositions([])

    if (!deptName) return

    try {
      const dept = departmentObjects.find((d: Department) => d.name === deptName)
      if (!dept) return

      setField('departmentId', dept._id)

      const deptPositions = await getPositionsByDepartment(dept._id)
      setPositions(deptPositions as Position[])
    } catch (err) {
      console.error('Failed to load positions:', err)
    }
  }

  const handlePositionChange = (positionId: string) => {
    setField('positionId', positionId)

    if (!positionId) {
      setField('position', '')
      setField('baseSalary', '')
      return
    }

    const selectedPos = positions.find(p => p._id === positionId)
    if (selectedPos) {
      setField('position', selectedPos.name)
      setField('baseSalary', selectedPos.baseSalary.toString())
    }
  }

  const openCreate = () => {
    setFormMode('create')
    setFormData(emptyForm())
    setFormError(null)
    setFormSuccess(null)
    setShowFormModal(true)
  }

  const openEdit = async (emp: Employee) => {
    setFormMode('edit')
    setFormError(null)
    setFormSuccess(null)

    const parts = emp.name?.split(' ') || []
    const lastName = parts.slice(1).join(' ') || ''
    const firstName = parts[0] || ''

    // Default form: reset position to empty until positions are loaded
    setFormData({
      employeeId: emp.employeeId || '',
      firstName,
      lastName,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      dateOfBirth: '',
      gender: '',
      department: emp.department || '',
      departmentId: '',
      position: emp.position || '',
      positionId: '', // will be set after positions load
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: '',
      street: '',
      city: '',
      province: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
    })
    setPositions([])

    // Load positions of this department to set positionId + baseSalary correctly
    if (emp.department && emp.department !== 'N/A') {
      try {
        const dept = departmentObjects.find((d: Department) => d.name === emp.department)
        if (dept) {
          const deptPositions = await getPositionsByDepartment(dept._id)
          const loadedPositions = deptPositions as Position[]
          setPositions(loadedPositions)

          // Find matching position → set positionId + baseSalary
          const matchedPos = loadedPositions.find(p => p.name === emp.position)
          if (matchedPos) {
            setFormData(prev => ({
              ...prev,
              departmentId: dept._id,
              positionId: matchedPos._id,
              baseSalary: matchedPos.baseSalary.toString(),
            }))
          } else {
            // Position name didn't match (maybe position was renamed)
            // Try by position name directly
            const fallback = loadedPositions.find(p => p.name === emp.position)
            setFormData(prev => ({ ...prev, departmentId: dept._id }))
          }
        }
      } catch (err) {
        console.error('Failed to load positions for edit:', err)
      }
    }

    setDetailEmployee(emp)
    setShowFormModal(true)
    setShowDetailModal(false)
  }

  const closeForm = () => {
    setShowFormModal(false)
    setFormData(emptyForm())
    setFormError(null)
    setFormSuccess(null)
    setShowPassword(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Họ và tên là bắt buộc')
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email là bắt buộc')
      return
    }
    if (formMode === 'create' && !formData.positionId) {
      setFormError('Phải chọn chức vụ trước khi thêm nhân viên')
      return
    }
    if (formMode === 'edit') {
      // Enforce PB(1)-(N)NV: employee must have a position
      if (!formData.positionId) {
        setFormError('Mỗi nhân viên phải thuộc một chức vụ. Vui lòng chọn chức vụ.')
        return
      }
    }

    try {
      setFormLoading(true)
      setFormError(null)

      if (formMode === 'create') {
        const result = await adminService.createEmployee({
          employeeId: formData.employeeId || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password || undefined,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          department: formData.department,
          position: formData.position,
          hireDate: formData.hireDate || undefined,
          baseSalary: formData.baseSalary ? Number(formData.baseSalary) : undefined,
          street: formData.street,
          city: formData.city,
          province: formData.province,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          emergencyRelation: formData.emergencyRelation,
        })
        setFormSuccess(
          `✅ Thêm nhân viên thành công!\n\n` +
          `📧 Email: ${result.accountInfo.email}\n` +
          `🔑 Mật khẩu: ${result.accountInfo.defaultPassword}\n` +
          `📋 Mã NV: ${result.employeeId}\n\n` +
          `Hãy cung cấp thông tin đăng nhập cho nhân viên.`
        )
      } else if (formMode === 'edit' && detailEmployee) {
        await adminService.updateEmployee(detailEmployee._id, {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          department: formData.department,
          departmentId: formData.departmentId,
          position: formData.position,
          positionId: formData.positionId,
          phone: formData.phone,
        })
        setFormSuccess('✅ Cập nhật nhân viên thành công!')
      }

      await loadData()
    } catch (err: Error | unknown) {
      setFormError(err instanceof Error ? err.message : 'Lỗi khi lưu nhân viên')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Xóa nhân viên "${emp.name}"?\n\nHành động này không thể hoàn tác.`)) return
    try {
      setDeletingEmployeeId(emp._id)
      await adminService.deleteEmployee(emp._id)
      await loadData()
    } catch (err: Error | unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa nhân viên')
    } finally {
      setDeletingEmployeeId(null)
    }
  }

  const formatVND = (val?: number | null) => {
    if (!val) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // ─── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Đang tải...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng: {employees.length} nhân viên</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm"
        >
          <UserPlus size={16} />
          Thêm Nhân Viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng Nhân Viên', value: employees.length, color: 'text-blue-600' },
          { label: 'Đã Phân Phòng', value: employees.filter(e => e.department && e.department !== 'N/A').length, color: 'text-green-600' },
          { label: 'Chưa Phân Phòng', value: employees.filter(e => !e.department || e.department === 'N/A').length, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email hoặc mã nhân viên..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Mã NV', 'Họ Tên', 'Email', 'Chức Vụ', 'Phòng Ban', 'Thao Tác'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Không tìm thấy nhân viên nào
                </td>
              </tr>
            ) : filteredEmployees.map(emp => (
              <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{emp.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.position || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.department && emp.department !== 'N/A' ? (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{emp.department}</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Chưa phân</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button onClick={() => { setDetailEmployee(emp); setShowDetailModal(true) }}
                    className="px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-medium cursor-pointer">
                    <Eye size={13} className="inline" />
                  </button>
                  <button onClick={() => openEdit(emp)}
                    className="px-3 py-1 rounded-md border border-green-300 text-green-600 hover:bg-green-50 text-xs font-medium cursor-pointer">
                    <Edit size={13} className="inline" />
                  </button>
                  <button onClick={() => handleDelete(emp)} disabled={deletingEmployeeId === emp._id}
                    className="px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer disabled:opacity-50">
                    {deletingEmployeeId === emp._id ? '...' : <Trash2 size={13} className="inline" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── DETAIL MODAL ────────────────────────────────────────────────── */}
      {showDetailModal && detailEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detailEmployee.name}</h2>
                  <p className="text-sm text-gray-500">{detailEmployee.employeeId}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Liên hệ</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Email', value: detailEmployee.email },
                    { label: 'Điện thoại', value: detailEmployee.phone || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28">{row.label}</span>
                      <span className="text-sm text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Công việc</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Chức vụ', value: detailEmployee.position || '—' },
                    { label: 'Phòng ban', value: detailEmployee.department || 'Chưa phân phòng' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28">{row.label}</span>
                      <span className="text-sm text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                Đóng
              </button>
              <button onClick={() => openEdit(detailEmployee)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE/EDIT MODAL ──────────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && !formSuccess && closeForm()}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {formMode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formMode === 'create'
                    ? 'Nhân viên mới sẽ được tạo tài khoản tự động'
                    : 'Chỉ cập nhật một số thông tin cơ bản'}
                </p>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Success */}
            {formSuccess ? (
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <pre className="text-sm text-green-700 whitespace-pre-wrap font-sans">{formSuccess}</pre>
                </div>
                <div className="flex gap-3">
                  <button onClick={closeForm}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">
                    Đóng
                  </button>
                  {formMode === 'create' && (
                    <button onClick={() => { setFormSuccess(null); setFormData(emptyForm()); setFormError(null) }}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">
                      Thêm nhân viên khác
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} autoComplete="off" className="p-6 space-y-5 overflow-y-auto flex-1">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{formError}</div>
                )}

                {/* ── Thông tin cá nhân ── */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin cá nhân</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Họ <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.lastName} onChange={e => setField('lastName', e.target.value)}
                        placeholder="VD: Nguyễn"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tên <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.firstName} onChange={e => setField('firstName', e.target.value)}
                        placeholder="VD: Văn A"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={formData.email} onChange={e => setField('email', e.target.value)}
                        placeholder="VD: nguyenvana@company.com"
                        autoComplete="off"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                      <input type="tel" value={formData.phone} onChange={e => setField('phone', e.target.value)}
                        placeholder="VD: 0912345678"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
                      <input type="date" value={formData.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Giới tính</label>
                      <select value={formData.gender} onChange={e => setField('gender', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="">— Chọn —</option>
                        {GENDERS.map(g => (
                          <option key={g.value} value={g.value}>{g.labelVi}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Địa chỉ ── */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Địa chỉ</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Đường/Số nhà</label>
                      <input type="text" value={formData.street} onChange={e => setField('street', e.target.value)}
                        placeholder="VD: 123 Đường ABC, Phường X"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                        <input type="text" value={formData.city} onChange={e => setField('city', e.target.value)}
                          placeholder="VD: TP.HCM"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quận/Huyện</label>
                        <input type="text" value={formData.province} onChange={e => setField('province', e.target.value)}
                          placeholder="VD: Quận 1"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Thông tin công việc ── */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin công việc</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mã nhân viên</label>
                      <input type="text" value={formData.employeeId} onChange={e => setField('employeeId', e.target.value)}
                        placeholder="Tự động nếu để trống"
                        disabled={formMode === 'edit'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phòng ban <span className="text-red-500">*</span></label>
                      <select value={formData.department} onChange={e => handleDepartmentChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="">— Chọn phòng ban —</option>
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Chức vụ <span className="text-red-500">*</span></label>
                      <select value={formData.positionId} onChange={e => handlePositionChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        disabled={!formData.department || positions.length === 0}>
                        <option value="">— Chọn chức vụ —</option>
                        {positions.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      {!formData.department && (
                        <p className="text-xs text-gray-400 mt-1">Chọn phòng ban trước</p>
                      )}
                      {formData.department && positions.length === 0 && (
                        <p className="text-xs text-orange-500 mt-1">Phòng ban này chưa có chức vụ nào</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngày vào làm</label>
                      <input type="date" value={formData.hireDate} onChange={e => setField('hireDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Lương cơ bản (VNĐ)
                        {formData.positionId && <span className="text-green-600 ml-1">(Từ chức vụ)</span>}
                      </label>
                      <input 
                        type="number" 
                        value={formData.baseSalary} 
                        onChange={e => setField('baseSalary', e.target.value)}
                        placeholder={formData.positionId ? 'Tự động từ chức vụ' : 'VD: 15000000'}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.positionId ? 'bg-blue-50' : ''}`} 
                      />
                      {formData.positionId && (
                        <p className="text-xs text-green-600 mt-1">💡 Lương được tự động điền từ chức vụ đã chọn</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Tài khoản đăng nhập (chỉ khi tạo mới) ── */}
                {formMode === 'create' && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tài khoản đăng nhập</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mật khẩu</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => setField('password', e.target.value)}
                          placeholder="Để trống → dùng mật khẩu mặc định: Welcome@2026"
                          autoComplete="new-password"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline cursor-pointer">
                          {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Mặc định: <strong>Welcome@2026</strong> nếu để trống
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Liên hệ khẩn cấp ── */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Liên hệ khẩn cấp</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Người liên hệ</label>
                      <input type="text" value={formData.emergencyName} onChange={e => setField('emergencyName', e.target.value)}
                        placeholder="VD: Nguyễn Văn B (vợ/chồng)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                        <input type="tel" value={formData.emergencyPhone} onChange={e => setField('emergencyPhone', e.target.value)}
                          placeholder="VD: 0987654321"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quan hệ</label>
                        <input type="text" value={formData.emergencyRelation} onChange={e => setField('emergencyRelation', e.target.value)}
                          placeholder="VD: Vợ, Chồng, Cha..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-2 border-t border-gray-100 flex-shrink-0">
                  <button type="button" onClick={closeForm}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                    Hủy
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                    {formLoading ? (
                      <><span className="animate-spin">⏳</span><span>Đang lưu...</span></>
                    ) : (
                      <><Check size={16} /><span>{formMode === 'create' ? 'Thêm Nhân Viên' : 'Lưu Thay Đổi'}</span></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

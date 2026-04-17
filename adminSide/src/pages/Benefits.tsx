import { Edit, Plus, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
    createBenefit,
    createEmployeeBenefit,
    deleteBenefit,
    deleteEmployeeBenefit,
    getAllBenefits,
    getAllEmployeeBenefits,
    getBenefitEmployees,
    updateBenefit,
    updateEmployeeBenefit,
    type Benefit,
    type BenefitEmployee,
    type EmployeeBenefit,
} from '../services/benefitService'
import { getEmployees, type Employee } from '../services/employeeService'

interface BenefitModalState {
  show: boolean
  mode: 'create' | 'edit'
  benefit: Benefit | null
  name: string
  type: 'fixed' | 'percent' | 'custom'
  value: string
  submitting: boolean
  error: string | null
}

interface EmployeesModalState {
  show: boolean
  benefit: Benefit | null
  employees: BenefitEmployee[]
  loading: boolean
}

interface EmployeeBenefitModalState {
  show: boolean
  mode: 'create' | 'edit'
  employeeBenefit: EmployeeBenefit | null
  employeeId: string
  benefitId: string
  startDate: string
  endDate: string
  submitting: boolean
  error: string | null
}

export default function Benefits() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'benefits' | 'assignments'>('benefits')

  // ─── State: Benefits List ────────────────────────────────────────────────
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeBenefits, setEmployeeBenefits] = useState<EmployeeBenefit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermEB, setSearchTermEB] = useState('')

  // ─── State: Benefit Modal ────────────────────────────────────────────────
  const [modal, setModal] = useState<BenefitModalState>({
    show: false,
    mode: 'create',
    benefit: null,
    name: '',
    type: 'fixed',
    value: '',
    submitting: false,
    error: null,
  })

  // ─── State: Employees Modal ─────────────────────────────────────────────
  const [empModal, setEmpModal] = useState<EmployeesModalState>({
    show: false,
    benefit: null,
    employees: [],
    loading: false,
  })

  // ─── State: Employee Benefit Modal ──────────────────────────────────────
  const [ebModal, setEbModal] = useState<EmployeeBenefitModalState>({
    show: false,
    mode: 'create',
    employeeBenefit: null,
    employeeId: '',
    benefitId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    submitting: false,
    error: null,
  })

  // ─── State: Delete confirmation ──────────────────────────────────────────
  const [deletingBenefit, setDeletingBenefit] = useState<Benefit | null>(null)
  const [deletingEB, setDeletingEB] = useState<EmployeeBenefit | null>(null)

  // ─── Load Data ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [benefitList, empList, ebList] = await Promise.all([
        getAllBenefits().catch(() => []),
        getEmployees().catch(() => []),
        getAllEmployeeBenefits().catch(() => []),
      ])
      setBenefits(benefitList)
      setEmployees(empList)
      setEmployeeBenefits(ebList)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // ─── Filter ─────────────────────────────────────────────────────────────
  const filteredBenefits = benefits
    .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const filteredEmployeeBenefits = employeeBenefits
    .filter(eb => 
      eb.employeeName.toLowerCase().includes(searchTermEB.toLowerCase()) ||
      eb.benefitName.toLowerCase().includes(searchTermEB.toLowerCase())
    )
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  // ─── Benefit Modal Handlers ──────────────────────────────────────────────
  const openCreateBenefit = () => {
    setModal({
      show: true,
      mode: 'create',
      benefit: null,
      name: '',
      type: 'fixed',
      value: '',
      submitting: false,
      error: null,
    })
  }

  const openEditBenefit = (benefit: Benefit) => {
    setModal({
      show: true,
      mode: 'edit',
      benefit,
      name: benefit.name,
      type: benefit.type,
      value: benefit.value.toString(),
      submitting: false,
      error: null,
    })
  }

  const closeBenefitModal = () => {
    setModal({
      show: false,
      mode: 'create',
      benefit: null,
      name: '',
      type: 'fixed',
      value: '',
      submitting: false,
      error: null,
    })
  }

  const handleSaveBenefit = async () => {
    if (!modal.name.trim()) {
      setModal(prev => ({ ...prev, error: 'Tên phúc lợi không được để trống' }))
      return
    }

    if (!modal.value || Number(modal.value) <= 0) {
      setModal(prev => ({ ...prev, error: 'Giá trị phúc lợi phải lớn hơn 0' }))
      return
    }

    try {
      setModal(prev => ({ ...prev, submitting: true, error: null }))

      if (modal.mode === 'create') {
        await createBenefit({
          name: modal.name,
          type: modal.type,
          value: Number(modal.value),
        })
      } else if (modal.benefit) {
        await updateBenefit(modal.benefit.id, {
          name: modal.name,
          type: modal.type,
          value: Number(modal.value),
        })
      }

      await loadData()
      closeBenefitModal()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu phúc lợi'
      setModal(prev => ({ ...prev, error: msg }))
    } finally {
      setModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // ─── Show Employees Modal ───────────────────────────────────────────────
  const showEmployeesList = async (benefit: Benefit) => {
    try {
      setEmpModal({ show: true, benefit, employees: [], loading: true })
      const emps = await getBenefitEmployees(benefit.id)
      setEmpModal(prev => ({ ...prev, employees: emps, loading: false }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách nhân viên'
      setEmpModal(prev => ({ ...prev, loading: false }))
      alert(msg)
    }
  }

  // ─── Delete Benefit ─────────────────────────────────────────────────────
  const handleDeleteBenefit = async (benefit: Benefit) => {
    try {
      await deleteBenefit(benefit.id)
      await loadData()
      setDeletingBenefit(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa phúc lợi'
      alert(msg)
    }
  }

  // ─── Employee Benefit Modal Handlers ─────────────────────────────────────
  const openCreateEB = () => {
    setEbModal({
      show: true,
      mode: 'create',
      employeeBenefit: null,
      employeeId: '',
      benefitId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      submitting: false,
      error: null,
    })
  }

  const openEditEB = (eb: EmployeeBenefit) => {
    setEbModal({
      show: true,
      mode: 'edit',
      employeeBenefit: eb,
      employeeId: eb.employeeName, // Store for display
      benefitId: eb.benefitName,   // Store for display
      startDate: eb.startDate,
      endDate: eb.endDate || '',
      submitting: false,
      error: null,
    })
  }

  const closeEBModal = () => {
    setEbModal({
      show: false,
      mode: 'create',
      employeeBenefit: null,
      employeeId: '',
      benefitId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      submitting: false,
      error: null,
    })
  }

  const handleSaveEB = async () => {
    if (!ebModal.employeeId || !ebModal.benefitId) {
      setEbModal(prev => ({ ...prev, error: 'Vui lòng chọn nhân viên và phúc lợi' }))
      return
    }

    if (!ebModal.startDate) {
      setEbModal(prev => ({ ...prev, error: 'Vui lòng chọn ngày bắt đầu' }))
      return
    }

    try {
      setEbModal(prev => ({ ...prev, submitting: true, error: null }))

      if (ebModal.mode === 'create') {
        await createEmployeeBenefit({
          employeeId: ebModal.employeeId,
          benefitId: ebModal.benefitId,
          startDate: ebModal.startDate,
        })
      } else if (ebModal.employeeBenefit) {
        await updateEmployeeBenefit(ebModal.employeeBenefit.id, {
          startDate: ebModal.startDate,
          endDate: ebModal.endDate || null,
        })
      }

      await loadData()
      closeEBModal()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu gán phúc lợi'
      setEbModal(prev => ({ ...prev, error: msg }))
    } finally {
      setEbModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // ─── Delete Employee Benefit ───────────────────────────────────────────
  const handleDeleteEB = async (eb: EmployeeBenefit) => {
    try {
      await deleteEmployeeBenefit(eb.id)
      await loadData()
      setDeletingEB(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa gán phúc lợi'
      alert(msg)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'vi' ? 'Quản lý Phúc lợi' : 'Benefits Management'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('benefits')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'benefits'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {language === 'vi' ? 'Phúc lợi' : 'Benefits'}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {language === 'vi' ? 'Gán Phúc lợi' : 'Assign Benefits'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              {/* Header with Action Button */}
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm kiếm phúc lợi...' : 'Search benefits...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={openCreateBenefit}
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  {language === 'vi' ? 'Thêm Phúc lợi' : 'Add Benefit'}
                </button>
              </div>

              {/* Benefits Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Tên phúc lợi' : 'Name'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Loại' : 'Type'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Giá trị' : 'Value'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Số NV' : 'Employees'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Thao tác' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBenefits.map(benefit => (
                      <tr key={benefit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{benefit.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {benefit.type === 'fixed' ? '固定' : benefit.type === 'percent' ? '%' : 'Tùy chỉnh'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {benefit.type === 'percent'
                            ? `${benefit.value}%`
                            : formatCurrency(benefit.value)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{benefit.employeeCount}</td>
                        <td className="px-6 py-4 text-sm space-x-2 flex">
                          <button
                            onClick={() => showEmployeesList(benefit)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title={language === 'vi' ? 'Xem nhân viên' : 'View employees'}
                          >
                            <Users size={18} />
                          </button>
                          <button
                            onClick={() => openEditBenefit(benefit)}
                            className="text-amber-600 hover:text-amber-900 p-1"
                            title={language === 'vi' ? 'Sửa' : 'Edit'}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeletingBenefit(benefit)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title={language === 'vi' ? 'Xóa' : 'Delete'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {/* Header with Action Button */}
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  value={searchTermEB}
                  onChange={e => setSearchTermEB(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={openCreateEB}
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  {language === 'vi' ? 'Gán Phúc lợi' : 'Assign Benefit'}
                </button>
              </div>

              {/* Employee Benefits Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Nhân viên' : 'Employee'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Phúc lợi' : 'Benefit'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Loại' : 'Type'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Số tiền' : 'Amount'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Ngày kết thúc' : 'End Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {language === 'vi' ? 'Thao tác' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEmployeeBenefits.map(eb => (
                      <tr key={eb.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {eb.employeeName}
                          <div className="text-xs text-gray-500">{eb.employeeCode}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{eb.benefitName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {eb.type === 'percent' ? '%' : 'Fixed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {eb.type === 'percent' ? `${eb.amount}%` : formatCurrency(eb.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(eb.startDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {eb.endDate ? formatDate(eb.endDate) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2 flex">
                          <button
                            onClick={() => openEditEB(eb)}
                            className="text-amber-600 hover:text-amber-900 p-1"
                            title={language === 'vi' ? 'Sửa' : 'Edit'}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeletingEB(eb)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title={language === 'vi' ? 'Xóa' : 'Delete'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Modals ─── */}

      {/* Benefit Form Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modal.mode === 'create'
                  ? language === 'vi'
                    ? 'Thêm Phúc lợi'
                    : 'Add Benefit'
                  : language === 'vi'
                  ? 'Sửa Phúc lợi'
                  : 'Edit Benefit'}
              </h2>
              <button
                onClick={closeBenefitModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modal.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {modal.error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'vi' ? 'Tên phúc lợi' : 'Benefit Name'} *
                </label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Ăn trưa, Điều hòa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'vi' ? 'Loại' : 'Type'} *
                </label>
                <select
                  value={modal.type}
                  onChange={e => setModal(prev => ({ ...prev, type: e.target.value as 'fixed' | 'percent' | 'custom' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed (固定)</option>
                  <option value="percent">Percent (%)</option>
                  <option value="custom">Custom (Tùy chỉnh)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'vi' ? 'Giá trị' : 'Value'} *
                  {modal.type === 'percent' && ' (%)'}
                </label>
                <input
                  type="number"
                  value={modal.value}
                  onChange={e => setModal(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={modal.type === 'percent' ? 'e.g., 10' : 'e.g., 500000'}
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-2 p-6 border-t border-gray-200 justify-end">
              <button
                onClick={closeBenefitModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={modal.submitting}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveBenefit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={modal.submitting}
              >
                {modal.submitting ? '...' : language === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Benefit Form Modal */}
      {ebModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {ebModal.mode === 'create'
                  ? language === 'vi'
                    ? 'Gán Phúc lợi'
                    : 'Assign Benefit'
                  : language === 'vi'
                  ? 'Sửa Gán Phúc lợi'
                  : 'Edit Assignment'}
              </h2>
              <button
                onClick={closeEBModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {ebModal.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {ebModal.error}
                </div>
              )}

              {ebModal.mode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'vi' ? 'Nhân viên' : 'Employee'} *
                    </label>
                    <select
                      value={ebModal.employeeId}
                      onChange={e => setEbModal(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{language === 'vi' ? 'Chọn nhân viên' : 'Select employee'}</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.personalInfo?.lastName} {emp.personalInfo?.firstName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'vi' ? 'Phúc lợi' : 'Benefit'} *
                    </label>
                    <select
                      value={ebModal.benefitId}
                      onChange={e => setEbModal(prev => ({ ...prev, benefitId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{language === 'vi' ? 'Chọn phúc lợi' : 'Select benefit'}</option>
                      {benefits.map(ben => (
                        <option key={ben.id} value={ben.id}>
                          {ben.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'vi' ? 'Ngày bắt đầu' : 'Start Date'} *
                </label>
                <input
                  type="date"
                  value={ebModal.startDate}
                  onChange={e => setEbModal(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'vi' ? 'Ngày kết thúc' : 'End Date'} ({language === 'vi' ? 'Không bắt buộc' : 'Optional'})
                </label>
                <input
                  type="date"
                  value={ebModal.endDate}
                  onChange={e => setEbModal(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 p-6 border-t border-gray-200 justify-end">
              <button
                onClick={closeEBModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={ebModal.submitting}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEB}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={ebModal.submitting}
              >
                {ebModal.submitting ? '...' : language === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employees Modal */}
      {empModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'vi' ? 'Nhân viên có phúc lợi' : 'Employees'}: {empModal.benefit?.name}
              </h2>
              <button
                onClick={() => setEmpModal(prev => ({ ...prev, show: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {empModal.loading ? (
                <div className="flex justify-center items-center h-32">
                  {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                </div>
              ) : empModal.employees.length === 0 ? (
                <p className="text-gray-500 text-center">
                  {language === 'vi' ? 'Không có nhân viên' : 'No employees'}
                </p>
              ) : (
                <div className="space-y-2">
                  {empModal.employees.map(emp => (
                    <div key={emp.id} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-900">{emp.employeeName}</div>
                      <div className="text-xs text-gray-500">{emp.employeeCode}</div>
                      <div className="text-xs text-gray-500">
                        {language === 'vi' ? 'Từ' : 'From'}: {formatDate(emp.startDate)}
                        {emp.endDate && ` - ${formatDate(emp.endDate)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setEmpModal(prev => ({ ...prev, show: false }))}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Benefit Confirmation */}
      {deletingBenefit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {language === 'vi' ? 'Xác nhận xóa phúc lợi?' : 'Delete benefit?'}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === 'vi'
                  ? `Bạn có chắc muốn xóa phúc lợi "${deletingBenefit.name}"?`
                  : `Are you sure you want to delete the benefit "${deletingBenefit.name}"?`}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeletingBenefit(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDeleteBenefit(deletingBenefit)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {language === 'vi' ? 'Xóa' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Benefit Confirmation */}
      {deletingEB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {language === 'vi' ? 'Xác nhận xóa gán phúc lợi?' : 'Delete assignment?'}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === 'vi'
                  ? `Bạn có chắc muốn xóa phúc lợi "${deletingEB.benefitName}" của nhân viên "${deletingEB.employeeName}"?`
                  : `Are you sure you want to delete the "${deletingEB.benefitName}" benefit from "${deletingEB.employeeName}"?`}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeletingEB(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDeleteEB(deletingEB)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {language === 'vi' ? 'Xóa' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

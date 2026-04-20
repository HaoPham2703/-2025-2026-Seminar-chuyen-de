import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
    getDepartmentEmployees,
    getDepartments,
    type Department,
    type DepartmentEmployee,
} from '../services/departmentService'
import {
    autoCalculatePayroll,
    createPayroll,
    createBulkPayroll,
    deletePayrolls,
    getAllPayrolls,
    getEmployeeOptions,
    revisePayroll,
    updatePayroll,
    type BulkPayrollResult,
    type EmployeeOption,
    type Payroll,
} from '../services/payrollService'
import { t } from '../utils/i18n'

const MONTHS_VI = [
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
  'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
]
const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const formatCurrency = (value: number, lang: string) => {
  return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  DRAFT: 'bg-gray-100 text-gray-600',
}

type ModalMode = 'create' | 'edit' | 'revise' | 'bulkCreate'

export default function Payroll() {
  const { language } = useLanguage()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingDepartmentEmployees, setLoadingDepartmentEmployees] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterEmployee, setFilterEmployee] = useState<string>('')
  const [filterEmployeeSearch, setFilterEmployeeSearch] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Form state
  const [formEmployee, setFormEmployee] = useState('')
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1)
  const [formYear, setFormYear] = useState(new Date().getFullYear())
  const [formBaseSalary, setFormBaseSalary] = useState('')
  const [formAllowances, setFormAllowances] = useState([{ name: '', amount: '' }])
  const [formDeductions, setFormDeductions] = useState([{ name: '', amount: '' }])
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PENDING' | 'APPROVED'>('APPROVED')
  const [formReason, setFormReason] = useState('')
  const [autoCalcSummary, setAutoCalcSummary] = useState<{
    totalWorkMinutes: number
    totalOvertimeMinutes: number
    lateCount: number
    absentCount: number
    attendanceDays: number
    standardWorkingDays: number
    overtimePay: number
    latePenalty: number
    absentPenalty: number
    disciplineAmount: number
    rewardAmount: number
    bhxh: number
    pit: number
    netSalary: number
    // Incident breakdown
    lateIncidents?: { date: string; lateMinutes: number }[]
    absentIncidents?: { date: string }[]
    disciplineBreakdown?: { type: string; description: string; amount: number }[]
    rewardBreakdown?: { approved: { title: string; type: string; amount: number; itemName: string | null }[]; pending: { title: string; type: string; amount: number; itemName: string | null }[] }
  } | null>(null)
  const [autoCalculating, setAutoCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState<{ id: string; name: string; department: string; email: string; code: string }[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkCreating, setBulkCreating] = useState(false)

  const months = language === 'vi' ? MONTHS_VI : MONTHS_EN
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const autoCalcFiredRef = useRef(false) // tránh gọi 2 lần do strictMode
  const autoCalcKeyRef = useRef('') // track: "empId-month-year" để không gọi lại cùng combo

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showFilterDropdown) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-filter-employee-dropdown]')) {
          setShowFilterDropdown(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterDropdown])

  // Tự động điền lương cơ bản khi chọn nhân viên
  useEffect(() => {
    if (!showModal || modalMode !== 'create' || !formEmployee) return
    const emp = employees.find(e => e.id === formEmployee)
    if (emp?.positionSalary) {
      setFormBaseSalary(String(emp.positionSalary))
    }
  }, [formEmployee, modalMode, showModal])

  // Tự động tính khi đã chọn đủ: nhân viên + tháng + năm (chỉ ở mode create, không lặp)
  useEffect(() => {
    if (!showModal || modalMode !== 'create' || !formEmployee || !formMonth || !formYear) return

    const key = `${formEmployee}-${formMonth}-${formYear}`
    if (key === autoCalcKeyRef.current) return // cùng combo → bỏ qua

    autoCalcKeyRef.current = key
    autoCalcFiredRef.current = true
    handleAutoCalculate()
  }, [showModal, modalMode, formEmployee, formMonth, formYear])

  useEffect(() => {
    loadData()
  }, [filterMonth, filterYear, filterEmployee, filterStatus])

  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [])

  useEffect(() => {
    if (modalMode === 'bulkCreate' && selectedDepartment) {
      loadDepartmentEmployees(selectedDepartment)
    }
  }, [modalMode, selectedDepartment])

  const modalTitle = useMemo(() => {
    if (modalMode === 'edit') return 'Sửa phiếu lương'
    if (modalMode === 'revise') return 'Điều chỉnh phiếu đã duyệt'
    return t('payroll.createTitle') || 'Tạo phiếu lương mới'
  }, [modalMode])

  const modalSubtitle = useMemo(() => {
    if (modalMode === 'edit') return 'Chỉ áp dụng cho phiếu DRAFT/PENDING'
    if (modalMode === 'revise') return 'Tạo phiên bản mới và lưu audit log'
    if (modalMode === 'bulkCreate') return 'Tạo phiếu lương cho nhiều nhân viên cùng lúc'
    return t('payroll.createSubtitle') || 'Điền thông tin bên dưới'
  }, [modalMode])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllPayrolls({
        month: filterMonth || undefined,
        year: filterYear || undefined,
        employeeId: filterEmployee || undefined,
        status: filterStatus || undefined,
      })
      setPayrolls(data)
      setSelectedIds((prev) => prev.filter((id) => data.some((item) => item._id === id)))
      setBulkSelectedEmployees((prev) => prev.filter((emp) => data.some((item) => item.employeeId === emp.id)))
      setShowFilterDropdown(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load payrolls')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await getEmployeeOptions()
      setEmployees(data)
    } catch {
      // silent fail
    }
  }

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const data = await getDepartments()
      setDepartments(data)
    } catch {
      setDepartments([])
    } finally {
      setLoadingDepartments(false)
    }
  }

  const loadDepartmentEmployees = async (departmentId: string) => {
    try {
      setLoadingDepartmentEmployees(true)
      const dept = departments.find((d) => d._id === departmentId)
      const data = await getDepartmentEmployees(departmentId)
      const mapped = data.employees.map((emp) => ({
        id: emp.employeeId,
        name: emp.name,
        code: emp.employeeId,
        position: emp.position,
        email: emp.email,
        department: dept?.name || '',
      }))
      setDepartmentEmployees(mapped)
    } catch {
      setDepartmentEmployees([])
    } finally {
      setLoadingDepartmentEmployees(false)
    }
  }

  const resetForm = () => {
    setFormEmployee('')
    setFilterEmployeeSearch('')
    setShowFilterDropdown(false)
    autoCalcFiredRef.current = false
    autoCalcKeyRef.current = ''
    setBulkCreating(false)
    setFormMonth(new Date().getMonth() + 1)
    setFormYear(new Date().getFullYear())
    setFormBaseSalary('')
    setFormAllowances([{ name: '', amount: '' }])
    setFormDeductions([{ name: '', amount: '' }])
    setFormStatus('APPROVED')
    setFormReason('')
    setAutoCalcSummary(null)
    setSelectedPayroll(null)
    setBulkSelectedEmployees([])
    setModalMode('create')
  }

  const openCreateModal = () => {
    resetForm()
    setModalMode('create')
    setShowModal(true)
    autoCalcFiredRef.current = false
  }

  const openBulkCreateModal = () => {
    resetForm()
    setModalMode('bulkCreate')
    setFormStatus('DRAFT')
    setFormEmployee('')
    setSelectedDepartment('')
    setBulkSelectedEmployees([])
    setShowModal(true)
    autoCalcFiredRef.current = false
  }

  const openEditModal = (payroll: Payroll) => {
    if (!['DRAFT', 'PENDING'].includes(payroll.status)) {
      alert('Chỉ được sửa trực tiếp phiếu DRAFT/PENDING')
      return
    }

    setSelectedPayroll(payroll)
    setModalMode('edit')
    setFormEmployee(payroll.employeeId)
    setFormMonth(payroll.period.month)
    setFormYear(payroll.period.year)
    setFormBaseSalary(String(payroll.baseSalary || 0))
    setFormAllowances(
      payroll.allowances?.length
        ? payroll.allowances.map((a) => ({ name: a.name || '', amount: String(a.amount ?? '') }))
        : [{ name: '', amount: '' }]
    )
    setFormDeductions(
      payroll.deductions?.length
        ? payroll.deductions.map((d) => ({ name: d.name || '', amount: String(d.amount ?? '') }))
        : [{ name: '', amount: '' }]
    )
    setFormStatus(payroll.status)
    setFormReason('')
    setShowModal(true)
  }

  const openReviseModal = (payroll: Payroll) => {
    if (payroll.status !== 'APPROVED') {
      alert('Luồng revise chỉ áp dụng cho phiếu APPROVED')
      return
    }

    setSelectedPayroll(payroll)
    setModalMode('revise')
    setFormEmployee(payroll.employeeId)
    setFormMonth(payroll.period.month)
    setFormYear(payroll.period.year)
    setFormBaseSalary(String(payroll.baseSalary || 0))
    setFormAllowances(
      payroll.allowances?.length
        ? payroll.allowances.map((a) => ({ name: a.name || '', amount: String(a.amount ?? '') }))
        : [{ name: '', amount: '' }]
    )
    setFormDeductions(
      payroll.deductions?.length
        ? payroll.deductions.map((d) => ({ name: d.name || '', amount: String(d.amount ?? '') }))
        : [{ name: '', amount: '' }]
    )
    setFormStatus('PENDING')
    setFormReason('')
    setShowModal(true)
  }

  const handleAutoCalculate = async () => {
    if (!formEmployee || !formMonth || !formYear) {
      alert('Vui lòng chọn nhân viên và kỳ lương trước khi tính tự động')
      return
    }

    try {
      setAutoCalculating(true)
      const data = await autoCalculatePayroll({
        employeeId: formEmployee,
        month: formMonth,
        year: formYear,
        baseSalary: formBaseSalary ? parseFloat(formBaseSalary) : undefined,
      })

      setFormBaseSalary(String(data.baseSalary || 0))
      setFormAllowances(
        data.suggestion.allowances.length
          ? data.suggestion.allowances.map((a) => ({ name: a.name, amount: String(a.amount) }))
          : [{ name: '', amount: '' }]
      )
      setFormDeductions(
        data.suggestion.deductions.length
          ? data.suggestion.deductions.map((d) => ({ name: d.name, amount: String(d.amount) }))
          : [{ name: '', amount: '' }]
      )

      const latePenaltyPerLate = data.suggestion.components.latePenaltyPerLate || 50000
      const absentPenaltyPerDay = data.suggestion.components.absentPenaltyPerDay || Math.round(data.baseSalary / (data.attendanceSummary.standardWorkingDays || 22))

      setAutoCalcSummary({
        ...data.attendanceSummary,
        overtimePay: data.suggestion.components.overtimePay,
        latePenalty: data.suggestion.components.lateCount * latePenaltyPerLate,
        absentPenalty: data.suggestion.components.absentCount * absentPenaltyPerDay,
        disciplineAmount: data.suggestion.components.disciplineAmount,
        rewardAmount: data.suggestion.components.rewardAmount,
        bhxh: data.suggestion.components.bhxh,
        pit: data.suggestion.components.pit,
        netSalary: data.suggestion.netSalary,
        lateIncidents: data.lateIncidents,
        absentIncidents: data.absentIncidents,
        disciplineBreakdown: data.disciplineBreakdown,
        rewardBreakdown: data.rewardBreakdown,
      })
    } catch (err: any) {
      alert(err.message || 'Không thể tính tự động payroll')
    } finally {
      setAutoCalculating(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (modalMode === 'bulkCreate') {
      await handleBulkCreate()
      return
    }

    if (!formEmployee || !formBaseSalary) return
    if (modalMode === 'revise' && !formReason.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh để lưu audit log')
      return
    }

    try {
      setSubmitting(true)
      const allowances = formAllowances
        .filter((a) => a.name && a.amount)
        .map((a) => ({ name: a.name, amount: parseFloat(a.amount) }))
      const deductions = formDeductions
        .filter((d) => d.name && d.amount)
        .map((d) => ({ name: d.name, amount: parseFloat(d.amount) }))

      if (modalMode === 'create') {
        await createPayroll({
          employeeId: formEmployee,
          period: { month: formMonth, year: formYear },
          baseSalary: parseFloat(formBaseSalary),
          allowances,
          deductions,
          status: formStatus,
        })
      } else if (modalMode === 'edit') {
        if (!selectedPayroll) throw new Error('No payroll selected')
        await updatePayroll(selectedPayroll._id, {
          period: { month: formMonth, year: formYear },
          baseSalary: parseFloat(formBaseSalary),
          allowances,
          deductions,
          status: formStatus,
          reason: formReason || undefined,
        })
      } else {
        if (!selectedPayroll) throw new Error('No payroll selected')
        await revisePayroll(selectedPayroll._id, {
          period: { month: formMonth, year: formYear },
          baseSalary: parseFloat(formBaseSalary),
          allowances,
          deductions,
          status: formStatus,
          reason: formReason.trim(),
        })
      }

      setShowModal(false)
      resetForm()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Không thể lưu phiếu lương')
    } finally {
      setSubmitting(false)
    }
  }

  const previewNet = () => {
    const base = parseFloat(formBaseSalary) || 0
    const allowancesTotal = formAllowances
      .filter((a) => a.name && a.amount)
      .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
    const deductionsTotal = formDeductions
      .filter((d) => d.name && d.amount)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    return base + allowancesTotal - deductionsTotal
  }

  const allSelected = payrolls.length > 0 && selectedIds.length === payrolls.length

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : payrolls.map((p) => p._id))
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleBulkSelectOne = (emp: { id: string; name: string; department: string; email: string; code: string }) => {
    setSelectedIds((prev) => {
      const already = prev.includes(emp.id)
      const next = already ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
      setBulkSelectedEmployees((bulkPrev) => {
        if (already) return bulkPrev.filter((e) => e.id !== emp.id)
        return [...bulkPrev.filter((e) => next.includes(e.id)), emp]
      })
      return next
    })
  }

  const bulkAllSelected = departmentEmployees.length > 0 && departmentEmployees.every((emp) => selectedIds.includes(emp.id))

  const toggleBulkSelectAll = () => {
    if (bulkAllSelected) {
      const employeeIds = departmentEmployees.map((emp) => emp.id)
      setSelectedIds((prev) => prev.filter((id) => !employeeIds.includes(id)))
      setBulkSelectedEmployees([])
      return
    }

    setSelectedIds((prev) => {
      const merged = Array.from(new Set([...prev, ...departmentEmployees.map((emp) => emp.id)]))
      setBulkSelectedEmployees(departmentEmployees)
      return merged
    })
  }

  const handleBulkCreate = async () => {
    const targetEmployeeIds =
      selectedIds.length > 0
        ? selectedIds
        : modalMode === 'bulkCreate'
          ? departmentEmployees.map((emp) => emp.id)
          : []

    if (targetEmployeeIds.length === 0) {
      alert('Vui lòng chọn phòng ban hoặc nhân viên để tạo phiếu lương hàng loạt')
      return
    }

    if (!formBaseSalary) {
      alert('Vui lòng nhập lương cơ bản mẫu trước khi tạo hàng loạt')
      return
    }

    const confirmed = window.confirm(`Tạo phiếu lương cho ${targetEmployeeIds.length} nhân viên đã chọn?`)
    if (!confirmed) return

    try {
      setBulkCreating(true)
      const allowances = formAllowances
        .filter((a) => a.name && a.amount)
        .map((a) => ({ name: a.name, amount: parseFloat(a.amount) }))
      const deductions = formDeductions
        .filter((d) => d.name && d.amount)
        .map((d) => ({ name: d.name, amount: parseFloat(d.amount) }))

      const result: BulkPayrollResult = await createBulkPayroll({
        employeeIds: targetEmployeeIds,
        period: { month: formMonth, year: formYear },
        baseSalary: parseFloat(formBaseSalary),
        allowances,
        deductions,
        status: formStatus,
      })

      setShowModal(false)
      resetForm()
      setSelectedIds([])
      setSelectedDepartment('')
      setDepartmentEmployees([])
      await loadData()

      if (result.failed > 0) {
        const reasons = result.details.map(d => `${d.employeeId}: ${d.reason}`).join('\n')
        alert(`Đã tạo ${result.created}/${targetEmployeeIds.length} phiếu lương.\n\nKhông thể tạo:\n${reasons}`)
      } else {
        alert(`Đã tạo thành công ${result.created} phiếu lương!`)
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tạo phiếu lương hàng loạt')
    } finally {
      setBulkCreating(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(`Xoá ${selectedIds.length} phiếu lương đã chọn?`)
    if (!confirmed) return

    try {
      setBulkDeleting(true)
      await deletePayrolls(selectedIds)
      setSelectedIds([])
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Không thể xoá các phiếu lương đã chọn')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('payroll.title') || 'Quản lý Lương'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('payroll.subtitle') || 'Tạo và quản lý phiếu lương nhân viên'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBulkCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            + Tạo hàng loạt
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            + {t('payroll.addNew') || 'Tạo phiếu lương'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('payroll.month') || 'Tháng'}:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS_VI.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('payroll.year') || 'Năm'}:</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 relative" data-filter-employee-dropdown>
              <label className="text-sm text-gray-600">{t('payroll.employee') || 'Nhân viên'}:</label>
              <div className="relative w-72">
                <input
                  type="text"
                  value={filterEmployeeSearch}
                  onChange={(e) => {
                    setFilterEmployeeSearch(e.target.value)
                    setShowFilterDropdown(true)
                  }}
                  onFocus={() => setShowFilterDropdown(true)}
                  placeholder="Tìm nhân viên..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showFilterDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterEmployee('')
                        setFilterEmployeeSearch('')
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                        filterEmployee === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
                      }`}
                    >
                      — {t('common.all') || 'Tất cả'} —
                    </button>
                    {employees
                      .filter((emp) => {
                        const q = filterEmployeeSearch.toLowerCase().trim()
                        if (!q) return true
                        return (
                          emp.name.toLowerCase().includes(q) ||
                          emp.email.toLowerCase().includes(q) ||
                          emp.code.toLowerCase().includes(q)
                        )
                      })
                      .map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setFilterEmployee(emp.id)
                            setFilterEmployeeSearch(emp.name)
                            setShowFilterDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                            filterEmployee === emp.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-400">{emp.code} · {emp.email}</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('payroll.status') || 'Trạng thái'}:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- {t('common.all') || 'Tất cả'} --</option>
                <option value="PENDING">{t('payroll.pending') || 'Chờ duyệt'}</option>
                <option value="DRAFT">{t('payroll.draft') || 'Nháp'}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Chọn tất cả ({selectedIds.length}/{payrolls.length})
          </label>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || bulkDeleting}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkDeleting ? 'Đang xoá...' : `Xoá đã chọn (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            {t('common.loading') || 'Đang tải...'}
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {t('payroll.empty') || 'Chưa có phiếu lương nào'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Chọn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.period') || 'Kỳ lương'}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.employee') || 'Nhân viên'}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.baseSalary') || 'Lương cơ bản'}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.allowances') || 'Phụ cấp'}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.deductions') || 'Khấu trừ'}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.netSalary') || 'Thực nhận'}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('payroll.status') || 'Trạng thái'}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p._id)}
                      onChange={() => toggleSelectOne(p._id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{months[p.period.month - 1]}/{p.period.year}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.employeeName}</div>
                    <div className="text-xs text-gray-400">{p.employeeCode}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{formatCurrency(p.baseSalary, language)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">+{formatCurrency(p.allowancesTotal, language)}</td>
                  <td className="px-4 py-3 text-right text-red-500 font-medium">-{formatCurrency(p.deductionsTotal, language)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(p.netSalary, language)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {(p.status === 'DRAFT' || p.status === 'PENDING') && (
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2 py-1 text-xs rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Sửa
                        </button>
                      )}
                      {p.status === 'APPROVED' && !p.isSuperseded && (
                        <button
                          onClick={() => openReviseModal(p)}
                          className="px-2 py-1 text-xs rounded-md border border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          Điều chỉnh
                        </button>
                      )}
                      {p.isSuperseded && (
                        <span className="text-[11px] text-gray-400">Đã được điều chỉnh</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">{modalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                aria-label="Đóng popup"
                className="shrink-0 w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2 mb-4">
                <span className="text-amber-500 mt-0.5">ℹ️</span>
                <span>
                  <strong>Lưu ý:</strong> Mỗi nhân viên chỉ có thể có <strong>1 phiếu lương mỗi tháng</strong>.
                  Nếu cần điều chỉnh phiếu đã duyệt, dùng nút <strong>"Điều chỉnh"</strong> để tạo phiên bản mới + audit log.
                </span>
              </div>

              <div className="flex justify-end gap-2">
                {modalMode === 'bulkCreate' && (
                  <button
                    type="button"
                    onClick={handleBulkCreate}
                    disabled={bulkCreating}
                    className="px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    {bulkCreating ? 'Đang tạo...' : 'Tạo hàng loạt'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  disabled={autoCalculating}
                  className="px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {autoCalculating ? 'Đang tính...' : 'Tính tự động'}
                </button>
              </div>
              {modalMode === 'bulkCreate' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn phòng ban *</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value)
                        setDepartmentEmployees([])
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {loadingDepartments && <p className="text-xs text-gray-400 mt-1">Đang tải phòng ban...</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn người trong phòng ban *</label>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                      {loadingDepartmentEmployees ? (
                        <p className="text-sm text-gray-500">Đang tải nhân viên...</p>
                      ) : departmentEmployees.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          {selectedDepartment ? 'Chưa có nhân viên trong phòng ban này' : 'Hãy chọn phòng ban trước'}
                        </p>
                      ) : (
                        <>
                          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer border-b border-gray-100 pb-2 mb-2">
                            <input
                              type="checkbox"
                              checked={bulkAllSelected}
                              onChange={toggleBulkSelectAll}
                            />
                            <span className="flex-1 font-medium text-gray-900">Chọn tất cả</span>
                          </label>
                          {departmentEmployees.map((emp) => (
                            <label key={emp.id} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(emp.id)}
                                onChange={() => toggleBulkSelectOne(emp)}
                              />
                              <span className="flex-1">
                                <span className="font-medium text-gray-900">{emp.name}</span>
                                <span className="text-xs text-gray-400 ml-2">{emp.code} · {emp.email}</span>
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600">Người đã chọn ({selectedIds.length})</p>
                        {selectedIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds([])
                              setBulkSelectedEmployees([])
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Bỏ chọn tất cả
                          </button>
                        )}
                      </div>
                      {bulkSelectedEmployees.length === 0 ? (
                        <p className="text-xs text-gray-400">Chưa có ai được chọn</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {bulkSelectedEmployees.map((emp) => (
                            <div key={emp.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                                <div className="text-xs text-gray-500 truncate">{emp.department || '—'} · {emp.code || emp.email || emp.id}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleBulkSelectOne(emp)}
                                className="text-blue-400 hover:text-blue-600 font-bold text-lg ml-2 shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('payroll.employee')} *
                  </label>
                  <select
                    value={formEmployee}
                    onChange={(e) => setFormEmployee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.code} — {emp.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('payroll.month') || 'Tháng'} *</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS_VI.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('payroll.year') || 'Năm'} *</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payroll.baseSalary') || 'Lương cơ bản'} (VND) *
                </label>
                <input
                  type="number"
                  value={formBaseSalary}
                  onChange={(e) => setFormBaseSalary(e.target.value)}
                  placeholder="10000000"
                  required
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payroll.allowances') || 'Phụ cấp'} (tự động từ tính lương)
                </label>
                {autoCalcSummary ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {formAllowances.filter(a => a.name && a.amount).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Phụ cấp</p>
                        {formAllowances.filter(a => a.name && a.amount).map((a, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{a.name}</span>
                            <span className="text-green-600 font-medium">+{formatCurrency(parseFloat(a.amount), language)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {formDeductions.filter(d => d.name && d.amount).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Khấu trừ</p>
                        {formDeductions.filter(d => d.name && d.amount).map((d, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{d.name}</span>
                            <span className="text-red-500 font-medium">-{formatCurrency(parseFloat(d.amount), language)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic py-4 text-center">
                    Nhấn "Tính tự động" sau khi chọn nhân viên để xem phụ cấp/khấu trừ
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('payroll.status') || 'Trạng thái'}</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'DRAFT' | 'PENDING' | 'APPROVED')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPROVED">{t('payroll.approved') || 'Đã duyệt'}</option>
                  <option value="PENDING">{t('payroll.pending') || 'Chờ duyệt'}</option>
                  <option value="DRAFT">{t('payroll.draft') || 'Nháp'}</option>
                </select>
              </div>

              {modalMode === 'bulkCreate' && (
                <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-900">
                  {selectedDepartment
                    ? `Đang tạo phiếu cho ${selectedIds.length} nhân viên thuộc phòng ban đã chọn`
                    : 'Hãy chọn phòng ban để tải danh sách nhân viên, sau đó có thể tick "Chọn tất cả" hoặc chọn từng người cần tạo phiếu lương.'}
                </div>
              )}

              {(modalMode === 'revise' || modalMode === 'edit') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {modalMode === 'revise' ? 'Lý do điều chỉnh *' : 'Ghi chú chỉnh sửa (audit)'}
                  </label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder={modalMode === 'revise' ? 'Ví dụ: Điều chỉnh sai phụ cấp ca đêm tháng 3' : 'Nhập ghi chú nếu cần'}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {autoCalcSummary && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-900 space-y-1 max-h-48 overflow-y-auto">
                    <p><strong>Ngày công:</strong> {autoCalcSummary.attendanceDays}/{autoCalcSummary.standardWorkingDays}</p>
                    <p><strong>Giờ làm:</strong> {(autoCalcSummary.totalWorkMinutes / 60).toFixed(1)}h</p>
                    <p><strong>Tăng ca:</strong> {(autoCalcSummary.totalOvertimeMinutes / 60).toFixed(1)}h → <strong>+{formatCurrency(autoCalcSummary.overtimePay, language)}</strong></p>
                  </div>

                  {/* Reward breakdown */}
                  {(autoCalcSummary.rewardBreakdown?.approved?.length > 0 || autoCalcSummary.rewardBreakdown?.pending?.length > 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 mb-2">🎁 Thưởng & Khen thưởng</p>
                      {autoCalcSummary.rewardBreakdown.approved.length > 0 && (
                        <>
                          <p className="text-xs text-green-700 font-medium mb-1">✅ Đã duyệt ({autoCalcSummary.rewardBreakdown.approved.length} khoản)</p>
                          <div className="space-y-1 mb-2">
                            {autoCalcSummary.rewardBreakdown.approved.map((r, i) => (
                              <div key={i} className="flex justify-between text-xs text-green-800">
                                <span className="truncate flex-1 mr-2">📋 {r.title}{r.type === 'MATERIAL' ? ` [${r.itemName || 'Hiện vật'}]` : ''}</span>
                                <span className="font-semibold">{r.type === 'MATERIAL' ? '📦 ' + (r.itemName || 'Hiện vật') : '+' + formatCurrency(r.amount, language)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs font-semibold text-green-800">Tổng duyệt: +{formatCurrency(autoCalcSummary.rewardAmount, language)}</p>
                        </>
                      )}
                      {autoCalcSummary.rewardBreakdown.pending.length > 0 && (
                        <>
                          <p className="text-xs text-yellow-700 font-medium mb-1 mt-2">⏳ Đang chờ duyệt ({autoCalcSummary.rewardBreakdown.pending.length} khoản)</p>
                          <div className="space-y-1">
                            {autoCalcSummary.rewardBreakdown.pending.map((r, i) => (
                              <div key={i} className="flex justify-between text-xs text-yellow-700">
                                <span className="truncate flex-1 mr-2">📋 {r.title}{r.type === 'MATERIAL' ? ` [${r.itemName || 'Hiện vật'}]` : ''}</span>
                                <span className="font-semibold">{r.type === 'MATERIAL' ? '📦 ' + (r.itemName || 'Hiện vật') : '+' + formatCurrency(r.amount, language)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-yellow-700 mt-1 italic">→ Sẽ tự cộng sau khi duyệt ở tab Rewards</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Late incidents */}
                  {autoCalcSummary.lateIncidents && autoCalcSummary.lateIncidents.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ Đi muộn ({autoCalcSummary.lateCount} lần)</p>
                      <div className="space-y-1">
                        {autoCalcSummary.lateIncidents.map((inc, i) => (
                          <div key={i} className="flex justify-between text-xs text-yellow-800">
                            <span>📅 {new Date(inc.date).toLocaleDateString('vi-VN')} — muộn {inc.lateMinutes} phút</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-yellow-800 mt-2">Phạt: -{formatCurrency(autoCalcSummary.latePenalty, language)}</p>
                    </div>
                  )}

                  {/* Absent incidents */}
                  {autoCalcSummary.absentIncidents && autoCalcSummary.absentIncidents.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 mb-2">❌ Vắng không phép ({autoCalcSummary.absentCount} ngày)</p>
                      <div className="space-y-1">
                        {autoCalcSummary.absentIncidents.map((inc, i) => (
                          <div key={i} className="flex justify-between text-xs text-red-800">
                            <span>📅 {new Date(inc.date).toLocaleDateString('vi-VN')}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-red-800 mt-2">Phạt: -{formatCurrency(autoCalcSummary.absentPenalty, language)}</p>
                    </div>
                  )}

                  {/* Discipline breakdown */}
                  {autoCalcSummary.disciplineBreakdown && autoCalcSummary.disciplineBreakdown.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-800 mb-2">🔴 Kỷ luật ({autoCalcSummary.disciplineBreakdown.length} lỗi)</p>
                      <div className="space-y-1">
                        {autoCalcSummary.disciplineBreakdown.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs text-orange-800">
                            <span className="truncate flex-1 mr-2">📋 {d.description || d.type}</span>
                            <span className="font-semibold">-{formatCurrency(d.amount, language)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-orange-800 mt-2">Tổng phạt: -{formatCurrency(autoCalcSummary.disciplineAmount, language)}</p>
                    </div>
                  )}

                  {/* Fixed deductions */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                    <p className="font-semibold text-gray-800">Các khoản khấu trừ cố định</p>
                    <p><strong>BHXH (8%):</strong> -{formatCurrency(autoCalcSummary.bhxh, language)}</p>
                    <p><strong>Thuế TNCN:</strong> -{formatCurrency(autoCalcSummary.pit, language)}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 sticky bottom-0 z-10 shadow-sm">
                <p className="text-sm text-gray-600">{t('payroll.preview') || 'Thực nhận dự kiến'}:</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(previewNet(), language)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t('common.cancel') || 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || bulkCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting || bulkCreating
                    ? (t('common.saving') || 'Đang lưu...')
                    : modalMode === 'create'
                      ? (t('common.save') || 'Lưu')
                      : modalMode === 'edit'
                        ? 'Cập nhật'
                        : modalMode === 'bulkCreate'
                          ? 'OK tạo hàng loạt'
                          : 'Tạo bản điều chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

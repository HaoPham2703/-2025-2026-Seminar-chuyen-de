import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  getAllPayrolls,
  getEmployeeOptions,
  createPayroll,
  updatePayroll,
  revisePayroll,
  autoCalculatePayroll,
  type Payroll,
  type EmployeeOption,
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

type ModalMode = 'create' | 'edit' | 'revise'

export default function Payroll() {
  const { language } = useLanguage()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterEmployee, setFilterEmployee] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Form state
  const [formEmployee, setFormEmployee] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
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
  } | null>(null)
  const [autoCalculating, setAutoCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const months = language === 'vi' ? MONTHS_VI : MONTHS_EN
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    loadData()
  }, [filterMonth, filterYear, filterEmployee, filterStatus])

  useEffect(() => {
    loadEmployees()
  }, [])

  const modalTitle = useMemo(() => {
    if (modalMode === 'edit') return 'Sửa phiếu lương'
    if (modalMode === 'revise') return 'Điều chỉnh phiếu đã duyệt'
    return t('payroll.createTitle') || 'Tạo phiếu lương mới'
  }, [modalMode])

  const modalSubtitle = useMemo(() => {
    if (modalMode === 'edit') return 'Chỉ áp dụng cho phiếu DRAFT/PENDING'
    if (modalMode === 'revise') return 'Tạo phiên bản mới và lưu audit log'
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

  const resetForm = () => {
    setEmployeeSearch('')
    setFormEmployee('')
    setFormMonth(new Date().getMonth() + 1)
    setFormYear(new Date().getFullYear())
    setFormBaseSalary('')
    setFormAllowances([{ name: '', amount: '' }])
    setFormDeductions([{ name: '', amount: '' }])
    setFormStatus('APPROVED')
    setFormReason('')
    setAutoCalcSummary(null)
    setSelectedPayroll(null)
    setModalMode('create')
  }

  const openCreateModal = () => {
    resetForm()
    setModalMode('create')
    setShowModal(true)
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
      })
    } catch (err: any) {
      alert(err.message || 'Không thể tính tự động payroll')
    } finally {
      setAutoCalculating(false)
    }
  }

  const handleAddAllowance = () => {
    setFormAllowances([...formAllowances, { name: '', amount: '' }])
  }

  const handleRemoveAllowance = (index: number) => {
    setFormAllowances(formAllowances.filter((_, i) => i !== index))
  }

  const handleAllowanceChange = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...formAllowances]
    updated[index][field] = value
    setFormAllowances(updated)
  }

  const handleAddDeduction = () => {
    setFormDeductions([...formDeductions, { name: '', amount: '' }])
  }

  const handleRemoveDeduction = (index: number) => {
    setFormDeductions(formDeductions.filter((_, i) => i !== index))
  }

  const handleDeductionChange = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...formDeductions]
    updated[index][field] = value
    setFormDeductions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + {t('payroll.addNew') || 'Tạo phiếu lương'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
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

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('payroll.employee') || 'Nhân viên'}:</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- {t('common.all') || 'Tất cả'} --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} — {emp.email} — {emp.code}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('payroll.status') || 'Trạng thái'}:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- {t('common.all') || 'Tất cả'} --</option>
              <option value="APPROVED">{t('payroll.approved') || 'Đã duyệt'}</option>
              <option value="PENDING">{t('payroll.pending') || 'Chờ duyệt'}</option>
              <option value="DRAFT">{t('payroll.draft') || 'Nháp'}</option>
            </select>
          </div>
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">{modalSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  disabled={autoCalculating}
                  className="px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {autoCalculating ? 'Đang tính...' : 'Tính tự động'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payroll.employee')} *
                </label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={e => {
                    setEmployeeSearch(e.target.value)
                    if (!e.target.value) setFormEmployee('')
                  }}
                  placeholder="Tìm tên nhân viên..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formEmployee}
                  onChange={(e) => setFormEmployee(e.target.value)}
                  required
                  disabled={modalMode !== 'create'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- {t('common.select') || 'Chọn'} --</option>
                  {employees
                    .filter(emp =>
                      !employeeSearch ||
                      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                      emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                      emp.code.toLowerCase().includes(employeeSearch.toLowerCase())
                    )
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.email} — {emp.code}
                      </option>
                    ))}
                </select>
              </div>

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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{t('payroll.allowances') || 'Phụ cấp'}</label>
                  <button type="button" onClick={handleAddAllowance} className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">+ {t('common.add') || 'Thêm'}</button>
                </div>
                {formAllowances.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => handleAllowanceChange(i, 'name', e.target.value)}
                      placeholder={t('payroll.itemName') || 'Tên phụ cấp'}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={a.amount}
                      onChange={(e) => handleAllowanceChange(i, 'amount', e.target.value)}
                      placeholder="VND"
                      min="0"
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formAllowances.length > 1 && (
                      <button type="button" onClick={() => handleRemoveAllowance(i)} className="text-red-500 text-sm px-2 cursor-pointer">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{t('payroll.deductions') || 'Khấu trừ'}</label>
                  <button type="button" onClick={handleAddDeduction} className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">+ {t('common.add') || 'Thêm'}</button>
                </div>
                {formDeductions.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => handleDeductionChange(i, 'name', e.target.value)}
                      placeholder={t('payroll.itemName') || 'Tên khấu trừ'}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={d.amount}
                      onChange={(e) => handleDeductionChange(i, 'amount', e.target.value)}
                      placeholder="VND"
                      min="0"
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formDeductions.length > 1 && (
                      <button type="button" onClick={() => handleRemoveDeduction(i)} className="text-red-500 text-sm px-2 cursor-pointer">✕</button>
                    )}
                  </div>
                ))}
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
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-900 space-y-1">
                    <p><strong>Ngày công:</strong> {autoCalcSummary.attendanceDays}/{autoCalcSummary.standardWorkingDays}</p>
                    <p><strong>Giờ làm:</strong> {(autoCalcSummary.totalWorkMinutes / 60).toFixed(1)}h</p>
                    <p><strong>Tăng ca:</strong> {(autoCalcSummary.totalOvertimeMinutes / 60).toFixed(1)}h → <strong>+{formatCurrency(autoCalcSummary.overtimePay, language)}</strong></p>
                    {autoCalcSummary.rewardAmount > 0 && (
                      <p><strong>Thưởng:</strong> +{formatCurrency(autoCalcSummary.rewardAmount, language)}</p>
                    )}
                  </div>

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

              <div className="bg-blue-50 rounded-lg p-4">
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? (t('common.saving') || 'Đang lưu...')
                    : modalMode === 'create'
                      ? (t('common.save') || 'Lưu')
                      : modalMode === 'edit'
                        ? 'Cập nhật'
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

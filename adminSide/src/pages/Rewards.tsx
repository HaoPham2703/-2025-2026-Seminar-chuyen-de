import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { adminService, type Employee } from '../services/adminService'
import {
    createDiscipline,
    createReward,
    DISCIPLINE_STATUS_COLORS,
    DISCIPLINE_TYPE_COLORS,
    DISCIPLINE_TYPE_LABELS,
    getAutoCalcPreview,
    getDisciplines,
    getRewardRule,
    getRewards,
    REWARD_STATUS_COLORS,
    runAutoReward,
    saveRewardRule,
    updateDisciplineStatus,
    updateRewardStatus,
    type Discipline,
    type DisciplineType,
    type Reward,
    type RewardRule,
    type RewardType,
} from '../services/rewardService'
import { t } from '../utils/i18n'

const MONTHS_VI = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Rewards() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'rewards' | 'discipline' | 'settings'>('rewards')

  // ─── Shared State ─────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterEmployee, setFilterEmployee] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const months = language === 'vi' ? MONTHS_VI : MONTHS_EN
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const employeeDropdownRef = useRef<HTMLDivElement>(null)

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    )
  }, [employees, employeeSearch])

  // ─── Rewards State ─────────────────────────────────────────────────────────
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [submittingReward, setSubmittingReward] = useState(false)

  // Reward form
  const [rEmployee, setREmployee] = useState('')
  const [rType, setRType] = useState<RewardType>('MATERIAL')
  const [rTitle, setRTitle] = useState('')
  const [rDesc, setRDesc] = useState('')
  const [rAmount, setRAmount] = useState('')
  const [rItem, setRItem] = useState('')

  // ─── Disciplines State ────────────────────────────────────────────────────
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loadingDisciplines, setLoadingDisciplines] = useState(false)
  const [showDisciplineModal, setShowDisciplineModal] = useState(false)
  const [submittingDiscipline, setSubmittingDiscipline] = useState(false)

  // Discipline form
  const [dEmployee, setDEmployee] = useState('')
  const [dType, setDType] = useState<DisciplineType>('LATE')
  const [dDesc, setDDesc] = useState('')
  const [dAmount, setDAmount] = useState('')

  // ─── Settings State ────────────────────────────────────────────────────────
  const [rule, setRule] = useState<RewardRule | null>(null)
  const [loadingRule, setLoadingRule] = useState(false)
  const [savingRule, setSavingRule] = useState(false)
  const [preview, setPreview] = useState<ReturnType<typeof getAutoCalcPreview> | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [runningAuto, setRunningAuto] = useState(false)
  const [autoResult, setAutoResult] = useState<string>('')

  // Rule form
  const [rRequiredDays, setRRequiredDays] = useState('')
  const [rRewardType, setRRewardType] = useState<RewardType>('MATERIAL')
  const [rRewardAmount, setRRewardAmount] = useState('')
  const [rRewardItem, setRRewardItem] = useState('')
  const [rIsActive, setRIsActive] = useState(false)

  // ─── Load Employees ────────────────────────────────────────────────────────
  useEffect(() => {
    adminService.getAllEmployees().then(d => setEmployees(d.employees || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node)) {
        setShowEmployeeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Load Rewards ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'rewards') return
    const load = async () => {
      try {
        setLoadingRewards(true)
        const data = await getRewards({
          month: filterMonth,
          year: filterYear,
          employeeId: filterEmployee || undefined,
        })
        setRewards(data)
      } catch { setRewards([]) } finally {
        setLoadingRewards(false)
      }
    }
    load()
  }, [activeTab, filterMonth, filterYear, filterEmployee])

  // ─── Load Disciplines ─────────────────────────────────────────────────────
  const loadDisciplines = async () => {
    try {
      setLoadingDisciplines(true)
      const data = await getDisciplines({
        month: filterMonth,
        year: filterYear,
        employeeId: filterEmployee || undefined,
      })
      setDisciplines(data)
    } catch { setDisciplines([]) } finally {
      setLoadingDisciplines(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'discipline') return
    loadDisciplines()
  }, [activeTab, filterMonth, filterYear, filterEmployee])

  // ─── Load Rule + Preview ───────────────────────────────────────────────────
  const loadRuleAndPreview = async () => {
    try {
      setLoadingRule(true)
      const r = await getRewardRule()
      setRule(r)
      if (r) {
        setRRequiredDays(String(r.requiredDays))
        setRRewardType(r.rewardType)
        setRRewardAmount(r.rewardAmount ? String(r.rewardAmount) : '')
        setRRewardItem(r.rewardItem || '')
        setRIsActive(r.isActive)
      } else {
        setRRequiredDays('22')
        setRRewardType('MATERIAL')
        setRRewardAmount('')
        setRRewardItem('')
        setRIsActive(false)
      }
      setLoadingPreview(true)
      const p = await getAutoCalcPreview(filterMonth, filterYear)
      setPreview(p)
    } catch { setRule(null) } finally {
      setLoadingRule(false)
      setLoadingPreview(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'settings') return
    loadRuleAndPreview()
  }, [activeTab, filterMonth, filterYear])

  // ─── Submit Reward ─────────────────────────────────────────────────────────
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rEmployee || !rTitle) { alert('Vui lòng nhập đầy đủ thông tin'); return }
    try {
      setSubmittingReward(true)
      await createReward({
        employeeId: rEmployee,
        type: rType,
        title: rTitle,
        description: rDesc,
        amount: rAmount ? parseFloat(rAmount) : undefined,
        itemName: rType === 'MATERIAL' ? rItem || rTitle : undefined,
        month: filterMonth,
        year: filterYear,
      })
      setShowRewardModal(false)
      resetRewardForm()
      const data = await getRewards({ month: filterMonth, year: filterYear, employeeId: filterEmployee || undefined })
      setRewards(data)
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo thưởng')
    } finally {
      setSubmittingReward(false)
    }
  }

  const handleApproveReward = async (id: string) => {
    try {
      await updateRewardStatus(id, 'APPROVED')
      setRewards(prev => prev.map(r => r._id === id ? { ...r, status: 'APPROVED' } : r))
    } catch (err: any) { alert(err.message) }
  }

  const handleCancelReward = async (id: string) => {
    try {
      await updateRewardStatus(id, 'CANCELLED')
      setRewards(prev => prev.map(r => r._id === id ? { ...r, status: 'CANCELLED' } : r))
    } catch (err: any) { alert(err.message) }
  }

  // ─── Submit Discipline ─────────────────────────────────────────────────────
  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dEmployee || !dDesc) { alert('Vui lòng nhập đầy đủ thông tin'); return }
    try {
      setSubmittingDiscipline(true)
      await createDiscipline({
        employeeId: dEmployee,
        type: dType,
        description: dDesc,
        amount: dAmount ? parseFloat(dAmount) : undefined,
        month: filterMonth,
        year: filterYear,
      })
      setShowDisciplineModal(false)
      resetDisciplineForm()
      await loadDisciplines()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi nhận lỗi')
    } finally {
      setSubmittingDiscipline(false)
    }
  }

  const handleApproveDiscipline = async (id: string) => {
    try {
      await updateDisciplineStatus(id, 'APPROVED')
      setDisciplines(prev => prev.map(d => d._id === id ? { ...d, status: 'APPROVED' } : d))
    } catch (err: any) { alert(err.message) }
  }

  const handleWaiveDiscipline = async (id: string) => {
    try {
      await updateDisciplineStatus(id, 'WAIVED')
      setDisciplines(prev => prev.map(d => d._id === id ? { ...d, status: 'WAIVED' } : d))
    } catch (err: any) { alert(err.message) }
  }

  // ─── Save Rule ────────────────────────────────────────────────────────────
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rRequiredDays) { alert('Vui lòng nhập số ngày yêu cầu'); return }
    try {
      setSavingRule(true)
      await saveRewardRule({
        type: 'ATTENDANCE_FULL',
        requiredDays: parseInt(rRequiredDays),
        rewardType: rRewardType,
        rewardAmount: rRewardAmount ? parseFloat(rRewardAmount) : undefined,
        rewardItem: rRewardType === 'MATERIAL' ? rRewardItem : undefined,
        isActive: rIsActive,
      })
      await loadRuleAndPreview()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu rule')
    } finally {
      setSavingRule(false)
    }
  }

  const handleRunAuto = async () => {
    if (!window.confirm(t('rewards.confirmRun'))) return
    try {
      setRunningAuto(true)
      setAutoResult('')
      const result = await runAutoReward(filterMonth, filterYear)
      setAutoResult(`${t('rewards.autoRewardResult')} ${result.totalQualified} ${t('rewards.employeesQualified')} (${MONTHS_VI[filterMonth - 1]}/${filterYear})`)
      await loadRuleAndPreview()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRunningAuto(false)
    }
  }

  // ─── Reset Forms ──────────────────────────────────────────────────────────
  const resetRewardForm = () => {
    setREmployee('')
    setEmployeeSearch('')
    setShowEmployeeDropdown(false)
    setRType('MATERIAL'); setRTitle(''); setRDesc(''); setRAmount(''); setRItem('')
  }

  const resetDisciplineForm = () => {
    setDEmployee(''); setDType('LATE'); setDDesc(''); setDAmount('')
  }

  const openRewardModal = () => { resetRewardForm(); setShowRewardModal(true) }
  const openDisciplineModal = () => { resetDisciplineForm(); setShowDisciplineModal(true) }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const pendingRewards = rewards.filter(r => r.status === 'PENDING').length
  const materialRewards = rewards.filter(r => r.type === 'MATERIAL').length
  const moneyRewards = rewards.filter(r => r.type === 'MONEY').length

  const totalDisciplines = disciplines.length
  const lateCount = disciplines.filter(d => d.type === 'LATE').length
  const absentCount = disciplines.filter(d => d.type === 'ABSENT').length
  const otherCount = disciplines.filter(d => ['VIOLATION', 'FORGOTTEN_CHECKOUT', 'OTHER'].includes(d.type)).length

  const DISCIPLINE_TYPES: DisciplineType[] = ['LATE', 'ABSENT', 'VIOLATION', 'FORGOTTEN_CHECKOUT', 'OTHER']

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('rewards.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('rewards.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('rewards.monthYear')}:</label>
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS_VI.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('attendance.employee')}:</label>
          <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- {t('common.all')} --</option>
            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['rewards', 'discipline', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'rewards' ? t('rewards.rewards') : tab === 'discipline' ? t('rewards.discipline') : t('rewards.settings')}
          </button>
        ))}
      </div>

      {/* ─── TAB: REWARDS ──────────────────────────────────────────────── */}
      {activeTab === 'rewards' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('rewards.total'), value: rewards.length, color: 'text-blue-600' },
              { label: t('rewards.pending'), value: pendingRewards, color: 'text-yellow-600' },
              { label: t('rewards.totalMaterial'), value: materialRewards, color: 'text-purple-600' },
              { label: t('rewards.totalMoney'), value: moneyRewards, color: 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <button onClick={openRewardModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm">
              + {t('rewards.addReward')}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loadingRewards ? (
              <div className="p-12 text-center text-gray-500">{t('common.loading')}</div>
            ) : rewards.length === 0 ? (
              <div className="p-12 text-center text-gray-400">{t('common.noData')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.employee')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.type')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nội dung</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.value')}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.monthYear')}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map(r => (
                      <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{r.employeeName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.type === 'MATERIAL' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {r.type === 'MATERIAL' ? t('rewards.material') : t('rewards.money')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.title}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          {r.amount ? formatCurrency(r.amount) : r.itemName || '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{MONTHS_VI[r.month - 1]}/{r.year}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${REWARD_STATUS_COLORS[r.status] || ''}`}>
                            {r.status === 'PENDING' ? t('rewards.pending') : r.status === 'APPROVED' ? t('rewards.approved') : t('rewards.cancelled')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {r.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleApproveReward(r._id)} className="px-2 py-1 text-xs rounded-md border border-green-400 text-green-700 hover:bg-green-50 cursor-pointer">
                                  {t('rewards.approve')}
                                </button>
                                <button onClick={() => handleCancelReward(r._id)} className="px-2 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer">
                                  {t('rewards.cancel')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB: DISCIPLINE ───────────────────────────────────────────── */}
      {activeTab === 'discipline' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('rewards.totalViolations'), value: totalDisciplines, color: 'text-red-600' },
              { label: t('rewards.late'), value: lateCount, color: 'text-yellow-600' },
              { label: t('rewards.absent'), value: absentCount, color: 'text-orange-600' },
              { label: t('rewards.other'), value: otherCount, color: 'text-gray-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={openDisciplineModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors cursor-pointer text-sm">
              + {t('rewards.addDiscipline')}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loadingDisciplines ? (
              <div className="p-12 text-center text-gray-500">{t('common.loading')}</div>
            ) : disciplines.length === 0 ? (
              <div className="p-12 text-center text-gray-400">{t('common.noData')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.employee')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.disciplineType')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.description')}</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.penaltyAmount')}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('rewards.monthYear')}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplines.map(d => (
                      <tr key={d._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{d.employeeName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${DISCIPLINE_TYPE_COLORS[d.type] || ''}`}>
                            {DISCIPLINE_TYPE_LABELS[d.type] || d.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{d.description}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                          {d.amount ? formatCurrency(d.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{MONTHS_VI[d.month - 1]}/{d.year}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${DISCIPLINE_STATUS_COLORS[d.status] || ''}`}>
                            {d.status === 'RECORDED' ? t('rewards.recorded') : d.status === 'APPROVED' ? t('rewards.approved') : t('rewards.waived')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {d.status === 'RECORDED' && (
                              <>
                                <button onClick={() => handleApproveDiscipline(d._id)} className="px-2 py-1 text-xs rounded-md border border-orange-400 text-orange-700 hover:bg-orange-50 cursor-pointer">
                                  {t('rewards.approve')}
                                </button>
                                <button onClick={() => handleWaiveDiscipline(d._id)} className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer">
                                  {t('rewards.waive')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB: SETTINGS ─────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <>
          {/* Rule Form */}
          <form onSubmit={handleSaveRule} className="bg-white rounded-xl shadow p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">{t('rewards.settings')}</h2>
            <p className="text-sm text-gray-500">{t('rewards.autoRewardDesc')}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.ruleRequiredDays')} *</label>
                <input type="number" value={rRequiredDays} onChange={e => setRRequiredDays(e.target.value)} min="1" max="31"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="22" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.ruleRewardType')}</label>
                <select value={rRewardType} onChange={e => setRRewardType(e.target.value as RewardType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MATERIAL">{t('rewards.material')}</option>
                  <option value="MONEY">{t('rewards.money')}</option>
                </select>
              </div>
              {rRewardType === 'MONEY' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.ruleRewardAmount')} (VND)</label>
                  <input type="number" value={rRewardAmount} onChange={e => setRRewardAmount(e.target.value)} min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.ruleRewardItem')}</label>
                  <input type="text" value={rRewardItem} onChange={e => setRRewardItem(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bã mía, Voucher..." />
                </div>
              )}
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRIsActive(!rIsActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${rIsActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rIsActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700">{t('rewards.ruleActive')}</span>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={savingRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                {savingRule ? t('common.saving') : t('common.save')}
              </button>
              <button type="button" onClick={handleRunAuto} disabled={runningAuto || !rule}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer">
                {runningAuto ? 'Đang chạy...' : t('rewards.runAutoReward')}
              </button>
            </div>

            {autoResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                ✅ {autoResult}
              </div>
            )}
          </form>

          {/* Preview */}
          {loadingPreview ? (
            <div className="text-center text-gray-500 py-8">{t('common.loading')}</div>
          ) : preview ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-md font-bold text-gray-900 mb-4">
                Preview — {MONTHS_VI[filterMonth - 1]}/{filterYear}
              </h3>
              {!preview.rule ? (
                <p className="text-sm text-gray-400">{t('rewards.noRule')}</p>
              ) : preview.employees.length === 0 ? (
                <p className="text-sm text-gray-400">Không có nhân viên nào đủ điều kiện ({preview.rule.requiredDays} ngày đúng giờ)</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>{preview.employees.length}</strong> {t('rewards.employeesQualified')} — thưởng:{' '}
                    {preview.rule.rewardType === 'MONEY'
                      ? formatCurrency(preview.rule.rewardAmount || 0)
                      : preview.rule.rewardItem || 'Hiện vật'}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">{t('attendance.employee')}</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Ngày đúng giờ</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">{t('rewards.value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.employees.map(emp => (
                          <tr key={emp._id} className="border-b border-gray-100">
                            <td className="px-3 py-2 text-sm text-gray-900">{emp.name}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-600">{emp.onTimeDays}/{emp.requiredDays}</td>
                            <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                              {emp.rewardType === 'MONEY' ? formatCurrency(emp.rewardAmount || 0) : emp.rewardItem || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* ─── REWARD MODAL ─────────────────────────────────────────────── */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t('rewards.addReward')}</h2>
              <p className="text-sm text-gray-500 mt-1">{MONTHS_VI[filterMonth - 1]}/{filterYear}</p>
            </div>
            <form onSubmit={handleCreateReward} className="p-6 space-y-4">
              <div className="relative" ref={employeeDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.employee')} *</label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setEmployeeSearch(val)
                    setShowEmployeeDropdown(true)
                    if (!val) setREmployee('')
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="Tìm tên / email / mã nhân viên..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showEmployeeDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeSearch('')
                        setREmployee('')
                        setShowEmployeeDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                        rEmployee === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
                      }`}
                    >
                      — {t('common.select')} —
                    </button>
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => {
                          setEmployeeSearch(`${emp.name} · ${emp.employeeId}`)
                          setREmployee(emp._id)
                          setShowEmployeeDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                          rEmployee === emp._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.employeeId} · {emp.department} · {emp.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.type')}</label>
                <select value={rType} onChange={e => setRType(e.target.value as RewardType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MATERIAL">{t('rewards.material')}</option>
                  <option value="MONEY">{t('rewards.money')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung thưởng *</label>
                <input type="text" value={rTitle} onChange={e => setRTitle(e.target.value)} required
                  placeholder="VD: Thưởng bã mía, Thưởng tháng..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {rType === 'MATERIAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.itemName')}</label>
                  <input type="text" value={rItem} onChange={e => setRItem(e.target.value)}
                    placeholder="VD: Phiếu quà tặng, Voucher ăn trưa..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {rType === 'MONEY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.value')} (VND)</label>
                  <input type="number" value={rAmount} onChange={e => setRAmount(e.target.value)} min="0"
                    placeholder="100000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {rType === 'MONEY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.description')}</label>
                  <textarea value={rDesc} onChange={e => setRDesc(e.target.value)} rows={2}
                    placeholder="Mô tả thêm (tùy chọn)..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRewardModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={submittingReward}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                  {submittingReward ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DISCIPLINE MODAL ────────────────────────────────────────── */}
      {showDisciplineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t('rewards.addDiscipline')}</h2>
              <p className="text-sm text-gray-500 mt-1">{MONTHS_VI[filterMonth - 1]}/{filterYear}</p>
            </div>
            <form onSubmit={handleCreateDiscipline} className="p-6 space-y-4">
              <div className="relative" ref={employeeDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.employee')} *</label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setEmployeeSearch(val)
                    setShowEmployeeDropdown(true)
                    if (!val) setDEmployee('')
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="Tìm tên / email / mã nhân viên..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showEmployeeDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeSearch('')
                        setDEmployee('')
                        setShowEmployeeDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                        dEmployee === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
                      }`}
                    >
                      — {t('common.select')} —
                    </button>
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => {
                          setEmployeeSearch(`${emp.name} · ${emp.employeeId}`)
                          setDEmployee(emp._id)
                          setShowEmployeeDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                          dEmployee === emp._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.employeeId} · {emp.department} · {emp.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.disciplineType')}</label>
                <select value={dType} onChange={e => setDType(e.target.value as DisciplineType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DISCIPLINE_TYPES.map(type => (
                    <option key={type} value={type}>{DISCIPLINE_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.description')} *</label>
                <textarea value={dDesc} onChange={e => setDDesc(e.target.value)} required rows={3}
                  placeholder="Mô tả chi tiết lỗi vi phạm..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewards.penaltyAmount')} (VND) — để trống = chỉ ghi nhận</label>
                <input type="number" value={dAmount} onChange={e => setDAmount(e.target.value)} min="0"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDisciplineModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={submittingDiscipline}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                  {submittingDiscipline ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

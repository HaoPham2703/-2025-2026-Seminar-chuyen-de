import { Clock, Eye, EyeOff, Lock, Mail, Phone, Save, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/adminService'
import { t } from '../utils/i18n'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences' | 'company'>(
    'profile'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Password form
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
  })

  // Company attendance settings
  const [companySettings, setCompanySettings] = useState({
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakDuration: 60,
    lateThreshold: 15,
    overtimeThreshold: 8,
  })
  const [isLoadingCompanySettings, setIsLoadingCompanySettings] = useState(false)

  // Payroll formula settings
  const [payrollFormulaSettings, setPayrollFormulaSettings] = useState({
    overtimeMultiplier: 1.5,
    latePenaltyPerLate: 50000,
    bhxhRate: 0.08,
    pitRate: 0,
    standardWorkingDays: 22,
  })
  const [payrollReason, setPayrollReason] = useState('')
  const [isLoadingPayrollFormula, setIsLoadingPayrollFormula] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '', // Phone không có trong User interface, cần load từ API
      })
    }
  }, [user])

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('admin_preferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
    }

    // Load company attendance settings from API
    const loadCompanySettings = async () => {
      try {
        setIsLoadingCompanySettings(true)
        const data = await adminService.getAttendanceSettings()
        setCompanySettings({
          workStartTime: data.workStartTime,
          workEndTime: data.workEndTime,
          breakDuration: data.breakDuration,
          lateThreshold: data.lateThreshold,
          overtimeThreshold: data.overtimeThreshold,
        })
      } catch (error: any) {
        console.error('Failed to load attendance settings:', error)
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load company attendance settings',
        })
      } finally {
        setIsLoadingCompanySettings(false)
      }
    }

    const loadPayrollFormulaSettings = async () => {
      try {
        setIsLoadingPayrollFormula(true)
        const data = await adminService.getPayrollFormulaSettings()
        setPayrollFormulaSettings({
          overtimeMultiplier: data.overtimeMultiplier,
          latePenaltyPerLate: data.latePenaltyPerLate,
          bhxhRate: data.bhxhRate,
          pitRate: data.pitRate,
          standardWorkingDays: data.standardWorkingDays,
        })
      } catch (error: any) {
        console.error('Failed to load payroll formula settings:', error)
        setMessage({
          type: 'error',
          text: error.message || 'Failed to load payroll formula settings',
        })
      } finally {
        setIsLoadingPayrollFormula(false)
      }
    }

    loadCompanySettings()
    loadPayrollFormulaSettings()
  }, [])

  const handleProfileUpdate = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API endpoint for updating admin profile
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

      setMessage({ type: 'success', text: t('settings.profileUpdated') || 'Profile updated successfully!' })
      await refreshUser()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Validation
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('auth.passwordMinLength') || 'Password must be at least 8 characters' })
      setIsLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('auth.passwordsNotMatch') || 'Passwords do not match' })
      setIsLoading(false)
      return
    }

    try {
      // TODO: Implement API endpoint for changing password
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

      setMessage({ type: 'success', text: t('settings.passwordChanged') || 'Password changed successfully!' })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Save preferences to localStorage
      localStorage.setItem('admin_preferences', JSON.stringify(preferences))
      await new Promise((resolve) => setTimeout(resolve, 300))

      setMessage({ type: 'success', text: t('settings.preferencesSaved') || 'Preferences saved successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySettingsUpdate = async (e: any) => {
    e.preventDefault()
    setIsLoadingCompanySettings(true)
    setMessage(null)

    try {
      await adminService.updateAttendanceSettings({
        workStartTime: companySettings.workStartTime,
        workEndTime: companySettings.workEndTime,
        breakDuration: companySettings.breakDuration,
        lateThreshold: companySettings.lateThreshold,
        overtimeThreshold: companySettings.overtimeThreshold,
      })

      setMessage({
        type: 'success',
        text:
          t('settings.companySettingsUpdated') ||
          'Company working hours and attendance settings updated successfully!',
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update company attendance settings',
      })
    } finally {
      setIsLoadingCompanySettings(false)
    }
  }

  const handlePayrollFormulaUpdate = async (e: any) => {
    e.preventDefault()
    setIsLoadingPayrollFormula(true)
    setMessage(null)

    try {
      await adminService.updatePayrollFormulaSettings({
        overtimeMultiplier: payrollFormulaSettings.overtimeMultiplier,
        latePenaltyPerLate: payrollFormulaSettings.latePenaltyPerLate,
        bhxhRate: payrollFormulaSettings.bhxhRate,
        pitRate: payrollFormulaSettings.pitRate,
        standardWorkingDays: payrollFormulaSettings.standardWorkingDays,
        reason: payrollReason || undefined,
      })

      setMessage({
        type: 'success',
        text: 'Payroll formula settings updated successfully!',
      })
      setPayrollReason('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update payroll formula settings',
      })
    } finally {
      setIsLoadingPayrollFormula(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>
        <p className="text-gray-600 mt-1">{t('settings.description') || 'Manage your account settings and preferences'}</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.profile') || 'Profile'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'password'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.password') || 'Password'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.preferences') || 'Preferences'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'company'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.company') || 'Company Working Hours'}
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">{t('settings.emailCannotChange') || 'Email cannot be changed'}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  {t('auth.phone')}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={t('auth.phone') || 'Phone number'}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <Save size={16} />
                {isLoading ? t('common.loading') : t('settings.saveChanges') || 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="inline mr-2" />
                {t('settings.currentPassword') || 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="inline mr-2" />
                {t('settings.newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('auth.passwordMinLength')}</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="inline mr-2" />
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <Lock size={16} />
                {isLoading ? t('common.loading') : t('settings.changePassword') || 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t('settings.emailNotifications') || 'Email Notifications'}</h3>
                <p className="text-sm text-gray-500">{t('settings.emailNotificationsDesc') || 'Receive email notifications for important updates'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t('settings.pushNotifications') || 'Push Notifications'}</h3>
                <p className="text-sm text-gray-500">{t('settings.pushNotificationsDesc') || 'Receive push notifications on your device'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Weekly Reports */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t('settings.weeklyReports') || 'Weekly Reports'}</h3>
                <p className="text-sm text-gray-500">{t('settings.weeklyReportsDesc') || 'Receive weekly summary reports via email'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weeklyReports}
                  onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePreferencesUpdate}
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <Save size={16} />
                {isLoading ? t('common.loading') : t('settings.savePreferences') || 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Working Hours Tab */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleCompanySettingsUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Work Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-2" />
                    {t('settings.workStartTime') || 'Work Start Time'}
                  </label>
                  <input
                    type="time"
                    value={companySettings.workStartTime}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, workStartTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Work End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-2" />
                    {t('settings.workEndTime') || 'Work End Time'}
                  </label>
                  <input
                    type="time"
                    value={companySettings.workEndTime}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, workEndTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.breakDuration') || 'Break Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={companySettings.breakDuration}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        breakDuration: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Late Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.lateThreshold') || 'Late Threshold (minutes)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={companySettings.lateThreshold}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        lateThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Overtime Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.overtimeThreshold') || 'Overtime Threshold (hours)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={companySettings.overtimeThreshold}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        overtimeThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingCompanySettings}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  <Save size={16} />
                  {isLoadingCompanySettings
                    ? t('common.loading')
                    : t('settings.saveCompanySettings') || 'Save Company Settings'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Payroll Formula Settings</h2>
            <p className="text-sm text-gray-500 mb-6">
              Cấu hình mặc định cho nút “Tính tự động” ở Payroll.
            </p>

            <form onSubmit={handlePayrollFormulaUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OT Multiplier (x)</label>
                  <input
                    type="number"
                    min={1}
                    step={0.1}
                    value={payrollFormulaSettings.overtimeMultiplier}
                    onChange={(e) =>
                      setPayrollFormulaSettings({
                        ...payrollFormulaSettings,
                        overtimeMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phạt đi muộn / lần (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={payrollFormulaSettings.latePenaltyPerLate}
                    onChange={(e) =>
                      setPayrollFormulaSettings({
                        ...payrollFormulaSettings,
                        latePenaltyPerLate: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">BHXH rate (0-1)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={payrollFormulaSettings.bhxhRate}
                    onChange={(e) =>
                      setPayrollFormulaSettings({
                        ...payrollFormulaSettings,
                        bhxhRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thuế TNCN rate (0-1)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={payrollFormulaSettings.pitRate}
                    onChange={(e) =>
                      setPayrollFormulaSettings({
                        ...payrollFormulaSettings,
                        pitRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số ngày công chuẩn / tháng</label>
                  <input
                    type="number"
                    min={1}
                    value={payrollFormulaSettings.standardWorkingDays}
                    onChange={(e) =>
                      setPayrollFormulaSettings({
                        ...payrollFormulaSettings,
                        standardWorkingDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do thay đổi (audit log)</label>
                <textarea
                  rows={3}
                  value={payrollReason}
                  onChange={(e) => setPayrollReason(e.target.value)}
                  placeholder="Ví dụ: Cập nhật BHXH theo chính sách mới"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingPayrollFormula}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  <Save size={16} />
                  {isLoadingPayrollFormula ? 'Đang lưu...' : 'Lưu công thức lương'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { Calendar, Globe, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/i18n'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userInitial = user?.firstName?.[0] || user?.email?.[0] || 'A'

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi')
  }

  const handleSchedule = () => {
    console.log('🔵 Header: Schedule clicked')
    navigate('/schedule')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Search:', searchQuery)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Profile & Greeting */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {userInitial.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('common.welcome')}
            </h2>
            {user && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <Globe size={20} />
          </button>
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button 
              type="button"
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <Search size={20} />
            </button>
          )}
          <button 
            type="button"
            onClick={handleSchedule}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <Calendar size={20} />
            <span className="font-medium">{t('common.schedule')}</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
    </header>
  )
}

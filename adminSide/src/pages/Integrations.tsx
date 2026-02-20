import { useState } from 'react'
import { t } from '../utils/i18n'
import { Plug, Check, X, ExternalLink, Settings as SettingsIcon, Mail, Calendar, Users } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'connected' | 'available' | 'coming_soon'
  category: 'communication' | 'calendar' | 'hr' | 'analytics'
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Email Integration',
      description: 'Connect your email to send notifications and reports',
      icon: <Mail className="text-blue-500" size={24} />,
      status: 'available',
      category: 'communication',
    },
    {
      id: '2',
      name: 'Google Calendar',
      description: 'Sync schedules and events with Google Calendar',
      icon: <Calendar className="text-red-500" size={24} />,
      status: 'available',
      category: 'calendar',
    },
    {
      id: '3',
      name: 'Slack',
      description: 'Send notifications and updates to Slack channels',
      icon: <Plug className="text-purple-500" size={24} />,
      status: 'coming_soon',
      category: 'communication',
    },
    {
      id: '4',
      name: 'Microsoft Teams',
      description: 'Integrate with Microsoft Teams for team collaboration',
      icon: <Users className="text-blue-600" size={24} />,
      status: 'coming_soon',
      category: 'communication',
    },
    {
      id: '5',
      name: 'Zoom',
      description: 'Schedule and manage Zoom meetings directly from HRsync',
      icon: <Calendar className="text-blue-500" size={24} />,
      status: 'coming_soon',
      category: 'calendar',
    },
    {
      id: '6',
      name: 'Payroll System',
      description: 'Connect with payroll systems for automated salary processing',
      icon: <SettingsIcon className="text-green-500" size={24} />,
      status: 'coming_soon',
      category: 'hr',
    },
  ])

  const [filter, setFilter] = useState<'all' | 'connected' | 'available' | 'coming_soon'>('all')

  const filteredIntegrations = integrations.filter((integration) => {
    if (filter === 'all') return true
    return integration.status === filter
  })

  const handleConnect = (id: string) => {
    // TODO: Implement actual integration connection logic
    setIntegrations(
      integrations.map((integration) => (integration.id === id ? { ...integration, status: 'connected' as const } : integration))
    )
  }

  const handleDisconnect = (id: string) => {
    // TODO: Implement actual integration disconnection logic
    setIntegrations(
      integrations.map((integration) => (integration.id === id ? { ...integration, status: 'available' as const } : integration))
    )
  }

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
            <Check size={12} />
            {t('integrations.connected') || 'Connected'}
          </span>
        )
      case 'available':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {t('integrations.available') || 'Available'}
          </span>
        )
      case 'coming_soon':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {t('integrations.comingSoon') || 'Coming Soon'}
          </span>
        )
    }
  }

  const getCategoryLabel = (category: Integration['category']) => {
    switch (category) {
      case 'communication':
        return t('integrations.category.communication') || 'Communication'
      case 'calendar':
        return t('integrations.category.calendar') || 'Calendar'
      case 'hr':
        return t('integrations.category.hr') || 'HR'
      case 'analytics':
        return t('integrations.category.analytics') || 'Analytics'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.integrations')}</h1>
        <p className="text-gray-600 mt-1">
          {t('integrations.description') || 'Connect HRsync with your favorite tools and services'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t('integrations.filter.all') || 'All'}
        </button>
        <button
          type="button"
          onClick={() => setFilter('connected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'connected'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t('integrations.filter.connected') || 'Connected'}
        </button>
        <button
          type="button"
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'available'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t('integrations.filter.available') || 'Available'}
        </button>
        <button
          type="button"
          onClick={() => setFilter('coming_soon')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'coming_soon'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t('integrations.filter.comingSoon') || 'Coming Soon'}
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            {t('common.noResults')}
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {integration.icon}
                </div>
                {getStatusBadge(integration.status)}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{integration.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="mb-4">
                <span className="text-xs text-gray-500">{t('integrations.category') || 'Category'}:</span>
                <span className="ml-2 text-xs font-medium text-gray-700">{getCategoryLabel(integration.category)}</span>
              </div>

              <div className="flex items-center gap-2">
                {integration.status === 'connected' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(integration.id)}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      {t('integrations.disconnect') || 'Disconnect'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <SettingsIcon size={16} />
                    </button>
                  </>
                ) : integration.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() => handleConnect(integration.id)}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plug size={16} />
                    {t('integrations.connect') || 'Connect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {t('integrations.comingSoon') || 'Coming Soon'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Plug className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">{t('integrations.info.title') || 'About Integrations'}</h3>
            <p className="text-sm text-blue-800 mb-4">
              {t('integrations.info.description') ||
                'Integrations allow you to connect HRsync with other tools and services you use. This helps streamline your workflow and automate tasks.'}
            </p>
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {t('integrations.learnMore') || 'Learn more'} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

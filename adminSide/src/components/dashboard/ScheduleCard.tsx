import { ChevronRight, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../utils/i18n'

interface Meeting {
  title: string
  time: string
  duration: string
  attendees: number
  platform: string
  tag: { label: string; color: string }
}

const meetings: Meeting[] = [
  {
    title: 'Meeting Product',
    time: '9:00 - 9:45 AM',
    duration: '45 min',
    attendees: 5,
    platform: 'On Zoom',
    tag: { label: 'Product Team', color: 'bg-blue-100 text-blue-700' },
  },
  {
    title: 'Meeting Ops',
    time: '10:00 - 11:00 AM',
    duration: '1 hour',
    attendees: 5,
    platform: 'On Slack',
    tag: { label: 'Operations Team', color: 'bg-green-100 text-green-700' },
  },
]

export default function ScheduleCard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'Meetings' | 'Events'>('Meetings')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  const handleSeeAll = () => {
    console.log('🔵 ScheduleCard: See All clicked')
    navigate('/schedule')
  }

  const handlePrevMonth = () => {
    console.log('🔵 ScheduleCard: Previous month clicked')
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    console.log('🔵 ScheduleCard: Next month clicked')
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('common.schedule')}</h3>
        <button 
          type="button"
          onClick={handleSeeAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          {t('common.seeAll')}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">{monthYear}</h4>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <ChevronRightIcon size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, index) => {
            const day = index + 1
            const isToday = day === 13
            return (
              <div
                key={index}
                className={`text-center text-xs py-2 rounded ${
                  isToday
                    ? 'bg-blue-600 text-white font-semibold'
                    : day <= 31
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300'
                }`}
              >
                {day <= 31 ? day : ''}
              </div>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('Meetings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'Meetings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('dashboard.meetings')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Events')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'Events'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('dashboard.events')}
        </button>
      </div>

      {/* Meetings List */}
      {activeTab === 'Meetings' && (
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Meeting Mitra 2025</h5>
            <div className="space-y-3">
              {meetings.map((meeting, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-3">
                  <div className="flex items-start justify-between mb-1">
                    <h6 className="text-sm font-medium text-gray-900">{meeting.title}</h6>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${meeting.tag.color}`}>
                      {meeting.tag.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{meeting.time}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(meeting.attendees, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"
                          />
                        ))}
                      </div>
                      {meeting.attendees > 3 && (
                        <span className="ml-1">+{meeting.attendees - 3}</span>
                      )}
                    </div>
                    <span>{meeting.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

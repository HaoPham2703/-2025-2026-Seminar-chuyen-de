import { X } from 'lucide-react'
import { useState } from 'react'
import { t } from '../../utils/i18n'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (task: {
    title: string
    description: string
    tag?: { label: string; color: string }
    dueDate: string
  }) => void
}

export default function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState<string>('')
  const [dueDate, setDueDate] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const tagMap: Record<string, { label: string; color: string }> = {
      recruitment: { label: 'Recruitment', color: 'bg-blue-100 text-blue-700' },
      important: { label: 'Important', color: 'bg-purple-100 text-purple-700' },
    }

    onAdd({
      title: title.trim(),
      description: description.trim(),
      tag: tag ? tagMap[tag] : undefined,
      dueDate: dueDate || 'Today',
    })

    // Reset form
    setTitle('')
    setDescription('')
    setTag('')
    setDueDate('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('task.addTask') || 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('task.title') || 'Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={t('task.titlePlaceholder') || 'Enter task title'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('task.description') || 'Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={t('task.descriptionPlaceholder') || 'Enter task description'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('task.tag') || 'Tag'}
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">{t('common.optional')}</option>
              <option value="recruitment">{t('dashboard.recruitment')}</option>
              <option value="important">{t('dashboard.important')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('task.dueDate') || 'Due Date'}
            </label>
            <select
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="Today">{t('dashboard.today')}</option>
              <option value="Tomorrow">{t('task.tomorrow') || 'Tomorrow'}</option>
              <option value="Next Week">{t('task.nextWeek') || 'Next Week'}</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
            >
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

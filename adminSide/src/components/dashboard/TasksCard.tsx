import { Plus, Check } from 'lucide-react'
import { useState } from 'react'
import { t } from '../../utils/i18n'
import AddTaskModal from './AddTaskModal'

interface Task {
  id: string
  title: string
  description: string
  status: 'Pending' | 'Completed'
  tag?: { label: string; color: string }
  dueDate: string
  dueDateColor: string
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Update Payroll Records',
    description: 'Verify salary adjustments and overtime lo...',
    status: 'Pending',
    dueDate: 'Today',
    dueDateColor: 'text-orange-600',
  },
  {
    id: '2',
    title: 'Interview with Sarah Lee',
    description: 'Conduct candidate interview for Marketin...',
    status: 'Pending',
    tag: { label: 'Recruitment', color: 'bg-blue-100 text-blue-700' },
    dueDate: 'Today',
    dueDateColor: 'text-orange-600',
  },
  {
    id: '3',
    title: 'Review Leave Applications',
    description: 'Check pending leave requests and approv...',
    status: 'Pending',
    tag: { label: 'Important', color: 'bg-purple-100 text-purple-700' },
    dueDate: 'Yesterday',
    dueDateColor: 'text-red-600',
  },
]

export default function TasksCard() {
  const [taskList, setTaskList] = useState(tasks)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleToggleTask = (taskId: string) => {
    console.log('🔵 TasksCard: Toggle task', taskId)
    setTaskList(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'Pending' ? 'Completed' : 'Pending' }
        : task
    ))
  }

  const handleAddTask = () => {
    console.log('🔵 TasksCard: Add task clicked')
    setShowAddModal(true)
  }

  const handleAddNewTask = (newTask: {
    title: string
    description: string
    tag?: { label: string; color: string }
    dueDate: string
  }) => {
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'Pending',
      tag: newTask.tag,
      dueDate: newTask.dueDate,
      dueDateColor: newTask.dueDate === 'Today' ? 'text-orange-600' : 
                    newTask.dueDate === 'Tomorrow' ? 'text-blue-600' : 
                    'text-gray-600',
    }
    setTaskList((prev) => [task, ...prev])
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.tasks')}</h3>
        <button 
          type="button"
          onClick={handleAddTask}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium cursor-pointer"
        >
          <Plus size={16} />
          {t('common.add')}
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
        {taskList.map((task) => (
          <div key={task.id} className="flex items-start gap-3">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleTask(task.id)
              }}
              className="mt-1 w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              {task.status === 'Completed' && (
                <Check size={14} className="text-blue-600" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                {task.tag && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${task.tag.color}`}>
                    {task.tag.label === 'Recruitment' ? t('dashboard.recruitment') : 
                     task.tag.label === 'Important' ? t('dashboard.important') : 
                     task.tag.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">{task.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{t(`common.${task.status.toLowerCase()}`)}</span>
                <span className="text-xs font-medium" style={{ color: task.dueDateColor }}>
                  {t('dashboard.due')}: {task.dueDate === 'Today' ? t('dashboard.today') : 
                                         task.dueDate === 'Yesterday' ? t('dashboard.yesterday') : 
                                         task.dueDate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddNewTask}
      />
    </div>
  )
}

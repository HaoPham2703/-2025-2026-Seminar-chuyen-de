import { useState } from 'react'
import { t } from '../utils/i18n'
import { HelpCircle, Mail, Phone, Clock, ChevronDown, ChevronUp, BookOpen, MessageCircle } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface Guide {
  id: string
  title: string
  description: string
  steps: string[]
}

export default function HelpCenter() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)

  const faqs: FAQ[] = [
    {
      id: '1',
      question: t('help.faq1.question') || 'How do I add a new employee?',
      answer:
        t('help.faq1.answer') ||
        'To add a new employee, go to the Departments page, click on the department, and use the "Add Employee" button. Fill in the required information and save.',
    },
    {
      id: '2',
      question: t('help.faq2.question') || 'How do I approve leave requests?',
      answer:
        t('help.faq2.answer') ||
        'Navigate to the Dashboard and find the Leave Requests card. Click on a pending request to view details, then click "Approve" or "Reject" as needed.',
    },
    {
      id: '3',
      question: t('help.faq3.question') || 'How do I view attendance reports?',
      answer:
        t('help.faq3.answer') ||
        'Go to the Attendance page to see today\'s attendance records. You can filter by date and view detailed statistics for each employee.',
    },
    {
      id: '4',
      question: t('help.faq4.question') || 'How do I generate reports?',
      answer:
        t('help.faq4.answer') ||
        'Visit the Reports page to view comprehensive statistics. You can filter by date range and export the data if needed.',
    },
    {
      id: '5',
      question: t('help.faq5.question') || 'How do I manage departments?',
      answer:
        t('help.faq5.answer') ||
        'The Departments page shows all departments with their employees. You can view employee details, add new employees, and manage department structure.',
    },
    {
      id: '6',
      question: t('help.faq6.question') || 'How do I change my password?',
      answer:
        t('help.faq6.answer') ||
        'Go to Settings > Password tab. Enter your current password and new password, then click "Change Password".',
    },
  ]

  const guides: Guide[] = [
    {
      id: '1',
      title: t('help.guide1.title') || 'Getting Started',
      description: t('help.guide1.description') || 'Learn the basics of using HRsync',
      steps: [
        t('help.guide1.step1') || 'Log in to your admin account',
        t('help.guide1.step2') || 'Explore the Dashboard to see overview statistics',
        t('help.guide1.step3') || 'Navigate to different sections using the sidebar',
        t('help.guide1.step4') || 'Start managing employees and attendance',
      ],
    },
    {
      id: '2',
      title: t('help.guide2.title') || 'Managing Employees',
      description: t('help.guide2.description') || 'How to add and manage employees',
      steps: [
        t('help.guide2.step1') || 'Go to Departments page',
        t('help.guide2.step2') || 'Select a department',
        t('help.guide2.step3') || 'Click "Add Employee" button',
        t('help.guide2.step4') || 'Fill in employee information and save',
      ],
    },
    {
      id: '3',
      title: t('help.guide3.title') || 'Viewing Reports',
      description: t('help.guide3.description') || 'How to generate and view reports',
      steps: [
        t('help.guide3.step1') || 'Navigate to Reports page',
        t('help.guide3.step2') || 'Select date range if needed',
        t('help.guide3.step3') || 'View statistics and analytics',
        t('help.guide3.step4') || 'Export data if required',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('help.title')}</h1>
        <p className="text-gray-600 mt-1">{t('help.description')}</p>
      </div>

      {/* FAQs Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="text-orange-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">{t('help.faq')}</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-left font-medium text-gray-900">{faq.question}</span>
                {expandedFAQ === faq.id ? (
                  <ChevronUp className="text-gray-500" size={20} />
                ) : (
                  <ChevronDown className="text-gray-500" size={20} />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-4 pb-4 text-gray-600 border-t border-gray-200 pt-4">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guides Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="text-orange-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">{t('help.guides')}</h2>
        </div>

        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{guide.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{guide.description}</p>
                </div>
                {expandedGuide === guide.id ? (
                  <ChevronUp className="text-gray-500" size={20} />
                ) : (
                  <ChevronDown className="text-gray-500" size={20} />
                )}
              </button>
              {expandedGuide === guide.id && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    {guide.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="text-orange-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">{t('help.support')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email Support */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail className="text-orange-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('help.email')}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">support@hrsync.com</p>
            <p className="text-xs text-gray-500 mt-2">{t('help.responseTime') || 'Response within 24 hours'}</p>
          </div>

          {/* Phone Support */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Phone className="text-orange-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('help.phone')}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">+84 123 456 789</p>
            <p className="text-xs text-gray-500 mt-2">{t('help.officeHours')}</p>
          </div>

          {/* Office Hours */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="text-orange-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('help.officeHours')}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('help.hours') || 'Mon - Fri: 9:00 AM - 6:00 PM'}</p>
            <p className="text-xs text-gray-500 mt-2">{t('help.timezone') || 'GMT+7 (Vietnam)'}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer flex items-center gap-2"
            onClick={() => {
              window.location.href = 'mailto:support@hrsync.com?subject=Support Request'
            }}
          >
            <Mail size={16} />
            {t('help.contactSupport')}
          </button>
        </div>
      </div>
    </div>
  )
}

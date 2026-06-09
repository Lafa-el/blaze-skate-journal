import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageSquare, Send } from 'lucide-react'

const faqs = [
  {
    question: 'How do I log a training session?',
    answer: 'Tap the "+" or "Sessions" button from the bottom navigation bar. Fill in the date, duration, skill focus, and notes, then tap Save to record your session.'
  },
  {
    question: 'How do I update my profile?',
    answer: 'Go to Settings > Edit Profile. There you can update your display name, bio, avatar photo, birthday, and skating start date.'
  },
  {
    question: 'How does Skating Age work?',
    answer: 'Skating Age is calculated annually based on July 1st. Skaters born January 1 - June 30 advance their age on July 1, while those born July 1 - December 31 advance on the following January 1. This follows ISU competition rules.'
  },
  {
    question: 'How do I export my data?',
    answer: 'Go to Settings > Export Data. You can download all your training sessions, notes, and reviews as a CSV or JSON file for backup purposes.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the login page, tap "Forgot Password" and enter your registered email address. We will send you a password reset link.'
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Privacy & Security > Delete Account. Follow the multi-step confirmation process. Warning: This action is permanent and all your data will be lost.'
  },
  {
    question: 'Can I use this app offline?',
    answer: 'The app works best with an internet connection. Some features may work offline, but data syncs when you reconnect.'
  }
]

export default function HelpSupport() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [formSent, setFormSent] = useState(false)
  const [sending, setSending] = useState(false)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    
    // For now, open mailto link with form data
    const subject = encodeURIComponent('Support Request from Blaze Skate Journal')
    const body = encodeURIComponent(`Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`)
    window.location.href = `mailto:support@blazeskatejournal.com?subject=${subject}&body=${body}`
    
    setFormSent(true)
    setSending(false)
    setContactForm({ name: '', email: '', message: '' })
    
    setTimeout(() => setFormSent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Help & Support</h1>
          <div className="flex-1" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* FAQs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 pr-2">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Us */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Contact Us</h2>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <a href="mailto:support@blazeskate.com" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">support@blazeskate.com</p>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleContactSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Your name"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="How can we help you?"
                rows={4}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>

          {formSent && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Opening your email client to send the message...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

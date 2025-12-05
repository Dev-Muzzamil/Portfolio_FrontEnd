import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Mail, Reply, Trash2, Eye, EyeOff, Calendar, User, MessageSquare, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'

const ContactsManagement = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  const statusOptions = [
    'all',
    'unread',
    'read',
    'replied'
  ]

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/contact')
      setContacts(response.data.contacts)
    } catch (error) {
      console.error('Fetch contacts error:', error)
      toast.error('Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (contactId, isRead) => {
    try {
      await api.put(`/contact/${contactId}/read`, { isRead })
      toast.success(`Message marked as ${isRead ? 'read' : 'unread'}`)
      fetchContacts()
    } catch (error) {
      console.error('Mark as read error:', error)
      toast.error('Failed to update message status')
    }
  }

  const handleReply = async (contactId) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      setReplying(true)
      await api.put(`/contact/${contactId}/reply`, { replyMessage })
      toast.success('Reply sent successfully')
      setReplyMessage('')
      setSelectedContact(null)
      fetchContacts()
    } catch (error) {
      console.error('Reply error:', error)
      toast.error('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      await api.delete(`/contact/${contactId}`)
      toast.success('Message deleted successfully')
      fetchContacts()
    } catch (error) {
      console.error('Delete contact error:', error)
      toast.error('Failed to delete message')
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (selectedStatus === 'unread') matchesStatus = !contact.isRead
    else if (selectedStatus === 'read') matchesStatus = contact.isRead
    else if (selectedStatus === 'replied') matchesStatus = contact.replied

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (contact) => {
    if (contact.replied) return 'bg-green-100 text-green-800'
    if (!contact.isRead) return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (contact) => {
    if (contact.replied) return 'Replied'
    if (!contact.isRead) return 'Unread'
    return 'Read'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages & Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage and reply to incoming contact messages</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchContacts}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Messages</option>
          {statusOptions.filter(status => status !== 'all').map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contacts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {contacts.filter(c => !c.isRead).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {contacts.filter(c => c.isRead && !c.replied).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Read</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {contacts.filter(c => c.replied).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Replied</div>
        </div>
      </div>

      {/* Messages List */}
      <div className="card">
        <div className="space-y-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No messages found
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact._id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{contact.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-md ${getStatusColor(contact)}`}>
                        {getStatusText(contact)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(contact.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">Subject:</h5>
                      <p className="text-gray-600 dark:text-gray-400">{contact.subject}</p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">Message:</h5>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                        {contact.message}
                      </p>
                    </div>

                    {contact.replyMessage && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-200 mb-1">Your Reply:</h5>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          {contact.replyMessage}
                        </p>
                        {contact.repliedAt && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Replied on {formatDate(contact.repliedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!contact.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(contact._id, true)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {contact.isRead && !contact.replied && (
                      <button
                        onClick={() => handleMarkAsRead(contact._id, false)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        title="Mark as unread"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    {!contact.replied && (
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Reply to message"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(contact._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedContact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContact(null)
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <Reply className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reply to Message</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your reply will be sent to {selectedContact.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedContact(null)
                  setReplyMessage('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{selectedContact.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(selectedContact.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6">{selectedContact.subject}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Message:</span>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Your Reply
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-colors"
                  rows="8"
                  placeholder="Type your reply here... Your message will be sent directly to the contact's email address."
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {replyMessage.length} characters
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedContact(null)
                  setReplyMessage('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReply(selectedContact._id)}
                disabled={replying || !replyMessage.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ContactsManagement

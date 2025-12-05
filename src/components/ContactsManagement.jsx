import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw, Mail, Reply, Trash2, Eye, EyeOff, Calendar, User, MessageSquare, X, Send, Plus, CheckCircle, AlertCircle, Loader2, History, RotateCcw, ExternalLink, Clock, CheckCheck, XCircle, Download, Paperclip, File, FileText, Image, Music, Video, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'

const ContactsManagement = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const [importing, setImporting] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [syncMode, setSyncMode] = useState(null) // 'quick' or 'full'
  
  // Thread view state
  const [showThreadView, setShowThreadView] = useState(false)
  const [threadData, setThreadData] = useState(null)
  const [loadingThread, setLoadingThread] = useState(false)
  
  // Expanded card state
  const [expandedContactId, setExpandedContactId] = useState(null)
  
  // Attachment state
  const [replyAttachments, setReplyAttachments] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const fileInputRef = useRef(null)
  
  // Tab state - messages or sent history
  const [activeTab, setActiveTab] = useState('messages') // 'messages' or 'sent'
  
  // Sent emails state
  const [sentEmails, setSentEmails] = useState([])
  const [sentEmailsLoading, setSentEmailsLoading] = useState(false)
  const [sentEmailStats, setSentEmailStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [selectedSentEmail, setSelectedSentEmail] = useState(null)
  const [sentStatusFilter, setSentStatusFilter] = useState('all')
  const [retrying, setRetrying] = useState(null)
  const [verifying, setVerifying] = useState(null)
  const [emailConfigStatus, setEmailConfigStatus] = useState(null)
  
  // Compose email state
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  })
  const [composing, setComposing] = useState(false)
  const [emailValidation, setEmailValidation] = useState({
    status: null, // null, 'validating', 'valid', 'invalid', 'warning'
    message: ''
  })

  const statusOptions = [
    'all',
    'unread',
    'read',
    'replied'
  ]

  useEffect(() => {
    fetchContacts()
    fetchSentEmails()
    fetchEmailConfigStatus()
    fetchWatchStatus()
  }, [])

  const fetchEmailConfigStatus = async () => {
    try {
      const response = await api.get('/contact/email-config-status')
      setEmailConfigStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch email config status:', error)
    }
  }

  const fetchWatchStatus = async () => {
    try {
      const response = await api.get('/contact/watch-emails/status')
      setIsWatching(response.data.watching)
    } catch (error) {
      console.error('Failed to fetch watch status:', error)
    }
  }

  const fetchContacts = async (softRefresh = false) => {
    try {
      if (softRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await api.get('/contact')
      setContacts(response.data.contacts)
    } catch (error) {
      console.error('Fetch contacts error:', error)
      if (!softRefresh) {
        toast.error('Failed to fetch contacts')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchSentEmails = async (softRefresh = false) => {
    try {
      if (!softRefresh) {
        setSentEmailsLoading(true)
      }
      const response = await api.get('/contact/sent', {
        params: { status: sentStatusFilter !== 'all' ? sentStatusFilter : undefined }
      })
      setSentEmails(response.data.sentEmails)
      setSentEmailStats(response.data.stats)
    } catch (error) {
      console.error('Fetch sent emails error:', error)
    } finally {
      setSentEmailsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentEmails()
    }
  }, [sentStatusFilter, activeTab])

  // Auto-refresh when watching (soft refresh to avoid UI flicker)
  useEffect(() => {
    let interval
    if (isWatching) {
      interval = setInterval(() => {
        fetchContacts(true) // soft refresh
      }, 10000) // Refresh every 10 seconds when watching
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWatching])

  const handleImportEmails = async (fullSync = false) => {
    try {
      setImporting(true)
      setSyncMode(fullSync ? 'full' : 'quick')
      
      const response = await api.post('/contact/import-emails', { fullSync })
      const { imported, skipped, fetched } = response.data
      
      if (imported > 0) {
        toast.success(`Imported ${imported} new email${imported > 1 ? 's' : ''}`)
        fetchContacts(true) // soft refresh
      } else if (fetched === 0) {
        toast.info('No new emails found')
      } else {
        toast.info(`All ${skipped} emails already synced`)
      }
    } catch (error) {
      console.error('Import emails error:', error)
      toast.error(error.response?.data?.message || 'Failed to import emails')
    } finally {
      setImporting(false)
      setSyncMode(null)
    }
  }

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await api.post('/contact/watch-emails/stop')
        setIsWatching(false)
        toast.success('Stopped watching for new emails')
      } else {
        await api.post('/contact/watch-emails/start')
        setIsWatching(true)
        toast.success('Now watching for new emails in real-time!')
      }
    } catch (error) {
      console.error('Toggle watch error:', error)
      toast.error(error.response?.data?.message || 'Failed to toggle email watch')
    }
  }

  // Fetch thread for a contact
  const fetchThread = async (contactId) => {
    try {
      setLoadingThread(true)
      const response = await api.get(`/contact/${contactId}/thread`)
      setThreadData(response.data)
      setShowThreadView(true)
    } catch (error) {
      console.error('Fetch thread error:', error)
      toast.error('Failed to load conversation thread')
    } finally {
      setLoadingThread(false)
    }
  }

  // Handle file selection for attachments
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Validate file sizes (25MB max each)
    const maxSize = 25 * 1024 * 1024
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 25MB)`)
        return false
      }
      return true
    })

    if (!validFiles.length) return

    try {
      setUploadingAttachments(true)
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await api.post('/contact/upload-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setReplyAttachments(prev => [...prev, ...response.data.attachments])
      toast.success(`${response.data.attachments.length} file(s) uploaded`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload files')
    } finally {
      setUploadingAttachments(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove attachment from list
  const removeAttachment = async (attachment) => {
    try {
      // Try to delete from cloudinary
      if (attachment.publicId) {
        await api.delete(`/contact/attachment/${encodeURIComponent(attachment.publicId)}`)
      }
      setReplyAttachments(prev => prev.filter(a => a.url !== attachment.url))
    } catch (error) {
      // Still remove from UI even if cloudinary delete fails
      setReplyAttachments(prev => prev.filter(a => a.url !== attachment.url))
    }
  }

  // Get icon for file type
  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType?.startsWith('audio/')) return <Music className="w-4 h-4" />
    if (mimeType?.startsWith('video/')) return <Video className="w-4 h-4" />
    if (mimeType?.includes('pdf') || mimeType?.includes('document') || mimeType?.includes('word')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleMarkAsRead = async (contactId, isRead) => {
    try {
      await api.put(`/contact/${contactId}/read`, { isRead })
      toast.success(`Message marked as ${isRead ? 'read' : 'unread'}`)
      fetchContacts(true) // soft refresh
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
      await api.put(`/contact/${contactId}/reply`, { 
        replyMessage,
        attachments: replyAttachments
      })
      toast.success('Reply sent successfully')
      setReplyMessage('')
      setReplyAttachments([])
      setSelectedContact(null)
      setExpandedContactId(null)
      setShowThreadView(false)
      setThreadData(null)
      fetchContacts(true) // soft refresh
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
      fetchContacts(true) // soft refresh
    } catch (error) {
      console.error('Delete contact error:', error)
      toast.error('Failed to delete message')
    }
  }

  // Email validation with debounce
  const validateEmail = async (email) => {
    if (!email || !email.trim()) {
      setEmailValidation({ status: null, message: '' })
      return
    }

    // Basic format check first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailValidation({ status: 'invalid', message: 'Invalid email format' })
      return
    }

    setEmailValidation({ status: 'validating', message: 'Verifying email...' })

    try {
      const response = await api.post('/contact/verify-email', { email })
      if (response.data.valid) {
        if (response.data.warning) {
          setEmailValidation({ status: 'warning', message: response.data.warning })
        } else {
          setEmailValidation({ status: 'valid', message: response.data.message || 'Email is valid' })
        }
      } else {
        setEmailValidation({ status: 'invalid', message: response.data.message || 'Invalid email' })
      }
    } catch (error) {
      console.error('Email validation error:', error)
      setEmailValidation({ status: 'warning', message: 'Could not verify email' })
    }
  }

  // Debounced email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (composeData.to) {
        validateEmail(composeData.to)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [composeData.to])

  const handleComposeSubmit = async () => {
    if (!composeData.to.trim()) {
      toast.error('Please enter a recipient email')
      return
    }
    if (!composeData.subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!composeData.message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (emailValidation.status === 'invalid') {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setComposing(true)
      await api.post('/contact/compose', composeData)
      toast.success('Email sent successfully!')
      setShowComposeModal(false)
      setComposeData({ to: '', cc: '', bcc: '', subject: '', message: '' })
      setEmailValidation({ status: null, message: '' })
      fetchSentEmails() // Refresh sent emails
    } catch (error) {
      console.error('Compose email error:', error)
      toast.error(error.response?.data?.message || 'Failed to send email')
      fetchSentEmails() // Still refresh to show failed email
    } finally {
      setComposing(false)
    }
  }

  const resetComposeModal = () => {
    setShowComposeModal(false)
    setComposeData({ to: '', cc: '', bcc: '', subject: '', message: '' })
    setEmailValidation({ status: null, message: '' })
  }

  const handleRetryEmail = async (emailId) => {
    try {
      setRetrying(emailId)
      await api.post(`/contact/sent/${emailId}/retry`)
      toast.success('Email sent successfully on retry!')
      fetchSentEmails()
    } catch (error) {
      console.error('Retry email error:', error)
      toast.error(error.response?.data?.message || 'Failed to retry email')
    } finally {
      setRetrying(null)
    }
  }

  const handleVerifyEmail = async (emailId) => {
    try {
      setVerifying(emailId)
      const response = await api.get(`/contact/sent/${emailId}/verify`)
      const verification = response.data.verification
      
      if (verification.verified) {
        toast.success(verification.verificationNote)
      } else {
        toast.error(verification.verificationNote)
      }
    } catch (error) {
      console.error('Verify email error:', error)
      toast.error('Failed to verify email status')
    } finally {
      setVerifying(null)
    }
  }

  const handleDeleteSentEmail = async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this sent email record?')) {
      return
    }

    try {
      await api.delete(`/contact/sent/${emailId}`)
      toast.success('Sent email record deleted')
      fetchSentEmails()
      if (selectedSentEmail?._id === emailId) {
        setSelectedSentEmail(null)
      }
    } catch (error) {
      console.error('Delete sent email error:', error)
      toast.error('Failed to delete sent email record')
    }
  }

  const getSentStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100/80 text-green-700'
      case 'failed': return 'bg-red-100/80 text-red-700'
      case 'pending': return 'bg-yellow-100/80 text-yellow-700'
      case 'bounced': return 'bg-orange-100/80 text-orange-700'
      default: return 'bg-ink/10 text-ink/60'
    }
  }

  const getSentStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCheck className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
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
    if (contact.replied) return 'bg-green-100/80 text-green-700'
    if (!contact.isRead) return 'bg-red-100/80 text-red-700'
    return 'bg-accent/20 text-accent'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Email Configuration Warning */}
      {emailConfigStatus && !emailConfigStatus.canSendEmail && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-serif font-medium text-amber-800">Email Sending Disabled</h4>
              <p className="text-sm text-amber-700 mt-1">
                {emailConfigStatus.emailDisabled 
                  ? 'Email is disabled by CONTACT_DISABLE_EMAIL=true in your environment.'
                  : !emailConfigStatus.hasEmailUser || !emailConfigStatus.hasEmailPass
                    ? 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in your backend .env file.'
                    : 'Email configuration issue detected.'}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                For Gmail: Use an App Password (Google Account → Security → 2-Step Verification → App Passwords)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-light text-ink">Messages & Email</h2>
          <p className="text-ink/60 font-sans text-sm">
            Manage contacts, compose emails, and view sent history
            {isWatching && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Real-time Watch Toggle */}
          <button
            onClick={handleToggleWatch}
            disabled={emailConfigStatus && !emailConfigStatus.canSendEmail}
            className={`flex items-center px-3 py-2 rounded-lg font-sans text-sm transition-all duration-200 ${
              isWatching 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'btn-secondary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isWatching ? 'Stop real-time sync' : 'Start real-time email sync'}
          >
            {isWatching ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                Live
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Go Live
              </>
            )}
          </button>
          
          {/* Quick Sync */}
          <button
            onClick={() => handleImportEmails(false)}
            disabled={importing || (emailConfigStatus && !emailConfigStatus.canSendEmail)}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Quick sync - last 24 hours"
          >
            {importing && syncMode === 'quick' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Sync
          </button>
          
          {/* Full Sync */}
          <button
            onClick={() => handleImportEmails(true)}
            disabled={importing || (emailConfigStatus && !emailConfigStatus.canSendEmail)}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Full sync - import ALL emails"
          >
            {importing && syncMode === 'full' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <History className="w-4 h-4 mr-2" />
            )}
            Full Sync
          </button>
          
          <button
            onClick={() => setShowComposeModal(true)}
            disabled={emailConfigStatus && !emailConfigStatus.canSendEmail}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={emailConfigStatus && !emailConfigStatus.canSendEmail ? 'Email not configured' : ''}
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </button>
          <button
            onClick={() => activeTab === 'messages' ? fetchContacts(true) : fetchSentEmails(true)}
            disabled={isRefreshing}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-ink/10 pb-0">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-6 py-3 font-sans text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
            activeTab === 'messages'
              ? 'text-ink border-accent'
              : 'text-ink/50 border-transparent hover:text-ink/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Inbox
            {contacts.filter(c => !c.isRead).length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100/80 text-red-700 rounded-full">
                {contacts.filter(c => !c.isRead).length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 font-sans text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
            activeTab === 'sent'
              ? 'text-ink border-accent'
              : 'text-ink/50 border-transparent hover:text-ink/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Sent Emails
            <span className="px-2 py-0.5 text-xs bg-ink/10 text-ink/60 rounded-full">
              {sentEmailStats.total}
            </span>
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'messages' ? (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink/40 w-4 h-4" />
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
                <div className="text-2xl font-serif font-light text-ink">
                  {contacts.length}
                </div>
                <div className="text-xs font-sans uppercase tracking-widest text-ink/50">Total Messages</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-serif font-light text-red-600">
                  {contacts.filter(c => !c.isRead).length}
                </div>
                <div className="text-xs font-sans uppercase tracking-widest text-ink/50">Unread</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-serif font-light text-accent">
                  {contacts.filter(c => c.isRead && !c.replied).length}
                </div>
                <div className="text-xs font-sans uppercase tracking-widest text-ink/50">Read</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-serif font-light text-green-600">
                  {contacts.filter(c => c.replied).length}
                </div>
                <div className="text-xs font-sans uppercase tracking-widest text-ink/50">Replied</div>
              </div>
            </div>

            {/* Messages List */}
            <div className="card">
              <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-ink/40 italic font-serif">
                    No messages found
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isExpanded = expandedContactId === contact._id
                    return (
                    <motion.div 
                      key={contact._id} 
                      layout
                      className={`border rounded-2xl transition-all duration-300 bg-white/40 cursor-pointer ${
                        isExpanded 
                          ? 'border-accent/30 shadow-soft ring-1 ring-accent/20' 
                          : 'border-ink/10 hover:shadow-soft hover:border-ink/20'
                      }`}
                      onClick={() => {
                        if (!isExpanded) {
                          setExpandedContactId(contact._id)
                          // Auto mark as read when expanding
                          if (!contact.isRead) {
                            handleMarkAsRead(contact._id, true)
                          }
                        }
                      }}
                    >
                      {/* Collapsed Header - Always visible */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                              <h4 className="text-base sm:text-lg font-serif text-ink">{contact.name}</h4>
                              <span className={`px-2 py-0.5 text-xs font-sans uppercase tracking-wide rounded-full ${getStatusColor(contact)}`}>
                                {getStatusText(contact)}
                              </span>
                              {contact.source === 'email_import' && (
                                <span className="px-2 py-0.5 text-xs font-sans uppercase tracking-wide rounded-full bg-blue-100 text-blue-700">
                                  Import
                                </span>
                              )}
                              {contact.replies && contact.replies.length > 0 && (
                                <span className="px-2 py-0.5 text-xs font-sans rounded-full bg-accent/10 text-accent flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {contact.replies.length}
                                </span>
                              )}
                              {contact.attachments && contact.attachments.length > 0 && (
                                <span className="px-2 py-0.5 text-xs font-sans rounded-full bg-ink/10 text-ink/60 flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {contact.attachments.length}
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-medium text-ink/80 mb-1 truncate">{contact.subject}</p>
                            
                            {!isExpanded && (
                              <p className="text-sm text-ink/50 line-clamp-1">{contact.message}</p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-ink/40 mt-2">
                              <span>{contact.email}</span>
                              <span>•</span>
                              <span>{formatDate(contact.createdAt)}</span>
                            </div>
                          </div>

                          {/* Quick action buttons - visible on hover/always on mobile */}
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isExpanded ? (
                              <button
                                onClick={() => setExpandedContactId(null)}
                                className="p-2 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg transition-all"
                                title="Collapse"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                {!contact.isRead && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(contact._id, true) }}
                                    className="p-2 text-ink/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-all hidden sm:block"
                                    title="Mark as read"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(contact._id) }}
                                  className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-ink/10 pt-4">
                              {/* Full Message */}
                              <div className="mb-4">
                                <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2">Message</h5>
                                <p className="text-ink/70 whitespace-pre-wrap text-sm">{contact.message}</p>
                              </div>

                              {/* Attachments */}
                              {contact.attachments && contact.attachments.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2">
                                    Attachments
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {contact.attachments.map((att, idx) => (
                                      <a
                                        key={idx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 bg-ink/5 hover:bg-ink/10 rounded-lg text-sm text-ink/70 hover:text-ink transition-colors"
                                      >
                                        {getFileIcon(att.mimeType)}
                                        <span className="truncate max-w-[100px]">{att.originalName}</span>
                                        <span className="text-xs text-ink/40">{formatFileSize(att.size)}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Previous Replies */}
                              {contact.replies && contact.replies.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2">
                                    Conversation ({contact.replies.length} replies)
                                  </h5>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {contact.replies.map((reply, idx) => (
                                      <div 
                                        key={idx}
                                        className={`p-3 rounded-lg text-sm ${
                                          reply.from === 'admin' 
                                            ? 'bg-accent/10 border-l-2 border-accent ml-4' 
                                            : 'bg-ink/5 border-l-2 border-ink/20'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1 text-xs text-ink/50">
                                          <span className="font-medium">{reply.from === 'admin' ? 'You' : contact.name}</span>
                                          <span>•</span>
                                          <span>{formatDate(reply.sentAt)}</span>
                                        </div>
                                        <p className="text-ink/70 line-clamp-3">{reply.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => fetchThread(contact._id)}
                                    className="text-xs text-accent hover:underline mt-2"
                                  >
                                    View full thread →
                                  </button>
                                </div>
                              )}

                              {/* Inline Reply Section */}
                              {contact.status !== 'closed' && (
                                <div className="mt-4 pt-4 border-t border-ink/10">
                                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2 flex items-center gap-2">
                                    <Reply className="w-3 h-3" />
                                    Quick Reply
                                  </h5>
                                  
                                  {/* Attachment preview */}
                                  {replyAttachments.length > 0 && expandedContactId === contact._id && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      {replyAttachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded text-xs">
                                          {getFileIcon(att.mimeType)}
                                          <span className="truncate max-w-[80px]">{att.originalName}</span>
                                          <button onClick={() => removeAttachment(att)} className="text-ink/40 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <textarea
                                      value={expandedContactId === contact._id ? replyMessage : ''}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                      className="input-field !text-ink resize-none text-sm flex-1"
                                      rows="2"
                                      placeholder="Type your reply..."
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.7z"
                                      />
                                      <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAttachments}
                                        className="p-2 text-ink/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-all disabled:opacity-50"
                                        title="Attach file"
                                      >
                                        {uploadingAttachments ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleReply(contact._id)}
                                        disabled={replying || !replyMessage.trim()}
                                        className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Send reply"
                                      >
                                        {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/10">
                                <div className="flex gap-2">
                                  {contact.isRead && contact.status !== 'replied' && (
                                    <button
                                      onClick={() => handleMarkAsRead(contact._id, false)}
                                      className="text-xs text-ink/50 hover:text-ink flex items-center gap-1"
                                    >
                                      <EyeOff className="w-3 h-3" />
                                      Mark unread
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => fetchThread(contact._id)}
                                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Full View
                                  </button>
                                  <button
                                    onClick={() => handleDelete(contact._id)}
                                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )})
                )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Sent Emails Filter */}
          <div className="flex gap-4 items-center">
            <select
              value={sentStatusFilter}
              onChange={(e) => setSentStatusFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">All Emails</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <div className="flex-1" />
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-green-600" />
                <span className="text-ink/60">{sentEmailStats.sent} sent</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-ink/60">{sentEmailStats.failed} failed</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-ink/60">{sentEmailStats.pending} pending</span>
              </div>
            </div>
          </div>

          {/* Sent Emails List */}
          <div className="card">
            {sentEmailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
              </div>
            ) : sentEmails.length === 0 ? (
              <div className="text-center py-12 text-ink/40 italic font-serif">
                No sent emails found
              </div>
            ) : (
              <div className="space-y-4">
                {sentEmails.map((email) => (
                  <div key={email._id} className="p-5 border border-ink/10 rounded-2xl hover:shadow-soft transition-all duration-300 bg-white/40">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1.5 rounded-lg ${getSentStatusColor(email.status)}`}>
                            {getSentStatusIcon(email.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-ink">{email.to}</span>
                              <span className={`px-2 py-0.5 text-xs font-sans uppercase tracking-wide rounded-full ${getSentStatusColor(email.status)}`}>
                                {email.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-ink/40 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(email.createdAt)}</span>
                              {email.sentAt && (
                                <>
                                  <span>•</span>
                                  <span>Delivered: {formatDate(email.sentAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-10">
                          <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Subject</h5>
                          <p className="text-ink/80 mb-2">{email.subject}</p>
                          
                          <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Message</h5>
                          <p className="text-ink/60 text-sm line-clamp-2">{email.message}</p>

                          {email.cc && (
                            <p className="text-xs text-ink/40 mt-2">CC: {email.cc}</p>
                          )}

                          {email.errorMessage && (
                            <div className="mt-3 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                              <p className="text-xs text-red-600">{email.errorMessage}</p>
                            </div>
                          )}

                          {email.messageId && (
                            <p className="text-xs text-ink/30 mt-2 font-mono">ID: {email.messageId}</p>
                          )}

                          {email.replyToContact && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-accent">
                              <Reply className="w-3 h-3" />
                              <span>Reply to: {email.replyToContact.name || email.replyToContact.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 ml-4">
                        {email.status === 'sent' && (
                          <button
                            onClick={() => handleVerifyEmail(email._id)}
                            disabled={verifying === email._id}
                            className="p-2 text-ink/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Verify delivery"
                          >
                            {verifying === email._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {email.status === 'failed' && (
                          <button
                            onClick={() => handleRetryEmail(email._id)}
                            disabled={retrying === email._id}
                            className="p-2 text-ink/40 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Retry sending"
                          >
                            {retrying === email._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSentEmail(email)}
                          className="p-2 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg transition-all duration-200"
                          title="View details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSentEmail(email._id)}
                          className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Sent Email Detail Modal */}
    {selectedSentEmail && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedSentEmail(null)
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-paper rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-strong border border-ink/5"
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-ink/5 px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getSentStatusColor(selectedSentEmail.status)}`}>
                {getSentStatusIcon(selectedSentEmail.status)}
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-ink">Sent Email Details</h3>
                <p className="text-sm text-ink/50">
                  {formatDate(selectedSentEmail.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSentEmail(null)}
              className="text-ink/40 hover:text-ink transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">To</h5>
                <p className="text-ink">{selectedSentEmail.to}</p>
              </div>
              <div>
                <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Status</h5>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-sans uppercase tracking-wide rounded-full ${getSentStatusColor(selectedSentEmail.status)}`}>
                  {getSentStatusIcon(selectedSentEmail.status)}
                  {selectedSentEmail.status}
                </span>
              </div>
              {selectedSentEmail.cc && (
                <div>
                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">CC</h5>
                  <p className="text-ink/80">{selectedSentEmail.cc}</p>
                </div>
              )}
              {selectedSentEmail.bcc && (
                <div>
                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">BCC</h5>
                  <p className="text-ink/80">{selectedSentEmail.bcc}</p>
                </div>
              )}
            </div>

            <div>
              <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Subject</h5>
              <p className="text-ink">{selectedSentEmail.subject}</p>
            </div>

            <div>
              <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Message</h5>
              <div className="p-4 bg-white/60 rounded-xl border border-ink/10">
                <p className="text-ink/80 whitespace-pre-wrap">{selectedSentEmail.message}</p>
              </div>
            </div>

            {selectedSentEmail.messageId && (
              <div>
                <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Message ID</h5>
                <p className="text-ink/60 font-mono text-sm break-all">{selectedSentEmail.messageId}</p>
              </div>
            )}

            {selectedSentEmail.errorMessage && (
              <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-xl">
                <h5 className="text-xs font-sans uppercase tracking-widest text-red-600 mb-1">Error</h5>
                <p className="text-red-700 text-sm">{selectedSentEmail.errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/10">
              <div>
                <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Created</h5>
                <p className="text-ink/60 text-sm">{formatDate(selectedSentEmail.createdAt)}</p>
              </div>
              {selectedSentEmail.sentAt && (
                <div>
                  <h5 className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-1">Sent At</h5>
                  <p className="text-ink/60 text-sm">{formatDate(selectedSentEmail.sentAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-ink/5 px-6 py-4 flex justify-end gap-2">
            {selectedSentEmail.status === 'failed' && (
              <button
                onClick={() => {
                  handleRetryEmail(selectedSentEmail._id)
                  setSelectedSentEmail(null)
                }}
                className="btn-primary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Send
              </button>
            )}
            <button
              onClick={() => setSelectedSentEmail(null)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}

      {/* Reply Modal */}
      {selectedContact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContact(null)
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-strong border border-ink/5"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-ink/5 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Reply className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-ink">Reply to Message</h3>
                  <p className="text-sm text-ink/50">
                    Your reply will be sent to {selectedContact.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedContact(null)
                  setReplyMessage('')
                }}
                className="text-ink/40 hover:text-ink transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="p-4 bg-white/60 rounded-xl border border-ink/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-ink/10 rounded-full">
                    <User className="w-4 h-4 text-ink/60" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-ink">{selectedContact.name}</span>
                      <span className="text-sm text-ink/40">•</span>
                      <span className="text-sm text-ink/50">{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink/40">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(selectedContact.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-ink/40" />
                    <span className="text-xs font-sans uppercase tracking-widest text-ink/50">Subject</span>
                  </div>
                  <p className="text-ink ml-6">{selectedContact.subject}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-ink/40" />
                    <span className="text-xs font-sans uppercase tracking-widest text-ink/50">Message</span>
                  </div>
                  <p className="text-ink/80 ml-6 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Reply Input */}
              <div>
                <label className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Your Reply
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="input-field !text-ink resize-none"
                  rows="8"
                  placeholder="Type your reply here... Your message will be sent directly to the contact's email address."
                  autoFocus
                />
                <p className="text-xs text-ink/40 mt-2">
                  {replyMessage.length} characters
                </p>
              </div>

              {/* Attachments Section */}
              <div>
                <label className="text-xs font-sans uppercase tracking-widest text-ink/50 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </label>
                
                {/* Attachment list */}
                {replyAttachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {replyAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg"
                      >
                        {getFileIcon(att.mimeType)}
                        <span className="text-sm text-ink/70 truncate max-w-[150px]">{att.originalName}</span>
                        <span className="text-xs text-ink/40">{formatFileSize(att.size)}</span>
                        <button
                          onClick={() => removeAttachment(att)}
                          className="text-ink/40 hover:text-red-500 ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.7z"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachments}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-ink/20 rounded-lg text-ink/50 hover:text-ink hover:border-ink/40 transition-all disabled:opacity-50"
                >
                  {uploadingAttachments ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add files (images, docs, audio, etc.)
                    </>
                  )}
                </button>
                <p className="text-xs text-ink/30 mt-1">Max 25MB per file</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-ink/5 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedContact(null)
                  setReplyMessage('')
                  setReplyAttachments([])
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {replyAttachments.length > 0 && (
                  <span className="text-xs text-ink/50">
                    {replyAttachments.length} attachment{replyAttachments.length > 1 ? 's' : ''}
                  </span>
                )}
                <button
                  onClick={() => handleReply(selectedContact._id)}
                  disabled={replying || !replyMessage.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
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
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Compose Email Modal */}
      {showComposeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetComposeModal()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-auto shadow-strong border border-ink/5"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-ink/5 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 bg-accent/20 rounded-lg shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-ink truncate">Compose New Email</h3>
                  <p className="text-xs sm:text-sm text-ink/50 hidden sm:block">
                    Send an email directly from your portfolio
                  </p>
                </div>
              </div>
              <button
                onClick={resetComposeModal}
                className="text-ink/40 hover:text-ink transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* To Field with Validation */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-ink/70 mb-1.5 sm:mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    className={`input-field pr-10 sm:pr-12 !text-ink text-sm sm:text-base ${
                      emailValidation.status === 'invalid' 
                        ? '!border-red-500' 
                        : emailValidation.status === 'valid' 
                        ? '!border-green-500' 
                        : emailValidation.status === 'warning'
                        ? '!border-yellow-500'
                        : ''
                    }`}
                    placeholder="recipient@example.com"
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                    {emailValidation.status === 'validating' && (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 animate-spin" />
                    )}
                    {emailValidation.status === 'valid' && (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    )}
                    {emailValidation.status === 'invalid' && (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    )}
                    {emailValidation.status === 'warning' && (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
                {emailValidation.message && (
                  <p className={`text-xs mt-1 ${
                    emailValidation.status === 'invalid' 
                      ? 'text-red-500' 
                      : emailValidation.status === 'valid' 
                      ? 'text-green-500' 
                      : 'text-yellow-500'
                  }`}>
                    {emailValidation.message}
                  </p>
                )}
              </div>

              {/* CC Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-ink/70 mb-1.5 sm:mb-2">
                  CC <span className="text-ink/40 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  className="input-field !text-ink text-sm sm:text-base"
                  placeholder="cc@example.com"
                />
              </div>

              {/* BCC Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-ink/70 mb-1.5 sm:mb-2">
                  BCC <span className="text-ink/40 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={composeData.bcc}
                  onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                  className="input-field !text-ink text-sm sm:text-base"
                  placeholder="bcc@example.com"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-ink/70 mb-1.5 sm:mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="input-field !text-ink text-sm sm:text-base"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-ink/70 mb-1.5 sm:mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  className="input-field !text-ink resize-none text-sm sm:text-base"
                  rows="6"
                  placeholder="Type your message here..."
                />
                <p className="text-xs text-ink/40 mt-1 sm:mt-2">
                  {composeData.message.length} characters
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-ink/5 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
              <button
                onClick={resetComposeModal}
                className="btn-secondary text-sm sm:text-base py-2.5 sm:py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleComposeSubmit}
                disabled={composing || !composeData.to.trim() || !composeData.subject.trim() || !composeData.message.trim() || emailValidation.status === 'invalid'}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2.5 sm:py-3"
              >
                {composing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Thread View Modal */}
      {showThreadView && threadData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowThreadView(false)
              setThreadData(null)
              setReplyMessage('')
              setReplyAttachments([])
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-strong border border-ink/5"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-ink/5 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 bg-accent/20 rounded-lg shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-ink truncate">
                    {threadData.contact.subject}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink/50">
                    {threadData.threadCount} messages with {threadData.contact.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowThreadView(false)
                  setThreadData(null)
                  setReplyMessage('')
                  setReplyAttachments([])
                }}
                className="text-ink/40 hover:text-ink transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {threadData.thread.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border ${
                    msg.from === 'admin'
                      ? 'bg-accent/5 border-accent/20 ml-8'
                      : 'bg-white/60 border-ink/10 mr-8'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-full ${
                      msg.from === 'admin' ? 'bg-accent/20' : 'bg-ink/10'
                    }`}>
                      <User className={`w-4 h-4 ${
                        msg.from === 'admin' ? 'text-accent' : 'text-ink/60'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-serif text-ink">{msg.name}</span>
                        {msg.from === 'admin' && (
                          <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">You</span>
                        )}
                        {msg.status && msg.status !== 'sent' && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            msg.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {msg.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink/40">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(msg.date)}</span>
                        <span className="text-ink/30">•</span>
                        <span>{msg.email}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-ink/80 whitespace-pre-wrap ml-11">{msg.message}</p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 ml-11">
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att, attIdx) => (
                          <a
                            key={attIdx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-ink/5 hover:bg-ink/10 rounded-lg text-sm text-ink/70 hover:text-ink transition-colors"
                          >
                            {getFileIcon(att.mimeType)}
                            <span className="truncate max-w-[100px]">{att.originalName}</span>
                            <span className="text-xs text-ink/40">{formatFileSize(att.size)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="shrink-0 border-t border-ink/10 p-4 sm:p-6 bg-white/80 backdrop-blur-md">
              {/* Attachments preview */}
              {replyAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {replyAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg text-sm"
                    >
                      {getFileIcon(att.mimeType)}
                      <span className="truncate max-w-[100px] text-ink/70">{att.originalName}</span>
                      <button
                        onClick={() => removeAttachment(att)}
                        className="text-ink/40 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="input-field !text-ink resize-none text-sm"
                    rows="3"
                    placeholder="Type your reply..."
                  />
                </div>
                <div className="flex gap-2">
                  {/* File upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.7z"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachments}
                    className="p-3 text-ink/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-all disabled:opacity-50"
                    title="Attach files"
                  >
                    {uploadingAttachments ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReply(threadData.contact._id)}
                    disabled={replying || !replyMessage.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {replying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ContactsManagement

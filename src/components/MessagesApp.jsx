import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, RefreshCw, Mail, Trash2, Calendar, User, MessageSquare, X, Send, Plus, 
  CheckCircle, AlertCircle, Loader2, History, RotateCcw, Clock, CheckCheck, XCircle, 
  Paperclip, File, FileText, Image, Music, Video, ChevronLeft, MoreVertical, Archive,
  Inbox, SendHorizontal, Settings, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'

const MessagesApp = () => {
  // Core state
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Message input
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)
  
  // Filters & search
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState('inbox') // 'inbox', 'sent', 'all'
  const [filterUnread, setFilterUnread] = useState(false)
  
  // Sync state
  const [isWatching, setIsWatching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Compose modal
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({ to: '', subject: '', message: '' })
  const [composing, setComposing] = useState(false)
  
  // Sent emails
  const [sentEmails, setSentEmails] = useState([])
  const [selectedSentEmail, setSelectedSentEmail] = useState(null)
  
  // Mobile responsive
  const [showSidebar, setShowSidebar] = useState(true)
  
  // Email config
  const [emailConfigured, setEmailConfigured] = useState(true)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
    fetchSentEmails()
    checkEmailConfig()
    checkWatchStatus()
  }, [])

  // Auto-refresh every 10 seconds when watching
  useEffect(() => {
    let interval
    if (isWatching) {
      interval = setInterval(() => {
        fetchConversations(true)
        if (selectedConversation) {
          fetchMessages(selectedConversation._id, true)
        }
      }, 10000)
    }
    return () => clearInterval(interval)
  }, [isWatching, selectedConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => messageInputRef.current?.focus(), 100)
    }
  }, [selectedConversation])

  const checkEmailConfig = async () => {
    try {
      const res = await api.get('/contact/email-config-status')
      setEmailConfigured(res.data.canSendEmail)
    } catch (e) {
      console.error('Email config check failed:', e)
    }
  }

  const checkWatchStatus = async () => {
    try {
      const res = await api.get('/contact/watch-emails/status')
      setIsWatching(res.data.watching)
    } catch (e) {
      console.error('Watch status check failed:', e)
    }
  }

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/contact')
      setConversations(res.data.contacts || [])
      
      // Update selected conversation if it exists
      if (selectedConversation) {
        const updated = res.data.contacts.find(c => c._id === selectedConversation._id)
        if (updated) {
          setSelectedConversation(updated)
        }
      }
    } catch (e) {
      if (!silent) toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (contactId, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true)
      const res = await api.get(`/contact/${contactId}/thread`)
      setMessages(res.data.thread || [])
    } catch (e) {
      if (!silent) toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchSentEmails = async (silent = false) => {
    try {
      const res = await api.get('/contact/sent')
      setSentEmails(res.data.sentEmails || [])
    } catch (e) {
      console.error('Failed to fetch sent emails:', e)
    }
  }

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation)
    setShowSidebar(false) // Hide sidebar on mobile
    setNewMessage('')
    setAttachments([])
    
    // Fetch thread
    await fetchMessages(conversation._id)
    
    // Mark as read if unread
    if (!conversation.isRead) {
      try {
        await api.put(`/contact/${conversation._id}/read`, { isRead: true })
        // Update local state
        setConversations(prev => prev.map(c => 
          c._id === conversation._id ? { ...c, isRead: true } : c
        ))
        setSelectedConversation(prev => prev ? { ...prev, isRead: true } : prev)
      } catch (e) {
        console.error('Failed to mark as read:', e)
      }
    }
  }

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    setSending(true)
    try {
      await api.put(`/contact/${selectedConversation._id}/reply`, {
        replyMessage: newMessage,
        attachments: attachments
      })
      
      // Clear input
      setNewMessage('')
      setAttachments([])
      
      // Refresh messages and conversations
      await Promise.all([
        fetchMessages(selectedConversation._id, true),
        fetchConversations(true),
        fetchSentEmails(true)
      ])
    } catch (e) {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const sendCompose = async () => {
    if (!composeData.to || !composeData.subject || !composeData.message) {
      toast.error('Please fill all fields')
      return
    }
    
    setComposing(true)
    try {
      await api.post('/contact/compose', composeData)
      setShowCompose(false)
      setComposeData({ to: '', subject: '', message: '' })
      await fetchSentEmails(true)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send email')
    } finally {
      setComposing(false)
    }
  }

  const deleteConversation = async (id, e) => {
    e?.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    
    try {
      await api.delete(`/contact/${id}`)
      setConversations(prev => prev.filter(c => c._id !== id))
      if (selectedConversation?._id === id) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  const retrySentEmail = async (id) => {
    try {
      await api.post(`/contact/sent/${id}/retry`)
      await fetchSentEmails(true)
    } catch (e) {
      toast.error('Retry failed')
    }
  }

  const deleteSentEmail = async (id) => {
    if (!confirm('Delete this sent email record?')) return
    try {
      await api.delete(`/contact/sent/${id}`)
      setSentEmails(prev => prev.filter(e => e._id !== id))
      if (selectedSentEmail?._id === id) setSelectedSentEmail(null)
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  const syncEmails = async (full = false) => {
    setSyncing(true)
    try {
      const res = await api.post('/contact/import-emails', { fullSync: full })
      const { imported } = res.data
      if (imported > 0) {
        await fetchConversations(true)
      }
    } catch (e) {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const toggleWatch = async () => {
    try {
      if (isWatching) {
        await api.post('/contact/watch-emails/stop')
        setIsWatching(false)
      } else {
        await api.post('/contact/watch-emails/start')
        setIsWatching(true)
      }
    } catch (e) {
      toast.error('Failed to toggle live sync')
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const maxSize = 25 * 1024 * 1024
    const validFiles = files.filter(f => f.size <= maxSize)
    if (validFiles.length < files.length) {
      toast.error('Some files exceeded 25MB limit')
    }
    if (!validFiles.length) return

    setUploadingAttachments(true)
    try {
      const formData = new FormData()
      validFiles.forEach(f => formData.append('files', f))
      const res = await api.post('/contact/upload-attachment', formData)
      setAttachments(prev => [...prev, ...res.data.attachments])
    } catch (e) {
      toast.error('Upload failed')
    } finally {
      setUploadingAttachments(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (att) => {
    setAttachments(prev => prev.filter(a => a.url !== att.url))
  }

  // Helper functions
  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType?.startsWith('audio/')) return <Music className="w-4 h-4" />
    if (mimeType?.startsWith('video/')) return <Video className="w-4 h-4" />
    if (mimeType?.includes('pdf') || mimeType?.includes('document')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const formatFullDate = (date) => {
    return new Date(date).toLocaleString([], { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = !searchTerm || 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnread = !filterUnread || !c.isRead
    return matchesSearch && matchesUnread
  })

  const unreadCount = conversations.filter(c => !c.isRead).length

  return (
    <div className="h-[calc(100vh-100px)] min-h-[600px] flex rounded-2xl overflow-hidden border border-ink/10 dark:border-ink-dark/10 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-sm">
      {/* Sidebar - Conversation List */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-ink/10 dark:border-ink-dark/10 bg-white/80 dark:bg-surface-dark/80`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-ink/10 dark:border-ink-dark/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-semibold text-ink dark:text-ink-dark">Messages</h2>
            <div className="flex items-center gap-1">
              {/* Live indicator */}
              {isWatching && (
                <span className="flex items-center gap-1 text-xs text-green-600 mr-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
              <button
                onClick={() => syncEmails(false)}
                disabled={syncing}
                className="p-2 text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark hover:bg-ink/5 dark:hover:bg-white/5 rounded-lg transition-all"
                title="Sync emails"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCompose(true)}
                className="p-2 text-white bg-accent dark:bg-accent-dark hover:bg-accent/90 dark:hover:bg-accent-dark/90 rounded-lg transition-all"
                title="Compose"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 dark:text-ink-dark/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-ink/5 dark:bg-white/5 border-0 rounded-lg text-sm text-ink dark:text-ink-dark focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30 focus:bg-white dark:focus:bg-surface-dark transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => { setActiveView('inbox'); setSelectedSentEmail(null) }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeView === 'inbox' ? 'bg-accent dark:bg-accent-dark text-white' : 'text-ink/60 dark:text-ink-dark/60 hover:bg-ink/5 dark:hover:bg-white/5'
              }`}
            >
              Inbox {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full">{unreadCount}</span>}
            </button>
            <button
              onClick={() => { setActiveView('sent'); setSelectedConversation(null); setMessages([]) }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeView === 'sent' ? 'bg-accent dark:bg-accent-dark text-white' : 'text-ink/60 dark:text-ink-dark/60 hover:bg-ink/5 dark:hover:bg-white/5'
              }`}
            >
              Sent
            </button>
          </div>
        </div>

        {/* Conversation/Sent List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
            </div>
          ) : activeView === 'inbox' ? (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-ink/40 dark:text-ink-dark/40">
                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b border-ink/5 dark:border-ink-dark/5 cursor-pointer transition-all hover:bg-ink/5 dark:hover:bg-white/5 ${
                    selectedConversation?._id === conv._id ? 'bg-accent/10 dark:bg-accent-dark/10 border-l-2 border-l-accent dark:border-l-accent-dark' : ''
                  } ${!conv.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      !conv.isRead ? 'bg-accent dark:bg-accent-dark text-white' : 'bg-ink/10 dark:bg-white/10 text-ink/60 dark:text-ink-dark/60'
                    }`}>
                      {conv.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${!conv.isRead ? 'font-semibold text-ink dark:text-ink-dark' : 'text-ink/80 dark:text-ink-dark/80'}`}>
                          {conv.name}
                        </span>
                        <span className="text-xs text-ink/40 dark:text-ink-dark/40 shrink-0 ml-2">{formatTime(conv.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mb-0.5 ${!conv.isRead ? 'font-medium text-ink/70 dark:text-ink-dark/70' : 'text-ink/50 dark:text-ink-dark/50'}`}>
                        {conv.subject}
                      </p>
                      <p className="text-xs text-ink/40 dark:text-ink-dark/40 truncate">{conv.message?.slice(0, 50)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.replies?.length > 0 && (
                          <span className="text-xs text-accent dark:text-accent-dark flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" /> {conv.replies.length}
                          </span>
                        )}
                        {conv.attachments?.length > 0 && (
                          <span className="text-xs text-ink/40 dark:text-ink-dark/40 flex items-center gap-0.5">
                            <Paperclip className="w-3 h-3" /> {conv.attachments.length}
                          </span>
                        )}
                        {conv.status === 'replied' && (
                          <CheckCheck className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            // Sent emails list
            sentEmails.length === 0 ? (
              <div className="p-8 text-center text-ink/40 dark:text-ink-dark/40">
                <SendHorizontal className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sent emails yet</p>
              </div>
            ) : (
              sentEmails.map(email => (
                <div
                  key={email._id}
                  onClick={() => setSelectedSentEmail(email)}
                  className={`p-4 border-b border-ink/5 cursor-pointer transition-all hover:bg-ink/5 ${
                    selectedSentEmail?._id === email._id ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                      email.status === 'sent' ? 'bg-green-100 text-green-600' :
                      email.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {email.status === 'sent' ? <CheckCheck className="w-4 h-4" /> :
                       email.status === 'failed' ? <XCircle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-ink/80 truncate">{email.to}</span>
                        <span className="text-xs text-ink/40 shrink-0 ml-2">{formatTime(email.createdAt)}</span>
                      </div>
                      <p className="text-xs text-ink/50 truncate">{email.subject}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink/50">
          <button
            onClick={toggleWatch}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${
              isWatching ? 'text-green-600 bg-green-50' : 'hover:bg-ink/5'
            }`}
          >
            {isWatching ? 'Stop Live' : 'Go Live'}
          </button>
          <button
            onClick={() => syncEmails(true)}
            disabled={syncing}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-ink/5 transition-all"
          >
            <History className="w-3 h-3" /> Full Sync
          </button>
        </div>
      </div>

      {/* Main Content - Chat View */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white/40 dark:from-surface-dark/40 to-white/20 dark:to-surface-dark/20">
        {activeView === 'inbox' && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-ink/10 dark:border-ink-dark/10 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowSidebar(true); setSelectedConversation(null) }}
                  className="md:hidden p-2 -ml-2 text-ink/60 dark:text-ink-dark/60 hover:text-ink dark:hover:text-ink-dark"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-accent/20 dark:bg-accent-dark/20 flex items-center justify-center text-accent dark:text-accent-dark font-medium">
                  {selectedConversation.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink dark:text-ink-dark truncate">{selectedConversation.name}</h3>
                  <p className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{selectedConversation.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => deleteConversation(selectedConversation._id, e)}
                    className="p-2 text-ink/40 dark:text-ink-dark/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 px-12 md:px-0">
                <p className="text-sm font-medium text-ink/70 dark:text-ink-dark/70">{selectedConversation.subject}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-ink/30 dark:text-ink-dark/30" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-ink/40 dark:text-ink-dark/40 py-8">No messages</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.from === 'admin' ? 'order-2' : ''}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.from === 'admin'
                            ? 'bg-accent dark:bg-accent-dark text-white rounded-br-md'
                            : 'bg-white dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 text-ink dark:text-ink-dark rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        
                        {/* Attachments */}
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  msg.from === 'admin' 
                                    ? 'bg-white/20 hover:bg-white/30' 
                                    : 'bg-ink/5 dark:bg-white/5 hover:bg-ink/10 dark:hover:bg-white/10'
                                }`}
                              >
                                {getFileIcon(att.mimeType)}
                                <span className="truncate max-w-[100px]">{att.originalName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-xs text-ink/40 dark:text-ink-dark/40 ${
                        msg.from === 'admin' ? 'justify-end' : ''
                      }`}>
                        <span>{formatFullDate(msg.date)}</span>
                        {msg.from === 'admin' && msg.status === 'sent' && (
                          <CheckCheck className="w-3 h-3 text-accent dark:text-accent-dark" />
                        )}
                        {msg.from === 'admin' && msg.status === 'failed' && (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-ink/10 dark:border-ink-dark/10 bg-white/80 dark:bg-surface-dark/80">
              {/* Attachment preview */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-accent/10 dark:bg-accent-dark/10 rounded text-xs text-ink dark:text-ink-dark">
                      {getFileIcon(att.mimeType)}
                      <span className="truncate max-w-[80px]">{att.originalName}</span>
                      <button onClick={() => removeAttachment(att)} className="text-ink/40 dark:text-ink-dark/40 hover:text-red-500 dark:hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachments}
                  className="p-2.5 text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark hover:bg-accent/10 dark:hover:bg-accent-dark/10 rounded-xl transition-all"
                >
                  {uploadingAttachments ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendReply()
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2.5 bg-ink/5 dark:bg-white/5 border-0 rounded-xl text-sm text-ink dark:text-ink-dark resize-none focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30 focus:bg-white dark:focus:bg-surface-dark transition-all"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendReply}
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-accent dark:bg-accent-dark text-white rounded-xl hover:bg-accent/90 dark:hover:bg-accent-dark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : activeView === 'sent' && selectedSentEmail ? (
          // Sent email detail view
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-ink/10 dark:border-ink-dark/10 bg-white/60 dark:bg-surface-dark/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowSidebar(true); setSelectedSentEmail(null) }}
                  className="md:hidden p-2 -ml-2 text-ink/60 dark:text-ink-dark/60 hover:text-ink dark:hover:text-ink-dark"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedSentEmail.status === 'sent' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  selectedSentEmail.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {selectedSentEmail.status === 'sent' ? <CheckCheck className="w-5 h-5" /> :
                   selectedSentEmail.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-ink dark:text-ink-dark">{selectedSentEmail.to}</h3>
                  <p className="text-xs text-ink/50 dark:text-ink-dark/50">{formatFullDate(selectedSentEmail.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {selectedSentEmail.status === 'failed' && (
                    <button
                      onClick={() => retrySentEmail(selectedSentEmail._id)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteSentEmail(selectedSentEmail._id)}
                    className="p-2 text-ink/40 dark:text-ink-dark/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-serif text-ink dark:text-ink-dark mb-4">{selectedSentEmail.subject}</h2>
                
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-ink/10 dark:border-ink-dark/10 p-6">
                  <p className="text-ink/80 dark:text-ink-dark/80 whitespace-pre-wrap">{selectedSentEmail.message}</p>
                </div>

                {selectedSentEmail.errorMessage && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {selectedSentEmail.errorMessage}
                    </p>
                  </div>
                )}

                {selectedSentEmail.messageId && (
                  <p className="mt-4 text-xs text-ink/40 dark:text-ink-dark/40 font-mono">
                    Message ID: {selectedSentEmail.messageId}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center text-ink/40 dark:text-ink-dark/40">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-serif">Select a conversation</p>
              <p className="text-sm mt-1">or start a new one</p>
              <button
                onClick={() => setShowCompose(true)}
                className="mt-4 px-4 py-2 bg-accent dark:bg-accent-dark text-white rounded-lg hover:bg-accent/90 dark:hover:bg-accent-dark/90 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" /> Compose
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper dark:bg-paper-dark rounded-2xl w-full max-w-lg shadow-strong dark:shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-ink/10 dark:border-ink-dark/10 flex items-center justify-between">
                <h3 className="font-serif font-semibold text-ink dark:text-ink-dark">New Message</h3>
                <button onClick={() => setShowCompose(false)} className="text-ink/40 dark:text-ink-dark/40 hover:text-ink dark:hover:text-ink-dark">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink/60 dark:text-ink-dark/60 mb-1">To</label>
                  <input
                    type="email"
                    value={composeData.to}
                    onChange={(e) => setComposeData(p => ({ ...p, to: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-ink/20 dark:border-ink-dark/20 bg-white dark:bg-surface-dark text-ink dark:text-ink-dark rounded-lg text-sm focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30 focus:border-accent dark:focus:border-accent-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/60 dark:text-ink-dark/60 mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Subject"
                    className="w-full px-3 py-2 border border-ink/20 dark:border-ink-dark/20 bg-white dark:bg-surface-dark text-ink dark:text-ink-dark rounded-lg text-sm focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30 focus:border-accent dark:focus:border-accent-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/60 dark:text-ink-dark/60 mb-1">Message</label>
                  <textarea
                    value={composeData.message}
                    onChange={(e) => setComposeData(p => ({ ...p, message: e.target.value }))}
                    placeholder="Type your message..."
                    rows={6}
                    className="w-full px-3 py-2 border border-ink/20 dark:border-ink-dark/20 bg-white dark:bg-surface-dark text-ink dark:text-ink-dark rounded-lg text-sm resize-none focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent-dark/30 focus:border-accent dark:focus:border-accent-dark"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-ink/10 dark:border-ink-dark/10 flex justify-end gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-ink/60 dark:text-ink-dark/60 hover:text-ink dark:hover:text-ink-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={sendCompose}
                  disabled={composing || !composeData.to || !composeData.subject || !composeData.message}
                  className="px-4 py-2 bg-accent dark:bg-accent-dark text-white rounded-lg hover:bg-accent/90 dark:hover:bg-accent-dark/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {composing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email not configured warning */}
      {!emailConfigured && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium">Email not configured</p>
          <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-400">Set EMAIL_USER and EMAIL_PASS in backend .env</p>
        </div>
      )}
    </div>
  )
}

export default MessagesApp

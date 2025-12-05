import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, Calendar, MapPin, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const ExperienceManagement = () => {
  const [experience, setExperience] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '', // role/title
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    startLabel: '',
    endLabel: '',
    startPrecision: 'date', // 'year' | 'month' | 'date'
    endPrecision: 'date',
    isCurrent: false,
    description: '',
    skills: [],
    isActive: true,
    order: 0
  })
  const [skillsText, setSkillsText] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    fetchExperience()
  }, [])

  const fetchExperience = async () => {
    try {
      setLoading(true)
      // Use admin endpoint to fetch all experiences (including inactive) so admin can hide/unhide
      const response = await api.get('/experience/admin/all')
      setExperience(response.data.experience)
    } catch (error) {
      console.error('Fetch experience error:', error)
      toast.error('Failed to fetch experience')
    } finally {
      setLoading(false)
    }
  }

  const normalizeDates = (src) => {
    const payload = { ...src }
    const toMonthLabel = (ym) => {
      const [y, m] = ym.split('-')
      const d = new Date(parseInt(y), parseInt(m) - 1, 1)
      return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    }

    if (src.startPrecision === 'year' && src.startDate) {
      const y = String(src.startDate).slice(0, 4)
      payload.startDate = `${y}-01-01`
      payload.startLabel = y
    } else if (src.startPrecision === 'month' && src.startDate) {
      const ym = String(src.startDate).slice(0, 7)
      payload.startDate = `${ym}-01`
      payload.startLabel = toMonthLabel(ym)
    } else if (src.startPrecision === 'date') {
      payload.startLabel = ''
    }

    if (src.endPrecision === 'year' && src.endDate) {
      const y = String(src.endDate).slice(0, 4)
      payload.endDate = `${y}-01-01`
      payload.endLabel = y
    } else if (src.endPrecision === 'month' && src.endDate) {
      const ym = String(src.endDate).slice(0, 7)
      payload.endDate = `${ym}-01`
      payload.endLabel = toMonthLabel(ym)
    } else if (src.endPrecision === 'date') {
      payload.endLabel = ''
    }

    if (!src.endDate) payload.endLabel = ''

    // Remove empty date fields to bypass validators
    if (!payload.startDate) delete payload.startDate
    if (!payload.endDate) delete payload.endDate

    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = normalizeDates({ ...formData })
      // skills parse
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (skills.length > 0) payload.skills = skills

      if (editingExp) {
        await api.put(`/experience/${editingExp._id}`, payload)
        toast.success('Experience updated successfully')
      } else {
        await api.post('/experience', payload)
        toast.success('Experience created successfully')
      }

      setIsCreating(false)
      setEditingExp(null)
      resetForm()
      fetchExperience()
    } catch (error) {
      console.error('Save experience error:', error)
      toast.error(error.response?.data?.message || 'Failed to save experience')
    }
  }

  const handleEdit = (exp) => {
    setEditingExp(exp)
    setFormData({
      title: exp.title || exp.role || '',
      company: exp.company || exp.organization || '',
      location: exp.location || '',
      startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
      endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
      startLabel: exp.startLabel || '',
      endLabel: exp.endLabel || '',
      startPrecision: exp.startLabel ? (/^\d{4}$/.test(exp.startLabel) ? 'year' : (/^[A-Za-z]{3} \d{4}$/.test(exp.startLabel) ? 'month' : 'date')) : 'date',
      endPrecision: exp.endLabel ? (/^\d{4}$/.test(exp.endLabel) ? 'year' : (/^[A-Za-z]{3} \d{4}$/.test(exp.endLabel) ? 'month' : 'date')) : 'date',
      isCurrent: !!exp.isCurrent,
      description: exp.description || '',
      skills: Array.isArray(exp.skills) ? exp.skills : [],
      isActive: exp.isActive !== false,
      order: exp.order || 0
    })
    setSkillsText(Array.isArray(exp.skills) ? exp.skills.join(', ') : '')
    setIsCreating(true)
  }

  const handleDelete = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return
    try {
      await api.delete(`/experience/${expId}`)
      toast.success('Experience deleted successfully')
      fetchExperience()
    } catch (error) {
      console.error('Delete experience error:', error)
      toast.error('Failed to delete experience')
    }
  }

  const handleToggleVisibility = async (exp) => {
    try {
      const newStatus = !exp.isActive
      await api.put(`/experience/${exp._id}`, { isActive: newStatus })
      toast.success(newStatus ? 'Experience is now visible' : 'Experience is now hidden')
      fetchExperience()
    } catch (error) {
      console.error('Toggle visibility error:', error)
      toast.error('Failed to update visibility')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      startLabel: '',
      endLabel: '',
      startPrecision: 'date',
      endPrecision: 'date',
      isCurrent: false,
      description: '',
      skills: [],
      isActive: true,
      order: 0
    })
    setSkillsText('')
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingExp(null)
    resetForm()
  }

  const filteredExperience = experience.filter((exp) => {
    const hay = `${exp.title || ''} ${exp.role || ''} ${exp.company || ''} ${exp.organization || ''}`.toLowerCase()
    return !searchTerm || hay.includes(searchTerm.toLowerCase())
  })

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Experience Management</h2>
        <div className="flex gap-4">
          <button onClick={fetchExperience} className="btn-secondary flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Experience
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingExp ? 'Edit Experience' : 'Create New Experience'}</h3>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role / Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" required placeholder="e.g., Senior Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
                <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="input-field" required placeholder="e.g., Acme Corp" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" placeholder="City, Country (optional)" />
            </div>

            {/* Dates with precision selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start</label>
                <div className="flex gap-2">
                  <select value={formData.startPrecision} onChange={(e) => setFormData({ ...formData, startPrecision: e.target.value })} className="input-field w-28">
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="date">Date</option>
                  </select>
                  {formData.startPrecision === 'year' && (
                    <input type="number" placeholder="YYYY" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" min="1900" max="2100" />
                  )}
                  {formData.startPrecision === 'month' && (
                    <input type="month" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" />
                  )}
                  {formData.startPrecision === 'date' && (
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
                <div className="flex gap-2">
                  <select value={formData.endPrecision} onChange={(e) => setFormData({ ...formData, endPrecision: e.target.value })} className="input-field w-28">
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="date">Date</option>
                  </select>
                  {formData.endPrecision === 'year' && (
                    <input type="number" placeholder="YYYY" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" min="1900" max="2100" />
                  )}
                  {formData.endPrecision === 'month' && (
                    <input type="month" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" />
                  )}
                  {formData.endPrecision === 'date' && (
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" />
                  )}
                </div>
                <div className="mt-2 flex items-center">
                  <input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="mr-2" />
                  <label className="text-sm text-gray-700 dark:text-gray-300">Currently working here</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows="3" placeholder="What did you build/own/achieve?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
              <input type="text" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="input-field" placeholder="React, Node.js, AWS" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="mr-2" />
                <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="input-field" min="0" />
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* Experience List */}
      <div className="card">
        <div className="space-y-4">
          {filteredExperience.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No experience records found</div>
          ) : (
            filteredExperience
              .sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.startDate || 0) - new Date(a.startDate || 0))
              .map((exp) => {
                return (
                  <div key={exp._id} className={`p-6 border rounded-lg hover:shadow-md transition-shadow ${exp.isActive === false ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{exp.title || exp.role}</h4>
                          <span className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800">{exp.company || exp.organization}</span>
                          {exp.isActive === false && (
                            <span className="px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Hidden</span>
                          )}
                        </div>
                        {exp.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"><MapPin className="w-4 h-4" /><span>{exp.location}</span></div>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {(exp.startLabel || exp.startDate) && (
                            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Start: {exp.startLabel || (exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '')}</span></div>
                          )}
                          {(exp.endLabel || exp.endDate || exp.isCurrent) && (
                            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>End: {exp.isCurrent ? 'Present' : (exp.endLabel || (exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''))}</span></div>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{exp.description}</p>
                        )}
                        {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {exp.skills.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-primary-700 dark:text-primary-300">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleToggleVisibility(exp)} className={`p-2 transition-colors ${exp.isActive === false ? 'text-gray-400 hover:text-green-600 dark:hover:text-green-400' : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'}`} title={exp.isActive === false ? 'Show experience' : 'Hide experience'}>
                          {exp.isActive === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(exp)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="Edit experience">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(exp._id)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete experience">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {isCreating && (
        <StickyActionBar show={isCreating} onCancel={cancelEdit} onSave={() => formRef.current?.requestSubmit()} />
      )}
    </div>
  )
}

export default ExperienceManagement

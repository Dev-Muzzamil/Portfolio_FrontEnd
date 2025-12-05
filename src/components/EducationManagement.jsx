import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, GraduationCap, Calendar, MapPin, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const EducationManagement = () => {
  const [education, setEducation] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingEdu, setEditingEdu] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDegree, setSelectedDegree] = useState('all')
  const [formData, setFormData] = useState({
    institution: '',
    institutionId: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    startLabel: '',
    endLabel: '',
    startPrecision: 'date', // 'year' | 'month' | 'date'
    endPrecision: 'date',
    gpa: '',
    description: '',
    isActive: true,
    order: 0
  })
  const formRef = useRef(null)

  const degreeOptions = [
    'all',
    'Ph.D',
    'Master',
    'M.Tech',
    'Bachelor',
    'B.Tech',
    'Diploma',
    'High School',
    'SSC',
    '12th',
    '10th'
  ]

  useEffect(() => {
    fetchEducation()
    fetchInstitutes()
  }, [])

  const fetchEducation = async () => {
    try {
      setLoading(true)
      const response = await api.get('/education')
      setEducation(response.data.education)
    } catch (error) {
      console.error('Fetch education error:', error)
      toast.error('Failed to fetch education')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutes = async () => {
    try {
      const response = await api.get('/institutes')
      setInstitutes(response.data)
    } catch (error) {
      console.error('Fetch institutes error:', error)
      // Don't show error for institutes as it's optional
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Normalize dates based on selected precision
      const payload = { ...formData }
      const toMonthLabel = (ym) => {
        const [y, m] = ym.split('-')
        const d = new Date(parseInt(y), parseInt(m) - 1, 1)
        return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      }

      if (formData.startPrecision === 'year' && formData.startDate) {
        const y = String(formData.startDate).slice(0, 4)
        payload.startDate = `${y}-01-01`
        payload.startLabel = y
      } else if (formData.startPrecision === 'month' && formData.startDate) {
        const ym = String(formData.startDate).slice(0, 7)
        payload.startDate = `${ym}-01`
        payload.startLabel = toMonthLabel(ym)
      } else if (formData.startPrecision === 'date') {
        payload.startLabel = ''
      }

      if (formData.endPrecision === 'year' && formData.endDate) {
        const y = String(formData.endDate).slice(0, 4)
        payload.endDate = `${y}-01-01`
        payload.endLabel = y
      } else if (formData.endPrecision === 'month' && formData.endDate) {
        const ym = String(formData.endDate).slice(0, 7)
        payload.endDate = `${ym}-01`
        payload.endLabel = toMonthLabel(ym)
      } else if (formData.endPrecision === 'date') {
        payload.endLabel = ''
      }

      if (!formData.endDate) payload.endLabel = ''

      // Remove empty dates so backend optional ISO validator doesn't run on empty strings
      if (!payload.startDate) delete payload.startDate
      if (!payload.endDate) delete payload.endDate

      // If an instituteId was selected, prefer storing the canonical name and id
      if (formData.institutionId) {
        const inst = institutes.find(i => i._id === formData.institutionId)
        if (inst) {
          payload.institution = inst.name
          payload.institutionId = inst._id
        }
      }

      if (editingEdu) {
        await api.put(`/education/${editingEdu._id}`, payload)
        toast.success('Education updated successfully')
      } else {
        await api.post('/education', payload)
        toast.success('Education created successfully')
      }

      setIsCreating(false)
      setEditingEdu(null)
      resetForm()
      fetchEducation()
    } catch (error) {
      console.error('Save education error:', error)
      toast.error(error.response?.data?.message || 'Failed to save education')
    }
  }

  const handleEdit = (edu) => {
    setEditingEdu(edu)
    setFormData({
      institution: edu.institution,
      institutionId: edu.institutionId || '',
      degree: edu.degree,
      field: edu.field || '',
      startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
      endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '',
      startLabel: edu.startLabel || '',
      endLabel: edu.endLabel || '',
      startPrecision: edu.startLabel ? (/^\d{4}$/.test(edu.startLabel) ? 'year' : (/^[A-Za-z]{3} \d{4}$/.test(edu.startLabel) ? 'month' : 'date')) : 'date',
      endPrecision: edu.endLabel ? (/^\d{4}$/.test(edu.endLabel) ? 'year' : (/^[A-Za-z]{3} \d{4}$/.test(edu.endLabel) ? 'month' : 'date')) : 'date',
      gpa: edu.gpa || '',
      description: edu.description || '',
      isActive: edu.isActive !== false,
      order: edu.order || 0
    })
    setIsCreating(true)
  }

  const handleDelete = async (eduId) => {
    if (!window.confirm('Are you sure you want to delete this education record?')) {
      return
    }

    try {
      await api.delete(`/education/${eduId}`)
      toast.success('Education deleted successfully')
      fetchEducation()
    } catch (error) {
      console.error('Delete education error:', error)
      toast.error('Failed to delete education')
    }
  }

  const resetForm = () => {
    setFormData({
      institution: '',
      institutionId: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      startLabel: '',
      endLabel: '',
      startPrecision: 'date',
      endPrecision: 'date',
      gpa: '',
      description: '',
      isActive: true,
      order: 0
    })
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingEdu(null)
    resetForm()
  }

  const filteredEducation = education.filter(edu => {
    const matchesSearch = !searchTerm ||
      edu.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edu.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edu.field?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDegree = selectedDegree === 'all' || edu.degree === selectedDegree

    return matchesSearch && matchesDegree
  })

  const getDegreeColor = (degree) => {
    switch (degree) {
      case 'Ph.D': return 'bg-purple-100 text-purple-800'
      case 'Master':
      case 'M.Tech': return 'bg-blue-100 text-blue-800'
      case 'Bachelor':
      case 'B.Tech': return 'bg-green-100 text-green-800'
      case 'Diploma': return 'bg-orange-100 text-orange-800'
      case 'High School':
      case 'SSC':
      case '12th':
      case '10th': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInstituteInfo = (institutionName) => {
    // If education stores an institutionId, prefer lookup by id
    if (!institutionName) return null
    const byId = institutes.find(inst => inst._id === institutionName)
    if (byId) return byId
    return institutes.find(inst => 
      (inst.name || '').toLowerCase().includes(String(institutionName).toLowerCase()) ||
      String(institutionName).toLowerCase().includes((inst.name || '').toLowerCase())
    )
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Education Management</h2>
        <div className="flex gap-4">
          <button
            onClick={fetchEducation}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Education
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
              placeholder="Search education..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={selectedDegree}
          onChange={(e) => setSelectedDegree(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Degrees</option>
          {degreeOptions.filter(degree => degree !== 'all').map(degree => (
            <option key={degree} value={degree}>{degree}</option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingEdu ? 'Edit Education' : 'Create New Education'}
          </h3>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Institution *
                </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.institutionId || ''}
                      onChange={(e) => {
                        const id = e.target.value
                        const inst = institutes.find(i => i._id === id)
                        setFormData(prev => ({ ...prev, institutionId: id, institution: inst ? inst.name : prev.institution }))
                      }}
                      className="input-field"
                    >
                      <option value="">Select existing institute</option>
                      {institutes.map(inst => (
                        <option key={inst._id} value={inst._id}>{inst.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value, institutionId: '' })}
                      className="input-field"
                      required
                      placeholder="Or type institute name"
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Degree *
                </label>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Degree</option>
                  {degreeOptions.filter(degree => degree !== 'all').map(degree => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="input-field"
                placeholder="e.g., Computer Science, Engineering"
              />
            </div>

            {/* Dates with precision selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.startPrecision}
                    onChange={(e) => setFormData({ ...formData, startPrecision: e.target.value })}
                    className="input-field w-28"
                  >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="date">Date</option>
                  </select>
                  {formData.startPrecision === 'year' && (
                    <input
                      type="number"
                      placeholder="YYYY"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                      min="1900"
                      max="2100"
                    />
                  )}
                  {formData.startPrecision === 'month' && (
                    <input
                      type="month"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                    />
                  )}
                  {formData.startPrecision === 'date' && (
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.endPrecision}
                    onChange={(e) => setFormData({ ...formData, endPrecision: e.target.value })}
                    className="input-field w-28"
                  >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="date">Date</option>
                  </select>
                  {formData.endPrecision === 'year' && (
                    <input
                      type="number"
                      placeholder="YYYY"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                      min="1900"
                      max="2100"
                    />
                  )}
                  {formData.endPrecision === 'month' && (
                    <input
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                    />
                  )}
                  {formData.endPrecision === 'date' && (
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GPA/Percentage
              </label>
              <input
                type="text"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                className="input-field"
                placeholder="e.g., 3.8/4.0 or 85%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Additional details about your education..."
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            {/* Inline actions removed; use sticky action bar to save/cancel */}
          </form>
        </motion.div>
      )}

      {/* Education List */}
      <div className="card">
        <div className="space-y-4">
          {filteredEducation.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No education records found
            </div>
          ) : (
            filteredEducation
              .sort((a, b) => {
                // Sort by degree level first, then by order
                const degreeOrder = {
                  'Ph.D': 1,
                  'Master': 2,
                  'M.Tech': 2,
                  'Bachelor': 3,
                  'B.Tech': 3,
                  'Diploma': 4,
                  'High School': 5,
                  'SSC': 5,
                  '12th': 5,
                  '10th': 6
                }
                const aOrder = degreeOrder[a.degree] || 7
                const bOrder = degreeOrder[b.degree] || 7
                
                if (aOrder !== bOrder) return aOrder - bOrder
                return (a.order || 0) - (b.order || 0)
              })
              .map((edu) => {
                const instituteInfo = getInstituteInfo(edu.institution)
                return (
                  <div key={edu._id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{edu.institution}</h4>
                          <span className={`px-2 py-1 text-xs rounded-md ${getDegreeColor(edu.degree)}`}>
                            {edu.degree}
                          </span>
                        </div>

                        {edu.field && (
                          <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                            {edu.field}
                          </p>
                        )}

                        {edu.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {edu.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {(edu.startLabel || edu.startDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Started: {edu.startLabel || (edu.startDate ? new Date(edu.startDate).toLocaleDateString() : '')}
                              </span>
                            </div>
                          )}

                          {(edu.endLabel || edu.endDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Completed: {edu.endLabel || (edu.endDate ? new Date(edu.endDate).toLocaleDateString() : '')}
                              </span>
                            </div>
                          )}

                          {edu.gpa && (
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span>GPA: {edu.gpa}</span>
                            </div>
                          )}

                          {instituteInfo && instituteInfo.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {[
                                  instituteInfo.location.city,
                                  instituteInfo.location.state,
                                  instituteInfo.location.country
                                ].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(edu)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Edit education"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(edu._id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete education"
                        >
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
        <StickyActionBar
          show={isCreating}
          onCancel={cancelEdit}
          onSave={() => formRef.current?.requestSubmit()}
        />
      )}
    </div>
  )
}

export default EducationManagement

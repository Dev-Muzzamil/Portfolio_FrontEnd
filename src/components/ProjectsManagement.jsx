import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, ExternalLink, Github, Eye, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const ProjectsManagement = () => {
  const [projects, setProjects] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [educationList, setEducationList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    technologies: [],
    githubUrls: [],
    liveUrls: [],
    screenshots: [],
    featured: false,
    subcategories: [],
    academicScale: '',
    tags: [],
    startDate: '',
    startPrecision: 'date',
    endDate: '',
    endPrecision: 'date',
    isCurrent: false,
    isActive: true,
    order: 0
  })
  const formRef = useRef(null)
  const uploadInputRef = useRef(null)
  const [categoryOptions, setCategoryOptions] = useState(['academic','personal','work'])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [refreshing, setRefreshing] = useState({})

  const subcategoryOptions = ['web', 'mobile', 'ai-ml-dl', 'cloud', 'desktop', 'other']
  const academicTypes = ['University', 'College', 'Institute', 'School']
  const [showAddInstitute, setShowAddInstitute] = useState(false)
  const [newInstitute, setNewInstitute] = useState({ name: '', type: 'College', location: { city: '' }, website: '' })

  useEffect(() => {
    fetchProjects()
    fetchInstitutes()
    fetchEducation()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      const serverCats = (res.data?.categories || []).map(c => c.slug || c).filter(Boolean)
      // ensure core defaults
      const merged = Array.from(new Set([...(serverCats || []), 'academic', 'personal', 'work']))
      setCategoryOptions(merged)
    } catch (err) {
      console.warn('Failed to fetch categories', err)
    }
  }

  const fetchEducation = async () => {
    try {
      const res = await api.get('/education')
      setEducationList(res.data.education || [])
    } catch (err) {
      console.warn('Failed to fetch education', err)
    }
  }

  const fetchInstitutes = async () => {
    try {
      const res = await api.get('/institutes')
      setInstitutes(res.data || [])
    } catch (err) {
      console.warn('Failed to fetch institutes', err)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/projects')
      setProjects(response.data.projects)
    } catch (error) {
      console.error('Fetch projects error:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const projectData = {
        ...formData,
        technologies: formData.technologies.filter(tech => tech.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '')
      }

      // Normalize date fields based on precision
      const prepareDateField = (val, precision) => {
        if (!val) return { date: undefined, label: undefined, precision: undefined }
        try {
          if (precision === 'date') {
            // expect YYYY-MM-DD
            return { date: val, label: undefined, precision: 'date' }
          }
          if (precision === 'month') {
            // val expected as YYYY-MM
            const iso = String(val).length === 7 ? `${val}-01` : `${val}-01`
            const d = new Date(iso)
            const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
            return { date: iso, label, precision: 'month' }
          }
          if (precision === 'year') {
            const y = String(val).slice(0, 4)
            const iso = `${y}-01-01`
            return { date: iso, label: y, precision: 'year' }
          }
        } catch (_) {}
        return { date: val, label: undefined, precision }
      }

      const startPrepared = prepareDateField(projectData.startDate, projectData.startPrecision)
      const endPrepared = prepareDateField(projectData.endDate, projectData.endPrecision)
      if (startPrepared.date) projectData.startDate = startPrepared.date
      if (startPrepared.label) projectData.startLabel = startPrepared.label
      if (startPrepared.precision) projectData.startPrecision = startPrepared.precision
      if (endPrepared.date) projectData.endDate = endPrepared.date
      if (endPrepared.label) projectData.endLabel = endPrepared.label
      if (endPrepared.precision) projectData.endPrecision = endPrepared.precision
      // Remove end dates if project is ongoing
      if (projectData.isCurrent) {
        delete projectData.endDate
        delete projectData.endLabel
        delete projectData.endPrecision
      }

      // normalize URL arrays
      projectData.githubUrls = (projectData.githubUrls || []).map(u => String(u || '').trim()).filter(Boolean)
      projectData.liveUrls = (projectData.liveUrls || []).map(u => String(u || '').trim()).filter(Boolean)

      // keep legacy single fields for backward compatibility (first item)
      if (projectData.githubUrls && projectData.githubUrls.length) projectData.githubUrl = projectData.githubUrls[0]
      if (projectData.liveUrls && projectData.liveUrls.length) projectData.liveUrl = projectData.liveUrls[0]

      // Normalize linkedInstitutes: prefer institute _id when available, else keep string
      if (projectData.linkedInstitutes && projectData.linkedInstitutes.length) {
        const normalizeLinked = (vals) => {
          return vals.map(v => {
            // if value is an id present in institutes, keep it
            const byId = institutes.find(i => i._id === v)
            if (byId) return byId._id
            // if value matches institute name, return its id
            const byName = institutes.find(i => (i.name || '').toLowerCase().trim() === String(v).toLowerCase().trim())
            if (byName) return byName._id
            // otherwise keep value (may be education-derived name)
            return v
          })
        }
        projectData.linkedInstitutes = normalizeLinked(projectData.linkedInstitutes)
      }

      if (editingProject) {
        // Avoid sending empty technologies array on update (backend validation requires at least one if present)
        const updatePayload = { ...projectData }
        if (!updatePayload.technologies || (Array.isArray(updatePayload.technologies) && updatePayload.technologies.length === 0)) {
          delete updatePayload.technologies
        }
        if ((updatePayload.category || editingProject.category) !== 'academic') {
          delete updatePayload.academicScale
        } else if (!updatePayload.academicScale) {
          delete updatePayload.academicScale
        }
        // Track category change and adjust filter if it would hide the item
        const norm = (v) => String(v || 'personal').toLowerCase().trim()
        const oldCat = norm(editingProject.category)
        const newCat = norm(updatePayload.category || editingProject.category)

        // Ensure isCurrent updates clear end dates when set
        if (updatePayload.isCurrent) {
          delete updatePayload.endDate
          delete updatePayload.endLabel
          delete updatePayload.endPrecision
        }
        await api.put(`/projects/${editingProject._id}`, updatePayload)
        toast.success('Project updated successfully')
        if (selectedCategory !== 'all' && selectedCategory === oldCat && newCat !== oldCat) {
          setSelectedCategory('all')
          toast('Category changed to ' + newCat + ' — showing All so you can see it.')
        }
      } else {
        // include subcategories and linkedInstitutes in payload if present
        const payload = { ...projectData }
        if (formData.subcategories && formData.subcategories.length) payload.subcategories = formData.subcategories
        if (formData.linkedInstitutes && formData.linkedInstitutes.length) payload.linkedInstitutes = formData.linkedInstitutes
        if ((payload.category || 'personal') !== 'academic') {
          delete payload.academicScale
        } else if (!payload.academicScale) {
          delete payload.academicScale
        }
        await api.post('/projects', payload)
        toast.success('Project created successfully')
      }

      setIsCreating(false)
      setEditingProject(null)
      resetForm()
      fetchProjects()
    } catch (error) {
      console.error('Save project error:', error)
      const apiErr = error.response?.data
      if (apiErr?.errors && Array.isArray(apiErr.errors)) {
        apiErr.errors.forEach(err => toast.error(err.msg || err.message || JSON.stringify(err)))
      } else {
        toast.error(apiErr?.message || 'Failed to save project')
      }
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description,
      longDescription: project.longDescription || '',
      technologies: project.technologies || [],
      githubUrls: project.githubUrls || (project.githubUrl ? [project.githubUrl] : []),
      liveUrls: project.liveUrls || (project.liveUrl ? [project.liveUrl] : []),
      screenshots: project.screenshots || [],
      featured: project.featured || false,
        category: project.category || 'personal',
        subcategories: project.subcategories || [],
        academicScale: project.academicScale || '',
        linkedInstitutes: project.linkedInstitutes || [],
      tags: project.tags || [],
      // respect precision if present and keep value format compatible with input type
      startDate: project.startPrecision === 'month' && project.startDate ? String(project.startDate).slice(0,7)
        : project.startPrecision === 'year' && project.startDate ? String(project.startDate).slice(0,4)
        : project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      startPrecision: project.startPrecision || 'date',
      endDate: project.endPrecision === 'month' && project.endDate ? String(project.endDate).slice(0,7)
        : project.endPrecision === 'year' && project.endDate ? String(project.endDate).slice(0,4)
        : project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      endPrecision: project.endPrecision || 'date',
      isCurrent: project.isCurrent || false,
      isActive: project.isActive !== false,
      order: project.order || 0
    })
    setIsCreating(true)
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await api.delete(`/projects/${projectId}`)
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Delete project error:', error)
      toast.error('Failed to delete project')
    }
  }

  const refreshProject = async (projectId, onlyChanged = false) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please log in to refresh screenshots')
      // Redirect to admin login
      try { window.location.href = '/admin' } catch {}
      return
    }
    setRefreshing(prev => ({ ...prev, [projectId]: true }))
    try {
      // Use admin route explicitly
      const url = `/admin/projects/${projectId}/refresh-screenshot${onlyChanged ? '?onlyChanged=true' : ''}`
      const res = await api.post(url)
      toast.success(res?.data?.message || 'Screenshot refreshed')
      await fetchProjects()
    } catch (error) {
      console.error('Refresh screenshot error:', error)
      toast.error(error?.response?.data?.message || 'Failed to refresh screenshot')
    } finally {
      setRefreshing(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      longDescription: '',
      technologies: [],
      githubUrls: [],
      liveUrls: [],
      screenshots: [],
      featured: false,
      subcategories: [],
      linkedInstitutes: [],
      tags: [],
      startDate: '',
      startPrecision: 'date',
      endDate: '',
      endPrecision: 'date',
    isCurrent: false,
      isActive: true,
      order: 0
    })
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingProject(null)
    resetForm()
  }

  const addArrayItem = (field, value = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }))
  }

  const normalizeDateOnPrecisionChange = (which, newPrecision) => {
    setFormData(prev => {
      const curVal = prev[which] || ''
      let newVal = curVal
      try {
        if (newPrecision === 'month') {
          // YYYY-MM expected
          if (String(curVal).length >= 7) newVal = String(curVal).slice(0, 7)
          else if (String(curVal).length === 4) newVal = `${String(curVal)}-01`
        } else if (newPrecision === 'year') {
          // year only
          if (String(curVal).length >= 4) newVal = String(curVal).slice(0, 4)
        } else if (newPrecision === 'date') {
          // expand month/year to a full date if possible
          if (/^\d{4}-\d{2}$/.test(String(curVal))) {
            newVal = `${String(curVal)}-01`
          } else if (/^\d{4}$/.test(String(curVal))) {
            newVal = `${String(curVal)}-01-01`
          }
        }
      } catch (_) {}
      const precisionField = which === 'startDate' ? 'startPrecision' : 'endPrecision'
      return { ...prev, [which]: newVal, [precisionField]: newPrecision }
    })
  }

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const cur = Array.isArray(prev[field]) ? [...prev[field]] : []
      const exists = cur.map(String).includes(String(value))
      if (exists) return { ...prev, [field]: cur.filter(v => String(v) !== String(value)) }
      return { ...prev, [field]: [...cur, value] }
    })
  }

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))

    const normalizeCategory = (value) => String(value || 'personal').toLowerCase().trim()
    const matchesCategory = selectedCategory === 'all' || normalizeCategory(project.category) === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category) => {
    switch (String(category).toLowerCase()) {
      case 'academic': return 'bg-indigo-100 text-indigo-800'
      case 'personal': return 'bg-teal-100 text-teal-800'
      case 'work': return 'bg-amber-100 text-amber-800'
      // keep some legacy colors as fallback
      case 'web': return 'bg-blue-100 text-blue-800'
      case 'mobile': return 'bg-green-100 text-green-800'
      case 'ai-ml-dl': return 'bg-purple-100 text-purple-800'
      case 'desktop': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Management</h2>
        <div className="flex gap-4">
          <button
            onClick={fetchProjects}
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
            Add Project
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
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Categories</option>
          {categoryOptions.map(category => (
            <option key={category} value={category}>
              {category === 'ai-ml-dl' ? 'AI/ML/DL' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
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
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.category || 'personal'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field flex-1"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Add new category"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const name = newCategoryName.trim()
                      if (!name) { toast.error('Enter a category name'); return }
                      try {
                        const res = await api.post('/categories', { name })
                        toast.success('Category added')
                        setNewCategoryName('')
                        await fetchCategories()
                        const slug = (res.data?.category?.slug) || name.toLowerCase()
                        setFormData(prev => ({ ...prev, category: slug }))
                      } catch (err) {
                        console.error('Add category error', err)
                        toast.error(err?.response?.data?.message || 'Failed to add category')
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              {formData.category === 'academic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Scale</label>
                  <select
                    value={formData.academicScale}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicScale: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select scale</option>
                    <option value="mini">Mini Project</option>
                    <option value="major">Major Project</option>
                  </select>
                </div>
              )}
              {/* Subcategories (checkbox grid) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategories</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subcategoryOptions.map(opt => (
                      <label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer text-sm bg-white/60 dark:bg-gray-800/60">
                        <input
                          type="checkbox"
                          checked={(formData.subcategories || []).map(String).includes(String(opt))}
                          onChange={() => toggleSelection('subcategories', opt)}
                          className="w-4 h-4"
                        />
                        <span>{opt === 'ai-ml-dl' ? 'AI/ML/DL' : opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* Linked Institutes (checkbox list + chips) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Linked Institutes</label>
                <div className="mb-2">
                  <div className="flex flex-wrap gap-2">
                    {(formData.linkedInstitutes || []).map((li) => {
                      const inst = institutes.find(i => i._id === li) || institutes.find(i => (i.name || '').toLowerCase().trim() === String(li).toLowerCase().trim())
                      const label = inst ? inst.name : li
                      return (
                        <span key={String(li)} className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">
                          <span>{label}</span>
                          <button type="button" onClick={() => toggleSelection('linkedInstitutes', li)} className="text-xs text-red-600">✕</button>
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="h-44 overflow-auto border border-gray-200 dark:border-gray-700 rounded p-2 bg-white/60 dark:bg-gray-800/60">
                  {institutes
                    .filter(i => academicTypes.includes(i.type))
                    .map(inst => (
                      <label key={`inst-${inst._id}`} className={`flex items-center justify-between p-1 ${inst.isActive === false ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(formData.linkedInstitutes || []).map(String).includes(String(inst._id))}
                            onChange={() => toggleSelection('linkedInstitutes', inst._id)}
                            disabled={inst.isActive === false}
                          />
                          <span className="text-sm">{inst.name}{inst.location?.city ? ` · ${inst.location.city}` : ''}{inst.isActive === false ? ' (hidden)' : ''}</span>
                        </div>
                      </label>
                    ))}

                  {/* Add institutes derived from education entries (unique by name) */}
                  {Array.from(new Set((educationList || []).map(e => e.institution).filter(Boolean))).map(name => {
                    if (institutes.some(i => (i.name || '').toLowerCase().trim() === name.toLowerCase().trim())) return null
                    const val = name
                    return (
                      <label key={`edu-${name}`} className="flex items-center p-1">
                        <input
                          type="checkbox"
                          checked={(formData.linkedInstitutes || []).map(String).includes(String(val))}
                          onChange={() => toggleSelection('linkedInstitutes', val)}
                        />
                        <span className="ml-2 text-sm">{name} <span className="text-xs text-gray-500">(from education)</span></span>
                      </label>
                    )
                  })}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInstitute(true)}
                    className="btn-secondary h-9"
                    title="Add new institute"
                  >
                    + Add Institute
                  </button>
                  <p className="text-xs text-gray-500">Select academic institute(s). You can add one inline.</p>
                </div>

                {showAddInstitute && (
                  <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded bg-white/80 dark:bg-gray-800/80">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Institute name"
                        value={newInstitute.name}
                        onChange={(e) => setNewInstitute({ ...newInstitute, name: e.target.value })}
                        className="input-field md:col-span-2"
                      />
                      <select
                        value={newInstitute.type}
                        onChange={(e) => setNewInstitute({ ...newInstitute, type: e.target.value })}
                        className="input-field"
                      >
                        {academicTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="City (optional)"
                        value={newInstitute.location.city}
                        onChange={(e) => setNewInstitute({ ...newInstitute, location: { ...newInstitute.location, city: e.target.value } })}
                        className="input-field"
                      />
                      <input
                        type="url"
                        placeholder="Website (optional)"
                        value={newInstitute.website}
                        onChange={(e) => setNewInstitute({ ...newInstitute, website: e.target.value })}
                        className="input-field md:col-span-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                      <button type="button" onClick={() => { setShowAddInstitute(false); setNewInstitute({ name: '', type: 'College', location: { city: '' }, website: '' }) }} className="btn-secondary">Cancel</button>
                      <button type="button" onClick={async () => {
                        if (!newInstitute.name || newInstitute.name.trim().length === 0) { toast.error('Institute name required'); return }
                        try {
                          const payload = { ...newInstitute }
                          const res = await api.post('/institutes', payload)
                          const created = res.data && (res.data.institute || res.data)
                          // add to local list
                          const inst = created._id ? created : (created[0] || created)
                          setInstitutes(prev => [inst, ...prev])
                          // select it
                          setFormData(prev => ({ ...prev, linkedInstitutes: Array.from(new Set([...(prev.linkedInstitutes || []), inst._id])) }))
                          toast.success('Institute added and selected')
                          setShowAddInstitute(false)
                          setNewInstitute({ name: '', type: 'College', location: { city: '' }, website: '' })
                        } catch (err) {
                          console.error('Create institute error', err)
                          toast.error(err?.response?.data?.message || 'Failed to create institute')
                        }
                      }} className="btn-primary">Create & Select</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-y w-full min-w-0"
                  rows="6"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Long Description
                </label>
                <textarea
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  className="input-field resize-y w-full min-w-0"
                  rows="8"
                  placeholder="Detailed description of the project..."
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technologies (comma-separated)
              </label>
              <div>
                <input
                  type="text"
                  value={(formData.technologies || []).join(', ')}
                  onChange={(e) => {
                    const raw = String(e.target.value || '')
                    const parts = raw.split(/[,;]+/).map(p => p.trim()).filter(Boolean)
                    setFormData(prev => ({ ...prev, technologies: parts }))
                  }}
                  className="input-field w-full"
                  placeholder="e.g. React, Node.js, Tailwind, MongoDB"
                />
                <p className="text-xs text-gray-500 mt-1">Enter multiple technologies separated by commas or semicolons.</p>
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub URLs</label>
                <div className="space-y-2">
                  {(formData.githubUrls || []).map((url, i) => (
                    <div key={`gh-${i}`} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateArrayItem('githubUrls', i, e.target.value)}
                        className="input-field flex-1"
                        placeholder="https://github.com/username/repo"
                      />
                      <button type="button" onClick={() => removeArrayItem('githubUrls', i)} className="p-2 text-red-600 hover:text-red-700 transition-colors">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('githubUrls', '')} className="btn-secondary flex items-center text-sm"><Plus className="w-4 h-4 mr-1" /> Add GitHub URL</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Live URLs</label>
                <div className="space-y-2">
                  {(formData.liveUrls || []).map((url, i) => (
                    <div key={`live-${i}`} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateArrayItem('liveUrls', i, e.target.value)}
                        className="input-field flex-1"
                        placeholder="https://your-project.com"
                      />
                      <button type="button" onClick={() => removeArrayItem('liveUrls', i)} className="p-2 text-red-600 hover:text-red-700 transition-colors">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('liveUrls', '')} className="btn-secondary flex items-center text-sm"><Plus className="w-4 h-4 mr-1" /> Add Live URL</button>
                </div>
              </div>
            </div>

            {/* Preview Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview Images</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {(formData.screenshots || []).map((url, i) => (
                  <div key={`shot-${i}`} className="relative w-28 h-20 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={url} alt={`screenshot-${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeArrayItem('screenshots', i)} className="absolute top-1 right-1 bg-black/60 text-white rounded px-1 text-xs">×</button>
                  </div>
                ))}
                {(!formData.screenshots || formData.screenshots.length === 0) && (
                  <span className="text-xs text-gray-500">No images uploaded yet</span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    if (!files.length) return
                    try {
                      for (const file of files) {
                        const fd = new FormData()
                        fd.append('image', file)
                        const res = await api.post('/upload/projects/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                        const url = res.data?.url
                        if (url) setFormData(prev => ({ ...prev, screenshots: [...(prev.screenshots || []), url] }))
                      }
                      toast.success('Image(s) uploaded')
                    } catch (err) {
                      console.error('Upload preview error', err)
                      toast.error(err?.response?.data?.message || 'Failed to upload image')
                    } finally {
                      if (uploadInputRef.current) uploadInputRef.current.value = ''
                    }
                  }}
                />
                <button type="button" className="btn-secondary" onClick={() => uploadInputRef.current?.click()}>Upload Image</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => addArrayItem('screenshots', '')}
                >Add by URL</button>
              </div>
              {/* If adding by URL, allow editing inline */}
              {(formData.screenshots || []).map((url, i) => (
                url === '' ? (
                  <div key={`shot-edit-${i}`} className="mt-2 flex gap-2">
                    <input
                      type="url"
                      placeholder="https://image.url/preview.jpg"
                      className="input-field flex-1"
                      value={url}
                      onChange={(e) => updateArrayItem('screenshots', i, e.target.value)}
                    />
                    <button type="button" className="btn-secondary" onClick={() => removeArrayItem('screenshots', i)}>Remove</button>
                  </div>
                ) : null
              ))}
              <p className="text-xs text-gray-500 mt-2">Project cards no longer show live/preview tags — use the project modal to see live previews. Use the "Ongoing / Present" checkbox to mark projects that are still active.</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Tag name"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Dates with precision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <div className="flex gap-2 items-center">
                  <select className="input-field w-44" value={formData.startPrecision} onChange={(e) => normalizeDateOnPrecisionChange('startDate', e.target.value)}>
                    <option value="date">Full date</option>
                    <option value="month">Month & year</option>
                    <option value="year">Year only</option>
                  </select>
                  {formData.startPrecision === 'date' && (
                    <input type="date" className="input-field" value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                  )}
                  {formData.startPrecision === 'month' && (
                    <input type="month" className="input-field" value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                  )}
                  {formData.startPrecision === 'year' && (
                    <input type="number" min="1900" max="2100" className="input-field w-28" value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <div className="flex gap-2 items-center">
                  <select disabled={formData.isCurrent} className={`input-field w-44 ${formData.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.endPrecision} onChange={(e) => normalizeDateOnPrecisionChange('endDate', e.target.value)}>
                    <option value="date">Full date</option>
                    <option value="month">Month & year</option>
                    <option value="year">Year only</option>
                  </select>
                  {formData.endPrecision === 'date' && (
                    <input disabled={formData.isCurrent} type="date" className={`input-field ${formData.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                  )}
                  {formData.endPrecision === 'month' && (
                    <input disabled={formData.isCurrent} type="month" className={`input-field ${formData.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                  )}
                  {formData.endPrecision === 'year' && (
                    <input disabled={formData.isCurrent} type="number" min="1900" max="2100" className={`input-field w-28 ${formData.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                  )}
                </div>
                {formData.isCurrent && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This project is marked as ongoing; end date is ignored.</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Featured Project</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Ongoing / Present</label>
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

      {/* Projects List */}
      <div className="card">
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No projects found
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project._id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                      {project.featured && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
                          Featured
                        </span>
                      )}
                      {/* show category and subcategories as badges */}
                      {project.category && (
                        <span className={`px-2 py-1 text-xs rounded-md ${getCategoryColor(project.category)}`}>
                          {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                        </span>
                      )}
                      {project.category === 'academic' && project.academicScale && (
                        <span className={`px-2 py-1 text-xs rounded-md ml-2 ${project.academicScale === 'mini' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {project.academicScale === 'mini' ? 'Mini' : 'Major'}
                        </span>
                      )}
                        {project.subcategories && project.subcategories.length > 0 && project.subcategories.map((sub) => (
                          <span key={sub} className={`px-2 py-1 text-xs rounded-md ${getCategoryColor(sub)} ml-2`}>{sub === 'ai-ml-dl' ? 'AI/ML/DL' : sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
                        ))}
                        {project.linkedInstitutes && project.linkedInstitutes.length > 0 && (
                          <div className="flex items-center gap-2 ml-2">
                            {project.linkedInstitutes.map((li) => {
                              // resolve id -> name where possible
                              const inst = institutes.find(i => i._id === li) || institutes.find(i => (i.name || '').toLowerCase().trim() === String(li).toLowerCase().trim())
                              const label = inst ? inst.name : li
                              return (
                                <span key={String(li)} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {label}
                                </span>
                              )
                            })}
                          </div>
                        )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {project.description}
                    </p>

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.slice(0, 5).map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 5 && (
                          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{project.technologies.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {(project.githubUrls || (project.githubUrl ? [project.githubUrl] : [])).length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {(project.githubUrls || (project.githubUrl ? [project.githubUrl] : [])).map((g, gi) => (
                            <div key={`pg-${project._id}-gh-${gi}`} className="flex items-center gap-1">
                              <Github className="w-4 h-4" />
                              <a href={g} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">{g}</a>
                            </div>
                          ))}
                        </div>
                      )}

                      {(project.liveUrls || (project.liveUrl ? [project.liveUrl] : [])).length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {(project.liveUrls || (project.liveUrl ? [project.liveUrl] : [])).map((l, li) => (
                            <div key={`pg-${project._id}-live-${li}`} className="flex items-center gap-1">
                              <ExternalLink className="w-4 h-4" />
                              <a href={l} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">{l}</a>
                            </div>
                          ))}
                        </div>
                      )}

                      {project.startLabel ? (
                        <div className="flex items-center gap-1"><span>Started: {project.startLabel}</span></div>
                      ) : project.startDate ? (
                        <div className="flex items-center gap-1"><span>Started: {new Date(project.startDate).toLocaleDateString()}</span></div>
                      ) : null}

                      {project.isCurrent ? (
                        <div className="flex items-center gap-1"><span>Completed: Present</span></div>
                      ) : project.endLabel ? (
                        <div className="flex items-center gap-1"><span>Completed: {project.endLabel}</span></div>
                      ) : project.endDate ? (
                        <div className="flex items-center gap-1"><span>Completed: {new Date(project.endDate).toLocaleDateString()}</span></div>
                      ) : null}
                    </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Preview: {project.screenshotUpdatedAt ? new Date(project.screenshotUpdatedAt).toLocaleString() : 'never'}
                        </span>
                        {((project.liveUrls && project.liveUrls.length) || project.liveUrl) ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => refreshProject(project._id, false)}
                              disabled={!!refreshing[project._id]}
                              className="btn-secondary flex items-center h-7 px-2"
                              title="Capture a fresh screenshot now"
                            >
                              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing[project._id] ? 'animate-spin' : ''}`} />
                              Now
                            </button>
                            <button
                              type="button"
                              onClick={() => refreshProject(project._id, true)}
                              disabled={!!refreshing[project._id]}
                              className="btn-secondary flex items-center h-7 px-2"
                              title="Refresh only if site changed (ETag/Last-Modified)"
                            >
                              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing[project._id] ? 'animate-spin' : ''}`} />
                              If changed
                            </button>
                          </div>
                        ) : (
                          <span className="italic">No live URL</span>
                        )}
                      </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit project"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete project"
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

export default ProjectsManagement

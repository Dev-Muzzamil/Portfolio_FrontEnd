import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, EyeOff, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'
import TechnologyIcon from './TechnologyIcon'

const SkillsManagement = () => {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [referenceModal, setReferenceModal] = useState({ open: false, skill: null, references: null })
  const [formData, setFormData] = useState({
    name: '',
    category: 'Language',
    proficiency: 'Beginner',
    level: 50,
    description: ''
  })
  const formRef = useRef(null)

  const categories = [
    'Language',
    'Framework / Library',
    'Database',
    'DevOps / Cloud',
    'Tooling',
    'Testing',
    'UI / UX',
    'Other'
  ]

  const proficiencies = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ]

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const response = await api.get('/skills/admin/all')
      setSkills(response.data.skills)
    } catch (error) {
      console.error('Fetch skills error:', error)
      toast.error('Failed to fetch skills')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSkill) {
        await api.put(`/skills/${editingSkill._id}`, formData)
        toast.success('Skill updated successfully')
      } else {
        await api.post('/skills', formData)
        toast.success('Skill created successfully')
      }

      setIsCreating(false)
      setEditingSkill(null)
      resetForm()
      fetchSkills()
    } catch (error) {
      console.error('Save skill error:', error)
      toast.error(error.response?.data?.message || 'Failed to save skill')
    }
  }

  const handleEdit = (skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      level: skill.level || 50,
      description: skill.description || ''
    })
    setIsCreating(true)
  }

  const handleDelete = async (skillId) => {
    try {
      // Get the references first
      const res = await api.get(`/skills/${skillId}/references`)
      const { references, usageStats } = res.data

      // If there are active references, show modal with cascade option
      if (usageStats?.activeReferences > 0 || (references && (references.projects.length || references.certifications.length || references.education.length))) {
        setReferenceModal({ open: true, skill: skillId, references: references, allowCascade: true })
        return
      }

      // No references — prompt and delete
      if (!window.confirm('Are you sure you want to delete this skill?')) return
      await api.delete(`/skills/${skillId}`)
      toast.success('Skill deleted successfully')
      fetchSkills()
    } catch (error) {
      console.error('Delete skill error:', error)
      const serverMsg = error?.response?.data?.message || error.message
      const serverDetails = error?.response?.data?.details
      // If the server reports active references (race), fetch references and show modal with details
      if (serverDetails) {
        try {
          const retry = await api.get(`/skills/${skillId}/references`)
          setReferenceModal({ open: true, skill: skillId, references: retry.data.references, allowCascade: true })
        } catch (_) {
          setReferenceModal({ open: true, skill: skillId, references: null, allowCascade: true })
        }
        toast.error(serverMsg)
        return
      }
      toast.error(serverMsg || 'Failed to delete skill')
    }
  }

  const confirmCascadeDelete = async (skillId) => {
    if (!window.confirm('⚠️ CASCADE DELETE: This will permanently delete the skill AND remove it from all projects, certifications, and education. Continue?')) return

    try {
      await api.delete(`/skills/${skillId}?cascade=true`)
      toast.success('Skill deleted and removed from all references')
      setReferenceModal({ open: false, skill: null, references: null, allowCascade: false })
      fetchSkills()
    } catch (error) {
      console.error('Cascade delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to cascade delete skill')
    }
  }

  const toggleVisibility = async (skill) => {
    try {
      const response = await api.put(`/skills/${skill._id}/toggle-active`)
      const updated = response.data.skill
      setSkills(prev => prev.map(s => (s._id === updated._id ? updated : s)))
      toast.success(`Skill ${updated.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Toggle skill visibility error:', error)
      toast.error('Failed to toggle skill visibility')
    }
  }

  const handleSyncFromProjects = async () => {
    if (!window.confirm('Sync all skills from projects, certifications, and education? This will auto-create skills for any technologies/skills found.')) return
    try {
      setSyncing(true)

      // First cleanup messy names
      try {
        const cleanupRes = await api.post('/skills/cleanup-names')
        if (cleanupRes.data.cleaned > 0) {
          toast.success(`Cleaned ${cleanupRes.data.cleaned} skill names`)
        }
      } catch (cleanupErr) {
        console.warn('Cleanup warning:', cleanupErr)
      }

      // Then sync
      const response = await api.post('/skills/sync-all')
      const results = response.data.results
      toast.success(`Synced ${results.totalSkills} skills from ${results.projects.processed} projects, ${results.certifications.processed} certifications, and ${results.education.processed} education items`)
      fetchSkills()
    } catch (error) {
      console.error('Sync skills error:', error)
      toast.error(error.response?.data?.message || 'Failed to sync skills')
    } finally {
      setSyncing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Language',
      proficiency: 'Beginner',
      level: 50,
      description: ''
    })
  }

  const [draggedSkillId, setDraggedSkillId] = useState(null)

  const handleDragStart = (e, skillId) => {
    setDraggedSkillId(skillId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedSkillId(null)
  }

  const handleDragOverCategory = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnCategory = async (e, category) => {
    e.preventDefault()
    if (!draggedSkillId) return

    const skill = skills.find(s => s._id === draggedSkillId)
    if (!skill || skill.category === category) {
      setDraggedSkillId(null)
      return
    }

    try {
      // optimistic UI update
      setSkills(prev => prev.map(s => (s._id === draggedSkillId ? { ...s, category } : s)))
      await api.put(`/skills/${draggedSkillId}`, { category })
      toast.success(`Moved "${skill.name}" to ${category}`)
    } catch (error) {
      console.error('Move skill error:', error)
      toast.error('Failed to move skill')
      fetchSkills()
    } finally {
      setDraggedSkillId(null)
    }
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingSkill(null)
    resetForm()
  }

  const confirmDeleteFromModal = async (skillId) => {
    try {
      await api.delete(`/skills/${skillId}`)
      toast.success('Skill deleted successfully')
      fetchSkills()
      setReferenceModal({ open: false, skill: null, references: null })
    } catch (error) {
      console.error('Delete from modal error:', error)
      toast.error(error?.response?.data?.message || 'Failed to delete skill')
    }
  }

  // Get all unique categories from actual skills for display
  const actualCategories = [...new Set(skills.map(s => s.category || 'Uncategorized'))]
  // Merge predefined categories with actual categories from DB
  const allCategoriesForFilter = ['all', ...new Set([...categories, ...actualCategories])]

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchTerm ||
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    const matchesActive = showInactive ? true : skill.isActive !== false

    return matchesSearch && matchesCategory && matchesActive
  })

  const getProficiencyColor = (proficiency) => {
    switch (proficiency) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-blue-100 text-blue-800'
      case 'Advanced': return 'bg-purple-100 text-purple-800'
      case 'Expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Group by all categories (predefined + actual) - show all as drop zones
  const allDisplayCategories = selectedCategory === 'all'
    ? [...new Set([...categories, ...actualCategories])]
    : [selectedCategory]

  const skillsByCategory = {}
  // Initialize all categories with empty arrays
  allDisplayCategories.forEach(cat => {
    skillsByCategory[cat] = []
  })
  // Fill with actual skills
  filteredSkills.forEach(skill => {
    const cat = skill.category || 'Uncategorized'
    if (skillsByCategory[cat]) {
      skillsByCategory[cat].push(skill)
    }
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills Management</h2>
        <div className="flex gap-4">
          <button
            onClick={handleSyncFromProjects}
            disabled={syncing}
            className="btn-secondary flex items-center disabled:opacity-60"
          >
            <Link2 className="w-4 h-4 mr-2" />
            {syncing ? 'Syncing…' : 'Sync From Projects'}
          </button>
          <button
            onClick={fetchSkills}
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
            Add Skill
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
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-48"
          >
            <option value="all">All Categories ({skills.length})</option>
            {allCategoriesForFilter.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>
                {category} ({skills.filter(s => s.category === category).length})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowInactive(prev => !prev)}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm border transition-colors ${showInactive
                ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700'
                : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
          >
            {showInactive ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            {showInactive ? 'Show All' : 'Hide Inactive'}
          </button>
        </div>
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
            {editingSkill ? 'Edit Skill' : 'Create New Skill'}
          </h3>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field pr-10"
                    required
                    placeholder="e.g. React, Python, AWS"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <TechnologyIcon technology={formData.name} className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Icon preview based on name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proficiency *
                </label>
                <select
                  value={formData.proficiency}
                  onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
                  className="input-field"
                  required
                >
                  {proficiencies.map(proficiency => (
                    <option key={proficiency} value={proficiency}>{proficiency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>
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
              />
            </div>
          </form>
        </motion.div>
      )}

      {/* Skills List grouped by category with drag-and-drop */}
      <div className="card">
        <div className="space-y-6">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No skills found
            </div>
          ) : (
            Object.keys(skillsByCategory).map((category) => (
              <div
                key={category}
                className={`border border-dashed rounded-lg p-3 transition-colors ${draggedSkillId
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 border-2'
                    : 'border-gray-200 dark:border-gray-700'
                  }`}
                onDragOver={handleDragOverCategory}
                onDrop={(e) => handleDropOnCategory(e, category)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {category}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {skillsByCategory[category]?.length || 0} skill{(skillsByCategory[category]?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {!skillsByCategory[category] || skillsByCategory[category].length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Drag a skill here to add it to this category
                  </div>
                ) : (
                  <div className="space-y-3">
                    {skillsByCategory[category].map((skill) => (
                      <div
                        key={skill._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, skill._id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-all ${draggedSkillId === skill._id
                            ? 'opacity-50 scale-95 border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700'
                          } cursor-move`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <TechnologyIcon technology={skill.name} className="w-5 h-5" />
                            <h4 className="font-medium text-gray-900 dark:text-white">{skill.name}</h4>
                            {!skill.isActive && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 uppercase tracking-wide">Hidden</span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-md ${getProficiencyColor(skill.proficiency)}`}>
                              {skill.proficiency}
                            </span>
                          </div>
                          {skill.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {skill.description}
                            </p>
                          )}
                          {skill.level && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Level:</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-primary-600 h-2 rounded-full"
                                    style={{ width: `${skill.level}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{skill.level}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => toggleVisibility(skill)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title={skill.isActive ? 'Hide from public sections' : 'Show in public sections'}
                          >
                            {skill.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(skill)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(skill._id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* References modal for delete checks */}
      {referenceModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skill References</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setReferenceModal({ open: false, skill: null, references: null })}>Close</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">This skill is referenced by the following items. Remove references before deleting, or delete them if appropriate.</p>
              <div>
                <h4 className="font-semibold">Projects</h4>
                {referenceModal.references?.projects?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {referenceModal.references.projects.map(p => (
                      <li key={p.id}>{p.title} {p.isActive ? '(active)' : '(inactive)'}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-500">No projects</p>}
              </div>
              <div>
                <h4 className="font-semibold">Certifications</h4>
                {referenceModal.references?.certifications?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {referenceModal.references.certifications.map(c => (
                      <li key={c.id}>{c.title} {c.isActive ? '(active)' : '(inactive)'}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-500">No certifications</p>}
              </div>
              <div>
                <h4 className="font-semibold">Education</h4>
                {referenceModal.references?.education?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {referenceModal.references.education.map(e => (
                      <li key={e.id}>{e.degree || e.field} {e.isActive ? '(active)' : '(inactive)'}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-500">No education references</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn-secondary" onClick={() => setReferenceModal({ open: false, skill: null, references: null, allowCascade: false })}>Close</button>
              {(!referenceModal.references || (referenceModal.references && (referenceModal.references.projects.length + referenceModal.references.certifications.length + referenceModal.references.education.length) === 0)) ? (
                <button className="btn-primary" onClick={() => confirmDeleteFromModal(referenceModal.skill)}>Delete Skill</button>
              ) : referenceModal.allowCascade && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  onClick={() => confirmCascadeDelete(referenceModal.skill)}
                >
                  ⚠️ Force Delete & Remove All References
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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

export default SkillsManagement
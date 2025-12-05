import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Eye, EyeOff, CheckSquare, Square, Search, RefreshCw, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import UnifiedSkillsDisplay from '../common/UnifiedSkillsDisplay';
import TechnologyIcon from '../TechnologyIcon';
import toast from 'react-hot-toast';

const SimplifiedSkillsManagement = () => {
  const { skills, createSkill, updateSkill, deleteSkill, bulkDeleteSkills, loading, refreshSkills } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [skillVisibilityOverrides, setSkillVisibilityOverrides] = useState({});
  const [editingSkillName, setEditingSkillName] = useState(null);
  const [editingSkillValue, setEditingSkillValue] = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const skillTypes = [
    { value: 'all', label: 'All Skills', icon: '🔧' },
    { value: 'languages', label: 'Programming Languages', icon: '💻', color: 'bg-blue-100 text-blue-800' },
    { value: 'frameworks', label: 'Frameworks & Libraries', icon: '⚡', color: 'bg-green-100 text-green-800' },
    { value: 'databases', label: 'Databases', icon: '🗄️', color: 'bg-purple-100 text-purple-800' },
    { value: 'cloud', label: 'Cloud & DevOps', icon: '☁️', color: 'bg-orange-100 text-orange-800' },
    { value: 'ai-ml', label: 'AI/ML Tools', icon: '🤖', color: 'bg-pink-100 text-pink-800' },
    { value: 'tools', label: 'Development Tools', icon: '🛠️', color: 'bg-gray-100 text-gray-800' },
    { value: 'security', label: 'Security', icon: '🔒', color: 'bg-red-100 text-red-800' },
    { value: 'concepts', label: 'Concepts & Methodologies', icon: '📚', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'data', label: 'Data & Analytics', icon: '📊', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'other', label: 'Other', icon: '🔧', color: 'bg-gray-100 text-gray-800' }
  ];

  // Load visibility overrides from localStorage
  useEffect(() => {
    const savedSkillOverrides = localStorage.getItem('skillVisibilityOverrides');
    if (savedSkillOverrides) {
      setSkillVisibilityOverrides(JSON.parse(savedSkillOverrides));
    }
  }, []);

  // Filter skills based on search and type (only show visible skills in main display)
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchTerm || 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || skill.category === selectedType;
    
    // Only show visible skills (not overridden or overridden with 'show' action)
    const isVisible = !skill.isOverridden || skill.overrideAction === 'show';
    
    return matchesSearch && matchesType && isVisible;
  });

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const handleEdit = (skill) => {
    if (skill.source === 'project' || skill.source === 'certificate') {
      setEditingSkillName(skill._id);
      setEditingSkillValue(skill.name);
    } else {
      setEditingSkill(skill);
      setIsCreating(true);
      reset({ ...skill, visible: skill.visible.toString() });
    }
  };

  const handleInlineEditSave = async (skill) => {
    if (editingSkillValue.trim() === skill.name) {
      setEditingSkillName(null);
      setEditingSkillValue('');
      return;
    }
    await handleEditSourceSkill(skill, editingSkillValue.trim());
    setEditingSkillName(null);
    setEditingSkillValue('');
  };

  const handleEditSourceSkill = async (skill, newName) => {
    try {
      if (skill.source === 'project') {
        const response = await fetch(`/api/projects/${skill.sourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ updateTechnology: { oldName: skill.name, newName: newName.trim() } })
        });
        if (response.ok) {
          toast.success(`"${skill.name}" updated to "${newName}" in project`);
          await refreshSkills();
        } else {
          toast.error('Failed to update skill in project');
        }
      } else if (skill.source === 'certificate') {
        const response = await fetch(`/api/certificates/${skill.sourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ updateSkill: { oldName: skill.name, newName: newName.trim() } })
        });
        if (response.ok) {
          toast.success(`"${skill.name}" updated to "${newName}" in certificate`);
          await refreshSkills();
        } else {
          toast.error('Failed to update skill in certificate');
        }
      }
    } catch (error) {
      console.error('Error updating source skill:', error);
      toast.error('Failed to update skill');
    }
  };

  const handleDelete = async (skillId) => {
    const skill = skills.find(s => s._id === skillId);
    if (!skill) {
      toast.error('Skill not found');
      return;
    }

    if (skill.source === 'project' || skill.source === 'certificate') {
      const action = window.confirm(`Are you sure you want to permanently delete "${skill.name}" from "${skill.sourceName}"? This will remove it from the ${skill.source}.`) 
        ? 'delete' 
        : window.confirm(`Are you sure you want to hide "${skill.name}" from "${skill.sourceName}"?`) 
        ? 'hide' 
        : null;
      
      if (!action) return;

      try {
        if (action === 'delete') {
          // Actually remove the skill from the source project/certificate
          if (skill.source === 'project') {
            const response = await fetch(`http://localhost:5000/api/projects/${skill.sourceId}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
              },
              body: JSON.stringify({ 
                removeTechnology: skill.name 
              })
            });
            
            if (response.ok) {
              toast.success(`"${skill.name}" permanently removed from project`);
              await refreshSkills();
            } else {
              const errorData = await response.json();
              toast.error(errorData.message || 'Failed to remove skill from project');
            }
          } else if (skill.source === 'certificate') {
            const response = await fetch(`http://localhost:5000/api/certificates/${skill.sourceId}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
              },
              body: JSON.stringify({ 
                removeSkill: skill.name 
              })
            });
            
            if (response.ok) {
              toast.success(`"${skill.name}" permanently removed from certificate`);
              await refreshSkills();
            } else {
              const errorData = await response.json();
              toast.error(errorData.message || 'Failed to remove skill from certificate');
            }
          }
        } else {
          // Hide using override system
          const response = await fetch('http://localhost:5000/api/skills/override', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ 
              skillName: skill.name, 
              source: skill.source, 
              sourceId: skill.sourceId, 
              action: 'hide' 
            })
          });
          
          if (response.ok) {
            toast.success(`"${skill.name}" hidden from skills display`);
            await refreshSkills();
          } else {
            const errorData = await response.json();
            toast.error(errorData.message || 'Failed to hide skill');
          }
        }
      } catch (error) {
        console.error(`Error ${action}ing skill:`, error);
        toast.error(`Failed to ${action} skill`);
      }
      return;
    }
    
    // For manual skills
    if (window.confirm('Are you sure you want to delete this skill?')) {
      const result = await deleteSkill(skillId);
      if (result.success) {
        toast.success('Skill deleted successfully!');
        await refreshSkills();
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleRestoreSkill = async (skill) => {
    if (window.confirm(`Are you sure you want to restore "${skill.name}" from "${skill.sourceName}"?`)) {
      try {
        const requestData = { 
          skillName: skill.name, 
          source: skill.source, 
          sourceId: skill.sourceId 
        };
        
        const response = await fetch('http://localhost:5000/api/skills/override', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          toast.success(`"${skill.name}" restored to skills display`);
          await refreshSkills();
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to restore skill');
        }
      } catch (error) {
        console.error('Error restoring skill:', error);
        toast.error('Failed to restore skill');
      }
    }
  };

  const toggleSkillVisibility = async (skillId, isVisible) => {
    const skill = skills.find(s => s._id === skillId);
    if (!skill) {
      toast.error('Skill not found');
      return;
    }

    // For source skills (project/certificate), use the override system
    if (skill.source === 'project' || skill.source === 'certificate') {
      const action = isVisible ? 'hide' : 'show';
      try {
        const response = await fetch('http://localhost:5000/api/skills/override', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ 
            skillName: skill.name, 
            source: skill.source, 
            sourceId: skill.sourceId, 
            action: action 
          })
        });
        
        if (response.ok) {
          toast.success(`Skill ${action === 'hide' ? 'hidden' : 'shown'} successfully`);
          await refreshSkills();
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || `Failed to ${action} skill`);
        }
      } catch (error) {
        console.error(`Error ${action}ing skill:`, error);
        toast.error(`Failed to ${action} skill`);
      }
    } else {
      // For manual skills, use local storage overrides
      const newVisibility = !isVisible;
      const newOverrides = { ...skillVisibilityOverrides, [skillId]: newVisibility };
      setSkillVisibilityOverrides(newOverrides);
      localStorage.setItem('skillVisibilityOverrides', JSON.stringify(newOverrides));
      
      toast.success(newVisibility ? 'Skill shown' : 'Skill hidden');
      // Refresh skills to update the display
      await refreshSkills();
    }
  };

  const handleSelectSkill = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSkills.length === filteredSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(filteredSkills.map(skill => skill._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSkills.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedSkills.length} skills?`)) {
      setIsDeleting(true);
      try {
        const result = await bulkDeleteSkills(selectedSkills);
        if (result.success) {
          toast.success(`${selectedSkills.length} skills deleted successfully!`);
          setSelectedSkills([]);
          await refreshSkills();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to delete skills');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const skillData = {
        ...data,
        visible: data.visible === 'true'
      };

      if (editingSkill) {
        const result = await updateSkill(editingSkill._id, skillData);
        if (result.success) {
          toast.success('Skill updated successfully!');
          setIsCreating(false);
          setEditingSkill(null);
          reset();
          await refreshSkills();
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await createSkill(skillData);
        if (result.success) {
          toast.success('Skill created successfully!');
          setIsCreating(false);
          reset();
          await refreshSkills();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error('Failed to save skill');
    }
  };

  const handleInlineEditCancel = () => {
    setEditingSkillName(null);
    setEditingSkillValue('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Management</h1>
            <p className="text-gray-600">Manage your technical skills and expertise</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
            <div className="text-sm text-gray-500">Total Skills</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {skillTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>

          {selectedSkills.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="btn-danger flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedSkills.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., React, Python, AWS"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {skillTypes.slice(1).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  {...register('level', { min: 1, max: 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  {...register('visible')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description of your experience with this skill"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingSkill(null);
                  reset();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingSkill ? 'Update Skill' : 'Add Skill'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Skills Display */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-semibold text-gray-900">Active Skills</h2>
           {skills.filter(skill => skill.isOverridden && (skill.overrideAction === 'delete' || skill.overrideAction === 'hide')).length > 0 && (
             <div className="flex items-center space-x-2 text-sm text-gray-500">
               <EyeOff className="w-4 h-4" />
               <span>Hidden skills available</span>
             </div>
           )}
         </div>
        
        <UnifiedSkillsDisplay 
          mode="admin"
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleVisibility={toggleSkillVisibility}
          selectedSkills={selectedSkills}
          onSelectSkill={handleSelectSkill}
          isAdmin={true}
        />
      </div>

      {/* Hidden Skills Section - Always show at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <EyeOff className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Hidden Skills</h3>
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
              {skills.filter(skill => skill.isOverridden && (skill.overrideAction === 'delete' || skill.overrideAction === 'hide')).length}
            </span>
          </div>
          <button
            onClick={() => refreshSkills()}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {skills.filter(skill => skill.isOverridden && (skill.overrideAction === 'delete' || skill.overrideAction === 'hide')).length > 0 ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hidden Skills</h3>
              <div className="h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
              <p className="text-gray-600 mt-3 text-sm">
                These skills have been hidden from your skills display. Click the eye icon to restore them.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skills
                .filter(skill => skill.isOverridden && (skill.overrideAction === 'delete' || skill.overrideAction === 'hide'))
                .map((skill) => (
                  <div
                    key={skill._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                          <TechnologyIcon technology={skill.name} className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors duration-300" title={skill.name}>{skill.name}</h3>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex-shrink-0">
                              Hidden
                            </span>
                          </div>
                          
                          {/* Source information - only show on hover */}
                          {skill.source && (skill.source === 'project' || skill.source === 'certificate') && skill.sourceName && (
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => {
                                  if (skill.source === 'project') {
                                    window.location.href = '/admin/projects';
                                    setTimeout(() => {
                                      const projectElement = document.querySelector(`[data-project-id="${skill.sourceId}"]`);
                                      if (projectElement) {
                                        projectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        projectElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50', 'bg-blue-50');
                                        setTimeout(() => {
                                          projectElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50', 'bg-blue-50');
                                        }, 2000);
                                      }
                                    }, 100);
                                  } else if (skill.source === 'certificate') {
                                    window.location.href = '/admin/certificates';
                                    setTimeout(() => {
                                      const certElement = document.querySelector(`[data-certificate-id="${skill.sourceId}"]`);
                                      if (certElement) {
                                        certElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        certElement.classList.add('ring-4', 'ring-green-500', 'ring-opacity-50', 'bg-green-50');
                                        setTimeout(() => {
                                          certElement.classList.remove('ring-4', 'ring-green-500', 'ring-opacity-50', 'bg-green-50');
                                        }, 2000);
                                      }
                                    }, 100);
                                  }
                                }}
                                className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors duration-200 cursor-pointer truncate block"
                                title={`Click to view ${skill.sourceName}`}
                              >
                                {skill.sourceName}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleRestoreSkill(skill)}
                          className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0"
                          title={`Restore "${skill.name}"`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill._id)}
                          className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0"
                          title={`Permanently delete "${skill.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hidden skills</p>
            <p className="text-gray-400 text-sm">Skills you hide will appear here</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SimplifiedSkillsManagement;

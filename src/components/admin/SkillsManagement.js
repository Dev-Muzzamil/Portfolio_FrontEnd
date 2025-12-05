import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Wrench, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import TechnologyIcon from '../TechnologyIcon';
import toast from 'react-hot-toast';

const SkillsManagement = () => {
  const { skills, createSkill, updateSkill, deleteSkill, loading } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const categories = [
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'database', label: 'Database' },
    { value: 'tools', label: 'Tools' },
    { value: 'other', label: 'Other' }
  ];

  const groups = [
    { value: 'technical', label: 'Technical Skills' },
    { value: 'soft', label: 'Soft Skills' },
    { value: 'tools', label: 'Tools & Technologies' },
    { value: 'frameworks', label: 'Frameworks & Libraries' },
    { value: 'languages', label: 'Programming Languages' },
    { value: 'other', label: 'Other' }
  ];

  const onSubmit = async (data) => {
    const skillData = {
      ...data,
      level: parseInt(data.level),
      visible: data.visible === 'true'
    };

    const result = editingSkill 
      ? await updateSkill(editingSkill._id, skillData)
      : await createSkill(skillData);

    if (result.success) {
      toast.success(editingSkill ? 'Skill updated successfully!' : 'Skill created successfully!');
      reset();
      setIsCreating(false);
      setEditingSkill(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setIsCreating(true);
    reset({
      ...skill,
      visible: skill.visible.toString()
    });
  };

  const handleDelete = async (skillId) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      const result = await deleteSkill(skillId);
      if (result.success) {
        toast.success('Skill deleted successfully!');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingSkill(null);
    reset();
  };

  const handleToggleVisibility = async (skillId, visible) => {
    const result = await updateSkill(skillId, { visible });
    if (result.success) {
      toast.success(visible ? 'Skill is now visible' : 'Skill is now hidden');
    } else {
      toast.error(result.message);
    }
  };

  const skillsByGroup = skills.reduce((acc, skill) => {
    if (!acc[skill.group]) {
      acc[skill.group] = [];
    }
    acc[skill.group].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skills Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your technical skills and proficiency levels
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </motion.div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name *
                </label>
                <input
                  {...register('name', { required: 'Skill name is required' })}
                  className="input-field"
                  placeholder="e.g., React, Python, MongoDB"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proficiency Level *
                </label>
                <div className="space-y-2">
                  <input
                    {...register('level', { 
                      required: 'Level is required',
                      min: { value: 1, message: 'Level must be at least 1' },
                      max: { value: 100, message: 'Level must be at most 100' }
                    })}
                    type="number"
                    min="1"
                    max="100"
                    className="input-field"
                    placeholder="1-100"
                  />
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Beginner (1-30)</span>
                    <span>Intermediate (31-70)</span>
                    <span>Advanced (71-100)</span>
                  </div>
                </div>
                {errors.level && (
                  <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  {...register('icon')}
                  className="input-field"
                  placeholder="🚀, 💻, 🔧 (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group *
                </label>
                <select
                  {...register('group', { required: 'Group is required' })}
                  className="input-field"
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
                {errors.group && (
                  <p className="mt-1 text-sm text-red-600">{errors.group.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  {...register('visible')}
                  className="input-field"
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingSkill ? 'Update Skill' : 'Create Skill'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Skills by Group */}
      <div className="space-y-8">
        {groups.map((group) => {
          const groupSkills = skillsByGroup[group.value] || [];
          
          if (groupSkills.length === 0) return null;

          return (
            <motion.div
              key={group.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{group.label}</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {groupSkills.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupSkills.map((skill) => (
                  <div key={skill._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {skill.icon ? (
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: skill.color + '20' }}
                            >
                              <span className="text-lg">{skill.icon}</span>
                            </div>
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: skill.color + '20' }}
                            >
                              <TechnologyIcon technology={skill.name} className="w-5 h-5" style={{ color: skill.color }} />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                            <p className="text-sm text-gray-500">{skill.level}% proficiency</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                skill.visible 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {skill.visible ? 'Visible' : 'Hidden'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                                {skill.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleVisibility(skill._id, !skill.visible)}
                            className={`p-1 rounded ${skill.visible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                            title={skill.visible ? 'Hide skill' : 'Show skill'}
                          >
                            {skill.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(skill)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(skill._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${skill.level}%`,
                            background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {skills.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🛠️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No skills yet</h3>
          <p className="text-gray-600 mb-6">
            Add your technical skills and proficiency levels
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Skill</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SkillsManagement;



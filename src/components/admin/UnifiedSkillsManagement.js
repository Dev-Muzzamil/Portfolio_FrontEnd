import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckSquare, Square, Filter, Search, RefreshCw, Settings, Code, Award, FolderOpen } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import TechnologyIcon from '../TechnologyIcon';
import toast from 'react-hot-toast';

const UnifiedSkillsManagement = () => {
  const { projects, certificates, loading, refreshData } = useData();
  const [unifiedSkills, setUnifiedSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [skillVisibilityOverrides, setSkillVisibilityOverrides] = useState({});
  const [categoryVisibilityOverrides, setCategoryVisibilityOverrides] = useState({});

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📂' },
    { value: 'languages', label: 'Programming Languages', icon: '💻' },
    { value: 'frameworks', label: 'Frameworks & Libraries', icon: '⚡' },
    { value: 'databases', label: 'Databases', icon: '🗄️' },
    { value: 'cloud', label: 'Cloud & DevOps', icon: '☁️' },
    { value: 'ai-ml', label: 'AI/ML Tools', icon: '🤖' },
    { value: 'tools', label: 'Development Tools', icon: '🛠️' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'concepts', label: 'Concepts & Methodologies', icon: '📚' },
    { value: 'data', label: 'Data & Analytics', icon: '📊' },
    { value: 'other', label: 'Other', icon: '🔧' }
  ];

  const sources = [
    { value: 'all', label: 'All Sources', icon: '📋' },
    { value: 'manual', label: 'Manual Skills', icon: '✏️' },
    { value: 'project', label: 'From Projects', icon: '📁' },
    { value: 'certificate', label: 'From Certificates', icon: '🏆' }
  ];

  // Fetch unified skills from API
  const fetchUnifiedSkills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/skills');
      if (response.ok) {
        const skills = await response.json();
        setUnifiedSkills(skills);
        setFilteredSkills(skills);
      } else {
        toast.error('Failed to fetch skills');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to fetch skills');
    } finally {
      setIsLoading(false);
    }
  };

  // Load visibility overrides from localStorage
  useEffect(() => {
    const savedSkillOverrides = localStorage.getItem('skillVisibilityOverrides');
    const savedCategoryOverrides = localStorage.getItem('categoryVisibilityOverrides');
    
    if (savedSkillOverrides) {
      setSkillVisibilityOverrides(JSON.parse(savedSkillOverrides));
    }
    if (savedCategoryOverrides) {
      setCategoryVisibilityOverrides(JSON.parse(savedCategoryOverrides));
    }
  }, []);

  // Fetch skills on component mount
  useEffect(() => {
    fetchUnifiedSkills();
  }, []);

  // Filter skills based on search, category, and source
  useEffect(() => {
    let filtered = unifiedSkills;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (skill.sourceName && skill.sourceName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(skill => skill.category === selectedCategory);
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(skill => skill.source === selectedSource);
    }

    setFilteredSkills(filtered);
  }, [unifiedSkills, searchTerm, selectedCategory, selectedSource]);

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Toggle individual skill visibility
  const toggleSkillVisibility = (skillId, currentVisible) => {
    const newOverrides = {
      ...skillVisibilityOverrides,
      [skillId]: !currentVisible
    };
    setSkillVisibilityOverrides(newOverrides);
    localStorage.setItem('skillVisibilityOverrides', JSON.stringify(newOverrides));
    toast.success(currentVisible ? 'Skill hidden' : 'Skill shown');
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (category) => {
    const newOverrides = {
      ...categoryVisibilityOverrides,
      [category]: !categoryVisibilityOverrides[category]
    };
    setCategoryVisibilityOverrides(newOverrides);
    localStorage.setItem('categoryVisibilityOverrides', JSON.stringify(newOverrides));
    toast.success(categoryVisibilityOverrides[category] ? 'Category shown' : 'Category hidden');
  };

  // Toggle all skills in category
  const toggleAllSkillsInCategory = (category, visible) => {
    const categorySkills = skillsByCategory[category] || [];
    const newOverrides = { ...skillVisibilityOverrides };
    
    categorySkills.forEach(skill => {
      newOverrides[skill._id] = visible;
    });
    
    setSkillVisibilityOverrides(newOverrides);
    localStorage.setItem('skillVisibilityOverrides', JSON.stringify(newOverrides));
    toast.success(`All ${category} skills ${visible ? 'shown' : 'hidden'}`);
  };

  // Get effective visibility for a skill
  const getEffectiveVisibility = (skill) => {
    // Check category override first
    if (categoryVisibilityOverrides[skill.category] === false) {
      return false;
    }
    // Check individual skill override
    if (skillVisibilityOverrides.hasOwnProperty(skill._id)) {
      return skillVisibilityOverrides[skill._id];
    }
    // Return original visibility
    return skill.visible;
  };

  // Select/deselect skill
  const handleSelectSkill = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Select all visible skills
  const handleSelectAll = () => {
    const visibleSkills = filteredSkills.filter(skill => getEffectiveVisibility(skill));
    if (selectedSkills.length === visibleSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(visibleSkills.map(skill => skill._id));
    }
  };

  // Bulk toggle visibility
  const handleBulkToggleVisibility = (visible) => {
    const newOverrides = { ...skillVisibilityOverrides };
    selectedSkills.forEach(skillId => {
      newOverrides[skillId] = visible;
    });
    setSkillVisibilityOverrides(newOverrides);
    localStorage.setItem('skillVisibilityOverrides', JSON.stringify(newOverrides));
    setSelectedSkills([]);
    toast.success(`${selectedSkills.length} skills ${visible ? 'shown' : 'hidden'}`);
  };

  // Get source icon
  const getSourceIcon = (source) => {
    switch (source) {
      case 'manual': return <Settings className="w-4 h-4" />;
      case 'project': return <FolderOpen className="w-4 h-4" />;
      case 'certificate': return <Award className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  // Get source color
  const getSourceColor = (source) => {
    switch (source) {
      case 'manual': return 'text-blue-600 bg-blue-100';
      case 'project': return 'text-green-600 bg-green-100';
      case 'certificate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Unified Skills Management</h1>
          <p className="mt-2 text-gray-600">
            Manage visibility of all skills from manual entries, projects, and certificates
          </p>
        </div>
        <button
          onClick={fetchUnifiedSkills}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="input-field"
          >
            {sources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.icon} {source.label}
              </option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredSkills.length} skills found
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions */}
      {filteredSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedSkills.length === filteredSkills.filter(skill => getEffectiveVisibility(skill)).length ? (
                  <CheckSquare className="w-4 h-4 text-primary-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>
                  {selectedSkills.length === filteredSkills.filter(skill => getEffectiveVisibility(skill)).length ? 'Deselect All' : 'Select All Visible'}
                </span>
              </button>
              {selectedSkills.length > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            {selectedSkills.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkToggleVisibility(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Selected</span>
                </button>
                <button
                  onClick={() => handleBulkToggleVisibility(false)}
                  className="btn-danger flex items-center space-x-2"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Hide Selected</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Skills by Category */}
      <div className="space-y-8">
        {Object.entries(skillsByCategory).map(([categoryKey, categorySkills]) => {
          const categoryInfo = categories.find(cat => cat.value === categoryKey);
          const isCategoryHidden = categoryVisibilityOverrides[categoryKey] === false;
          
          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{categoryInfo?.icon || '🔧'}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {categoryInfo?.label || categoryKey}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {categorySkills.length} skills • {categorySkills.filter(skill => getEffectiveVisibility(skill)).length} visible
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleCategoryVisibility(categoryKey)}
                    className={`p-2 rounded ${isCategoryHidden ? 'text-gray-400 hover:text-gray-600' : 'text-green-600 hover:text-green-700'}`}
                    title={isCategoryHidden ? 'Show category' : 'Hide category'}
                  >
                    {isCategoryHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => toggleAllSkillsInCategory(categoryKey, true)}
                    className="btn-secondary text-xs"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => toggleAllSkillsInCategory(categoryKey, false)}
                    className="btn-danger text-xs"
                  >
                    Hide All
                  </button>
                </div>
              </div>

              {/* Skills Grid */}
              {!isCategoryHidden && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map((skill) => {
                    const effectiveVisibility = getEffectiveVisibility(skill);
                    
                    return (
                      <div 
                        key={skill._id} 
                        className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-4 ${
                          !effectiveVisibility ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleSelectSkill(skill._id)}
                                className="mt-1"
                              >
                                {selectedSkills.includes(skill._id) ? (
                                  <CheckSquare className="w-4 h-4 text-primary-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
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
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(skill.source)}`}>
                                    {getSourceIcon(skill.source)}
                                    <span className="ml-1 capitalize">{skill.source}</span>
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    effectiveVisibility 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {effectiveVisibility ? 'Visible' : 'Hidden'}
                                  </span>
                                </div>
                                {skill.sourceName && (
                                  <p className="text-xs text-gray-500 mt-1 truncate" title={skill.sourceName}>
                                    From: {skill.sourceName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleSkillVisibility(skill._id, effectiveVisibility)}
                              className={`p-1 rounded ${effectiveVisibility ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                              title={effectiveVisibility ? 'Hide skill' : 'Show skill'}
                            >
                              {effectiveVisibility ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Progress Bar - only for manual skills with level */}
                          {skill.source === 'manual' && skill.level && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${skill.level}%`,
                                  background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No skills found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UnifiedSkillsManagement;

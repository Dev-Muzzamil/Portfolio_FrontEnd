import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Plus, Eye, EyeOff, Edit, Trash2, ChevronDown } from 'lucide-react';
import UnifiedCard from './UnifiedCard';
import UnifiedModal from './UnifiedModal';

const UnifiedList = ({
  items = [],
  type,
  mode,
  loading = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onExpand,
  onLink,
  onAdd,
  linkedItems = [],
  filters = [],
  onFilterChange,
  websitePreviews = {},
  onLoadWebsitePreview,
  className = '',
  config = {}
}) => {
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Configuration for different types and modes
  const defaultConfig = {
    project: {
      home: {
        showFilter: true,
        showAddButton: false,
        gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        emptyState: {
          icon: '🔍',
          title: 'No projects found',
          message: 'No projects match the selected category. Try selecting a different filter.'
        }
      },
      admin: {
        showFilter: false,
        showAddButton: true,
        gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        emptyState: {
          icon: '📁',
          title: 'No projects yet',
          message: 'Start building your portfolio by adding your first project'
        }
      }
    },
    certificate: {
      home: {
        showFilter: false,
        showAddButton: false,
        gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        emptyState: {
          icon: '🏆',
          title: 'No certificates added yet',
          message: 'Certificates will be displayed here once they are added to the admin panel.'
        }
      },
      admin: {
        showFilter: false,
        showAddButton: true,
        gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        emptyState: {
          icon: '🏆',
          title: 'No certificates yet',
          message: 'Add your professional certificates and achievements'
        }
      }
    }
  };

  const currentConfig = { ...defaultConfig[type][mode], ...config };

  // Filter items based on visibility and selected filter
  const filteredItems = items
    .filter(item => {
      // In home mode, only show visible items
      if (mode === 'home') {
        return item.visible !== false; // Show if visible is true or undefined
      }
      // In admin mode, show all items
      return true;
    })
    .filter(item => {
      // Apply category filter
      if (selectedFilter === 'all') {
        return true;
      }
      if (type === 'project') {
        return item.category === selectedFilter;
      } else if (type === 'certificate') {
        return item.category === selectedFilter;
      }
      return true;
    });

  // Default filters based on type
  const defaultFilters = type === 'project' 
    ? ['all', 'web', 'mobile', 'ai-ml-dl', 'other']
    : ['all', 'course', 'workshop', 'certification', 'award', 'other'];

  const availableFilters = filters.length > 0 ? filters : defaultFilters;

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    onFilterChange?.(filter);
  };

  const handleExpand = (itemId) => {
    setExpandedItem(itemId);
    onExpand?.(itemId);
  };

  const handleCloseExpanded = () => {
    setExpandedItem(null);
  };

  const handleEdit = (itemId) => {
    onEdit?.(itemId);
  };

  const handleDelete = (itemId) => {
    onDelete?.(itemId);
  };

  const handleToggleVisibility = (itemId, visible) => {
    onToggleVisibility?.(itemId, visible);
  };

  const handleLink = (itemId, linkedIds) => {
    onLink?.(itemId, linkedIds);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Filter and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">{type === 'project' ? 'Projects' : 'Certificates'}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl">
            {type === 'project' 
              ? 'Here are some of my recent projects that showcase my skills and experience'
              : 'Professional certifications and achievements that validate my expertise'
            }
          </p>
        </div>
        
        {currentConfig.showAddButton && (
          <button
            onClick={onAdd}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add {type === 'project' ? 'Project' : 'Certificate'}</span>
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      {currentConfig.showFilter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {availableFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              {filter === 'ai-ml-dl' ? 'AI/ML/DL' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </motion.div>
      )}

      {/* Items Grid */}
      <div className={`grid ${currentConfig.gridCols} gap-8`}>
        {filteredItems.map((item, index) => (
          <UnifiedCard
            key={item._id}
            data={item}
            type={type}
            mode={mode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
            onExpand={handleExpand}
            onLink={handleLink}
            linkedItems={linkedItems}
            websitePreviews={websitePreviews}
            onLoadWebsitePreview={onLoadWebsitePreview}
            config={config}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">{currentConfig.emptyState.icon}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentConfig.emptyState.title}</h3>
          <p className="text-gray-600 mb-6">
            {currentConfig.emptyState.message}
          </p>
          {currentConfig.showAddButton && (
            <button
              onClick={onAdd}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First {type === 'project' ? 'Project' : 'Certificate'}</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Expanded Item Modal */}
      <UnifiedModal
        data={items.find(item => item._id === expandedItem)}
        type={type}
        mode={mode}
        isOpen={!!expandedItem}
        onClose={handleCloseExpanded}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onLink={handleLink}
        linkedItems={linkedItems}
        websitePreviews={websitePreviews}
        onLoadWebsitePreview={onLoadWebsitePreview}
        config={config}
      />
    </div>
  );
};

export default UnifiedList;

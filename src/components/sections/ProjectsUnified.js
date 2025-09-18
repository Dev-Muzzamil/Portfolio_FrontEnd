import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import UnifiedList from '../UnifiedList';
import ProjectAdapter from '../adapters/ProjectAdapter';

const ProjectsUnified = ({ mode = 'home' }) => {
  const { projects, certificates, loading } = useData();
  const [websitePreviews, setWebsitePreviews] = useState({});
  const [expandedProject, setExpandedProject] = useState(null);

  // Load website preview function
  const loadWebsitePreview = useCallback(async (projectId, liveUrl) => {
    await ProjectAdapter.loadWebsitePreview(projectId, liveUrl, setWebsitePreviews);
  }, []);

  // Auto-load website previews for projects without custom images
  useEffect(() => {
    if (mode === 'home') {
      ProjectAdapter.autoLoadPreviews(projects, setWebsitePreviews, loadWebsitePreview);
    }
  }, [projects, loadWebsitePreview, mode]);

  // Handlers for admin mode
  const handleEdit = (projectId) => {
    // This would be handled by the parent admin component
    console.log('Edit project:', projectId);
  };

  const handleDelete = (projectId) => {
    // This would be handled by the parent admin component
    console.log('Delete project:', projectId);
  };

  const handleToggleVisibility = (projectId, visible) => {
    // This would be handled by the parent admin component
    console.log('Toggle visibility:', projectId, visible);
  };

  const handleExpand = (projectId) => {
    setExpandedProject(projectId);
  };

  const handleLink = (projectId, linkedIds) => {
    // This would be handled by the parent admin component
    console.log('Link certificates:', projectId, linkedIds);
  };

  const handleAdd = () => {
    // This would be handled by the parent admin component
    console.log('Add new project');
  };

  const handleFilterChange = (filter) => {
    // This would be handled by the parent component if needed
    console.log('Filter changed:', filter);
  };

  return (
    <motion.section 
      id="projects" 
      className="section-padding bg-gray-50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <UnifiedList
            items={projects}
            type="project"
            mode={mode}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
            onExpand={handleExpand}
            onLink={handleLink}
            onAdd={handleAdd}
            onFilterChange={handleFilterChange}
            linkedItems={certificates}
            websitePreviews={websitePreviews}
            onLoadWebsitePreview={loadWebsitePreview}
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ProjectsUnified;

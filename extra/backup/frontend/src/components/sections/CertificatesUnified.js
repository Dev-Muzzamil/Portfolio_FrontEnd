import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import UnifiedList from '../UnifiedList';

const CertificatesUnified = ({ mode = 'home' }) => {
  const { certificates, projects, loading } = useData();
  const [expandedCertificate, setExpandedCertificate] = useState(null);

  // Handlers for admin mode
  const handleEdit = (certificateId) => {
    // This would be handled by the parent admin component
    console.log('Edit certificate:', certificateId);
  };

  const handleDelete = (certificateId) => {
    // This would be handled by the parent admin component
    console.log('Delete certificate:', certificateId);
  };

  const handleToggleVisibility = (certificateId, visible) => {
    // This would be handled by the parent admin component
    console.log('Toggle visibility:', certificateId, visible);
  };

  const handleExpand = (certificateId) => {
    setExpandedCertificate(certificateId);
  };

  const handleLink = (certificateId, linkedIds) => {
    // This would be handled by the parent admin component
    console.log('Link projects:', certificateId, linkedIds);
  };

  const handleAdd = () => {
    // This would be handled by the parent admin component
    console.log('Add new certificate');
  };

  const handleFilterChange = (filter) => {
    // This would be handled by the parent component if needed
    console.log('Filter changed:', filter);
  };

  return (
    <motion.section 
      id="certificates" 
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
            items={certificates}
            type="certificate"
            mode={mode}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
            onExpand={handleExpand}
            onLink={handleLink}
            onAdd={handleAdd}
            onFilterChange={handleFilterChange}
            linkedItems={projects}
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CertificatesUnified;

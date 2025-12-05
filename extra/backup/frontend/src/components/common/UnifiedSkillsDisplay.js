import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import TechnologyIcon from '../TechnologyIcon';

const UnifiedSkillsDisplay = ({ 
  mode = 'display', // 'display' for homepage, 'admin' for admin panel
  showActions = false,
  onEdit = null,
  onDelete = null,
  onToggleVisibility = null,
  selectedSkills = [],
  onSelectSkill = null,
  isAdmin = false
}) => {
  const { skills, loading } = useData();
  const [skillVisibilityOverrides, setSkillVisibilityOverrides] = useState({});
  const [categoryVisibilityOverrides, setCategoryVisibilityOverrides] = useState({});

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

  const skillCategories = {
    languages: { name: 'Programming Languages', color: 'from-blue-500 to-blue-600', icon: '💻' },
    frameworks: { name: 'Frameworks & Libraries', color: 'from-green-500 to-green-600', icon: '⚡' },
    databases: { name: 'Databases', color: 'from-purple-500 to-purple-600', icon: '🗄️' },
    cloud: { name: 'Cloud & DevOps', color: 'from-orange-500 to-orange-600', icon: '☁️' },
    'ai-ml': { name: 'AI/ML Tools', color: 'from-pink-500 to-pink-600', icon: '🤖' },
    tools: { name: 'Development Tools', color: 'from-gray-500 to-gray-600', icon: '🛠️' },
    security: { name: 'Security', color: 'from-red-500 to-red-600', icon: '🔒' },
    concepts: { name: 'Concepts & Methodologies', color: 'from-indigo-500 to-indigo-600', icon: '📚' },
    data: { name: 'Data & Analytics', color: 'from-cyan-500 to-cyan-600', icon: '📊' },
    other: { name: 'Other', color: 'from-gray-500 to-gray-600', icon: '🔧' }
  };

  // Filter skills based on visibility and overrides
  const visibleSkills = skills.filter(skill => {
    // Check if skill is overridden and hidden
    if (skill.isOverridden && (skill.overrideAction === 'hide' || skill.overrideAction === 'delete')) {
      return false;
    }
    return getEffectiveVisibility(skill);
  });

  // Group skills by category
  const skillsByCategory = visibleSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (visibleSkills.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🛠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No skills available</h3>
        <p className="text-gray-500">
          {isAdmin ? 'Add some skills to get started.' : 'Skills will appear here once they are added.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => {
        const categoryInfo = skillCategories[category];
        if (!categoryInfo) return null;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
             <div className="flex items-center space-x-4">
               <div className={`w-12 h-12 bg-gradient-to-r ${categoryInfo.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                 {categoryInfo.icon}
               </div>
               <div className="flex-1">
                 <h3 className="text-2xl font-bold text-gray-900">
                   {categoryInfo.name}
                 </h3>
                 {mode === 'display' && (
                   <div className="w-16 h-1 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mt-2" />
                 )}
               </div>
             </div>

            <div className={`grid gap-6 ${
              mode === 'admin' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            }`}>
              {categorySkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill._id);
                const isVisible = getEffectiveVisibility(skill);
                
                return (
                   <div className="group">
                     <motion.div
                       key={skill._id}
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ duration: 0.3 }}
                       className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                         mode === 'admin' 
                           ? `p-4 ${isSelected ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`
                           : 'bg-white border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl'
                       }`}
                     >
                       {/* Gradient overlay for homepage mode */}
                       {mode === 'display' && (
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                       )}
                       
                       <div className="relative z-10 flex items-center space-x-3">
                         {mode === 'admin' && onSelectSkill && (
                           <input
                             type="checkbox"
                             checked={isSelected}
                             onChange={() => onSelectSkill(skill._id)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                           />
                         )}
                         
                         <div className={`${
                           mode === 'admin' ? 'w-10 h-10' : 'w-12 h-12'
                         } bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300 shadow-sm`}>
                           <TechnologyIcon technology={skill.name} className={`${
                             mode === 'admin' ? 'w-6 h-6' : 'w-7 h-7'
                           } text-gray-700 group-hover:text-blue-600 transition-colors duration-300`} />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                           <h4 className={`font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300 ${
                             mode === 'admin' ? 'text-sm' : 'text-base'
                           }`} title={skill.name}>
                             {skill.name}
                           </h4>
                         </div>
                       </div>

                       {showActions && mode === 'admin' && (
                         <div className="relative z-10 flex items-center justify-end space-x-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           {onEdit && (
                             <button
                               onClick={() => onEdit(skill)}
                               className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-sm hover:shadow-md"
                               title="Edit skill"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                               </svg>
                             </button>
                           )}
                           
                           {onDelete && (
                             <button
                               onClick={() => onDelete(skill._id)}
                               className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 shadow-sm hover:shadow-md"
                               title="Delete skill"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           )}
                           
                           {onToggleVisibility && (
                             <button
                               onClick={() => onToggleVisibility(skill._id, isVisible)}
                               className={`p-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md ${
                                 isVisible 
                                   ? 'text-green-600 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100' 
                                   : 'text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100'
                               }`}
                               title={isVisible ? 'Hide skill' : 'Show skill'}
                             >
                               {isVisible ? (
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                 </svg>
                               ) : (
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                 </svg>
                               )}
                             </button>
                           )}
                         </div>
                       )}
                     </motion.div>
                     
                     {/* Source information outside the card - only show if skill has source */}
                     {skill.source && (skill.source === 'project' || skill.source === 'certificate') && skill.sourceName && (
                       <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button
                           onClick={() => {
                             if (skill.source === 'project') {
                               if (mode === 'display') {
                                 // Homepage mode - scroll to projects section
                                 const projectsSection = document.getElementById('projects');
                                 if (projectsSection) {
                                   projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                   // Highlight the specific project after scrolling
                                   setTimeout(() => {
                                     const projectElement = document.querySelector(`[data-project-id="${skill.sourceId}"]`);
                                     if (projectElement) {
                                       projectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                       projectElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50', 'bg-blue-50');
                                       setTimeout(() => {
                                         projectElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50', 'bg-blue-50');
                                       }, 2000);
                                     }
                                   }, 500);
                                 }
                               } else {
                                 // Admin mode - redirect to admin projects
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
                               }
                             } else if (skill.source === 'certificate') {
                               if (mode === 'display') {
                                 // Homepage mode - scroll to certificates section
                                 const certificatesSection = document.getElementById('certificates');
                                 if (certificatesSection) {
                                   certificatesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                   // Highlight the specific certificate after scrolling
                                   setTimeout(() => {
                                     const certElement = document.querySelector(`[data-certificate-id="${skill.sourceId}"]`);
                                     if (certElement) {
                                       certElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                       certElement.classList.add('ring-4', 'ring-green-500', 'ring-opacity-50', 'bg-green-50');
                                       setTimeout(() => {
                                         certElement.classList.remove('ring-4', 'ring-green-500', 'ring-opacity-50', 'bg-green-50');
                                       }, 2000);
                                     }
                                   }, 500);
                                 }
                               } else {
                                 // Admin mode - redirect to admin certificates
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
                             }
                           }}
                           className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors duration-200 cursor-pointer truncate"
                           title={`Click to view ${skill.sourceName}`}
                         >
                           {skill.sourceName}
                         </button>
                       </div>
                     )}
                   </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default UnifiedSkillsDisplay;

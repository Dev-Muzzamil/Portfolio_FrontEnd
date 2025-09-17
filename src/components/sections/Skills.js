import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import TechnologyIcon from '../TechnologyIcon';

const Skills = () => {
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

  if (loading) {
    return (
      <section id="skills" className="section-padding bg-white">
        <div className="container-max">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </section>
    );
  }

  const skillsByCategory = skills.reduce((acc, skill) => {
    // Only include skills that are effectively visible
    if (!getEffectiveVisibility(skill)) {
      return acc;
    }
    
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <section id="skills" className="section-padding bg-gray-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">Skills</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Technologies and tools I work with to bring ideas to life
          </p>
        </motion.div>

        <div className="space-y-12">
          {Object.entries(skillCategories).map(([categoryKey, categoryInfo], categoryIndex) => {
            const categorySkills = skillsByCategory[categoryKey] || [];
            
            if (categorySkills.length === 0) return null;

            return (
              <motion.div
                key={categoryKey}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white text-xl">{categoryInfo.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{categoryInfo.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map((skill, skillIndex) => (
                    <motion.div
                      key={skill._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: skillIndex * 0.05 }}
                      viewport={{ once: true }}
                      className="group"
                    >
                      <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 p-4">
                        <div className="flex items-center justify-between mb-3">
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
                            <div className="flex items-center space-x-2">
                              <span 
                                className="font-semibold text-gray-900 cursor-help" 
                                title={skill.sourceName ? `From: ${skill.sourceName}` : ''}
                              >
                                {skill.name}
                              </span>
                            </div>
                          </div>
                          {/* Only show proficiency for manual skills (not from certificates or projects) */}
                          {skill.source !== 'certificate' && skill.source !== 'project' && skill.level && (
                            <span className="text-sm font-medium text-gray-500">{skill.level}%</span>
                          )}
                        </div>
                        
                        {/* Progress Bar - only for manual skills */}
                        {skill.source !== 'certificate' && skill.source !== 'project' && skill.level && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${skill.level}%` }}
                              transition={{ duration: 1, delay: skillIndex * 0.1 }}
                              viewport={{ once: true }}
                              className="h-2 rounded-full transition-all duration-300 group-hover:shadow-sm"
                              style={{ 
                                background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {skills.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🛠️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No skills added yet</h3>
            <p className="text-gray-600">
              Skills will be displayed here once they are added to the admin panel.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Skills;



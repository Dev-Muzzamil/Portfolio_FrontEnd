import React from 'react';
import { motion } from 'framer-motion';
import UnifiedSkillsDisplay from '../common/UnifiedSkillsDisplay';

const Skills = () => {
  return (
    <motion.section 
      id="skills" 
      className="section-padding bg-gray-50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">Skills</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Technologies and tools I work with to bring ideas to life
          </p>
        </motion.div>

        <UnifiedSkillsDisplay 
          mode="display"
          showActions={false}
          isAdmin={false}
        />
      </div>
    </motion.section>
  );
};

export default Skills;
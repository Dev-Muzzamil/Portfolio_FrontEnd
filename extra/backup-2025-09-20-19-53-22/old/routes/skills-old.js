const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const Certificate = require('../models/Certificate');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// Function to get all unified skills (certificates + projects + manual) with overrides
async function getUnifiedSkills() {
  try {
    // Get skill overrides from about document
    const About = require('../models/About');
    const about = await About.findOne();
    const skillOverrides = about?.skillOverrides || [];
    
    // Get regular skills
    const regularSkills = await Skill.find({ visible: true }).sort({ order: 1, category: 1 });
    
    // Get skills from visible certificates
    const visibleCertificates = await Certificate.find({ visible: true }).select('skills title _id');
    const certificateSkills = [];
    visibleCertificates.forEach(certificate => {
      if (certificate.skills && certificate.skills.length > 0) {
        let skillsArray = certificate.skills;
        
        if (Array.isArray(skillsArray) && skillsArray.length === 1 && typeof skillsArray[0] === 'string' && skillsArray[0].startsWith('[')) {
          try {
            skillsArray = JSON.parse(skillsArray[0]);
          } catch (e) {
            // Keep as is if parsing fails
          }
        } else if (typeof skillsArray === 'string') {
          try {
            skillsArray = JSON.parse(skillsArray);
          } catch (e) {
            skillsArray = skillsArray.split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        }
        
        if (Array.isArray(skillsArray)) {
          skillsArray.forEach(skillName => {
            if (skillName && skillName.trim().length > 0) {
              const skillNameTrimmed = skillName.trim();
              
              // Check if this skill is overridden
              const override = skillOverrides.find(o => 
                o.skillName.toLowerCase() === skillNameTrimmed.toLowerCase() && 
                o.source === 'certificate' && 
                o.sourceId === certificate._id.toString()
              );
              
              if (override && (override.action === 'delete' || override.action === 'hide')) {
                return; // Skip this skill
              }
              
              const skillType = classifySkill(skillNameTrimmed);
              certificateSkills.push({
                name: skillNameTrimmed,
                category: skillType.category,
                group: skillType.group,
                color: skillType.color,
                visible: override ? override.action === 'show' : true,
                source: 'certificate',
                sourceName: certificate.title,
                sourceId: certificate._id.toString(),
                _id: `cert_${certificate._id}_${skillNameTrimmed.replace(/\s+/g, '_').toLowerCase()}`,
                isOverridden: !!override,
                overrideAction: override?.action
              });
            }
          });
        }
      }
    });
    
    // Get skills from visible projects
    const visibleProjects = await Project.find({ visible: true }).select('technologies title _id');
    const projectSkills = [];
    visibleProjects.forEach(project => {
      if (project.technologies && project.technologies.length > 0) {
        project.technologies.forEach(technology => {
          if (technology && technology.trim().length > 0) {
            const technologyTrimmed = technology.trim();
            
            // Check if this skill is overridden
            const override = skillOverrides.find(o => 
              o.skillName.toLowerCase() === technologyTrimmed.toLowerCase() && 
              o.source === 'project' && 
              o.sourceId === project._id.toString()
            );
            
            if (override && (override.action === 'delete' || override.action === 'hide')) {
              return; // Skip this skill
            }
            
            const skillType = classifySkill(technologyTrimmed);
            projectSkills.push({
              name: technologyTrimmed,
              category: skillType.category,
              group: skillType.group,
              color: skillType.color,
              visible: override ? override.action === 'show' : true,
              source: 'project',
              sourceName: project.title,
              sourceId: project._id.toString(),
              _id: `proj_${project._id}_${technologyTrimmed.replace(/\s+/g, '_').toLowerCase()}`,
              isOverridden: !!override,
              overrideAction: override?.action
            });
          }
        });
      }
    });
    
    // Get all hidden skills from overrides
    const hiddenSkills = [];
    skillOverrides.forEach(override => {
      if (override.action === 'hide' || override.action === 'delete') {
        // Find the source data to get skill details
        let sourceData = null;
        if (override.source === 'project') {
          const project = visibleProjects.find(p => p._id.toString() === override.sourceId);
          if (project && project.technologies) {
            const technology = project.technologies.find(tech => 
              tech.toLowerCase().trim() === override.skillName.toLowerCase().trim()
            );
            if (technology) {
              const skillType = classifySkill(override.skillName);
              sourceData = {
                name: override.skillName,
                category: skillType.category,
                group: skillType.group,
                color: skillType.color,
                visible: false,
                source: 'project',
                sourceName: project.title,
                sourceId: project._id.toString(),
                _id: `proj_${project._id}_${override.skillName.replace(/\s+/g, '_').toLowerCase()}`,
                isOverridden: true,
                overrideAction: override.action
              };
            }
          }
        } else if (override.source === 'certificate') {
          const certificate = visibleCertificates.find(c => c._id.toString() === override.sourceId);
          if (certificate && certificate.skills) {
            let skillsArray = certificate.skills;
            
            if (Array.isArray(skillsArray) && skillsArray.length === 1 && typeof skillsArray[0] === 'string' && skillsArray[0].startsWith('[')) {
              try {
                skillsArray = JSON.parse(skillsArray[0]);
              } catch (e) {
                // Keep as is if parsing fails
              }
            } else if (typeof skillsArray === 'string') {
              try {
                skillsArray = JSON.parse(skillsArray);
              } catch (e) {
                skillsArray = skillsArray.split(',').map(s => s.trim()).filter(s => s.length > 0);
              }
            }
            
            if (Array.isArray(skillsArray)) {
              const skill = skillsArray.find(s => 
                s.toLowerCase().trim() === override.skillName.toLowerCase().trim()
              );
              if (skill) {
                const skillType = classifySkill(override.skillName);
                sourceData = {
                  name: override.skillName,
                  category: skillType.category,
                  group: skillType.group,
                  color: skillType.color,
                  visible: false,
                  source: 'certificate',
                  sourceName: certificate.title,
                  sourceId: certificate._id.toString(),
                  _id: `cert_${certificate._id}_${override.skillName.replace(/\s+/g, '_').toLowerCase()}`,
                  isOverridden: true,
                  overrideAction: override.action
                };
              }
            }
          }
        }
        
        if (sourceData) {
          hiddenSkills.push(sourceData);
        }
      }
    });
    
    // Combine all skills (visible + hidden)
    const allSkills = [...regularSkills, ...certificateSkills, ...projectSkills, ...hiddenSkills];
    
    // Remove duplicates and combine source names, but preserve individual overrides
    const skillMap = new Map();
    allSkills.forEach(skill => {
      const key = skill.name.toLowerCase().trim();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        // Only combine if neither is overridden
        if (!existing.isOverridden && !skill.isOverridden) {
          existing.sourceName = `${existing.sourceName}, ${skill.sourceName}`;
          existing.source = 'multiple';
        } else {
          // Keep as separate entries if overridden
          skillMap.set(`${key}_${skill.sourceId}`, skill);
        }
      } else {
        skillMap.set(skill.isOverridden ? `${key}_${skill.sourceId}` : key, skill);
      }
    });
    
    return Array.from(skillMap.values());
  } catch (error) {
    console.error('Error getting unified skills:', error);
    return [];
  }
}

// Function to classify skills by type
function classifySkill(skillName) {
  const skill = skillName.toLowerCase().trim();
  
  // Programming Languages
  if (['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'sass', 'scss', 'less'].includes(skill)) {
    return { category: 'languages', group: 'languages', color: '#3B82F6' };
  }
  
  // Frameworks & Libraries - check for partial matches
  const frameworkKeywords = ['react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'tailwind css', 'material-ui', 'framer motion', 'next.js', 'nuxt.js', 'svelte', 'ember.js', 'express.js', 'formik', 'yup', 'vite'];
  if (frameworkKeywords.some(keyword => skill.includes(keyword) || keyword.includes(skill))) {
    return { category: 'frameworks', group: 'frameworks', color: '#10B981' };
  }
  
  // Databases
  if (['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'mariadb', 'cassandra', 'elasticsearch', 'neo4j', 'dynamodb', 'firebase', 'supabase'].includes(skill)) {
    return { category: 'databases', group: 'databases', color: '#8B5CF6' };
  }
  
  // Cloud & DevOps - check for partial matches
  const cloudKeywords = ['aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible', 'nginx', 'apache', 'linux', 'ubuntu', 'centos'];
  if (cloudKeywords.some(keyword => skill.includes(keyword) || keyword.includes(skill))) {
    return { category: 'cloud', group: 'cloud', color: '#F59E0B' };
  }
  
  // AI/ML Tools - check for partial matches
  const aiMlKeywords = ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nltk', 'spacy', 'hugging face', 'keras', 'xgboost', 'lightgbm', 'catboost', 'ai', 'machine learning', 'deep learning', 'computer vision', 'nlp', 'data analysis', 'data science'];
  if (aiMlKeywords.some(keyword => skill.includes(keyword) || keyword.includes(skill))) {
    return { category: 'ai-ml', group: 'ai-ml', color: '#EC4899' };
  }
  
  // Development Tools
  if (['git', 'github', 'gitlab', 'bitbucket', 'vscode', 'intellij', 'webstorm', 'postman', 'insomnia', 'figma', 'adobe xd', 'sketch', 'zeplin'].includes(skill)) {
    return { category: 'tools', group: 'tools', color: '#6B7280' };
  }
  
  // Security
  if (['cybersecurity', 'penetration testing', 'ethical hacking', 'owasp', 'ssl', 'tls', 'encryption', 'vulnerability assessment', 'security auditing', 'network security', 'vulnerabilities'].includes(skill)) {
    return { category: 'security', group: 'security', color: '#EF4444' };
  }
  
  // Methodologies & Concepts
  if (['agile', 'scrum', 'devops', 'ci/cd', 'microservices', 'api development', 'rest', 'graphql', 'oauth', 'jwt', 'tcp/ip', 'http', 'https', 'compliance', 'frameworks', 'standards', 'regulations', 'system administration', 'operating system', 'networking', 'cryptography', 'digital forensics'].includes(skill)) {
    return { category: 'concepts', group: 'concepts', color: '#8B5CF6' };
  }
  
  // Data & Analytics
  if (['data analysis', 'data science', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'statistics', 'data visualization', 'tableau', 'power bi'].includes(skill)) {
    return { category: 'data', group: 'data', color: '#06B6D4' };
  }
  
  // Default category
  return { category: 'other', group: 'other', color: '#6B7280' };
}

// Get all skills (public) - includes skills from visible certificates and projects
router.get('/', async (req, res) => {
  try {
    console.log('🔗 DEBUG: Fetching all unified skills');
    const allSkills = await getUnifiedSkills();
    console.log('🔗 DEBUG: Total unified skills:', allSkills.length);
    res.json(allSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill visibility overrides (admin only)
router.get('/visibility-overrides', auth, async (req, res) => {
  try {
    // This would typically come from a database, but for now we'll return empty
    // In a real implementation, you'd store these in a separate collection
    res.json({});
  } catch (error) {
    console.error('Error fetching visibility overrides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update skill visibility overrides (admin only)
router.post('/visibility-overrides', auth, async (req, res) => {
  try {
    const { skillOverrides, categoryOverrides } = req.body;
    
    // In a real implementation, you'd save these to a database
    // For now, we'll just return success
    console.log('Skill visibility overrides updated:', { skillOverrides, categoryOverrides });
    
    res.json({ 
      message: 'Visibility overrides updated successfully',
      skillOverrides,
      categoryOverrides
    });
  } catch (error) {
    console.error('Error updating visibility overrides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skills by category (public) - includes skills from visible certificates
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    console.log('🔗 DEBUG: Fetching skills for category:', category);
    
    // Get regular skills for this category
    const regularSkills = await Skill.find({ category, visible: true }).sort({ order: 1 });
    console.log('🔗 DEBUG: Regular skills for category:', regularSkills.length);
    
    // Get all skills and filter by category
    const allSkills = await getUnifiedSkills();
    const filteredSkills = allSkills.filter(skill => skill.category === category);
    
    console.log(`🔗 DEBUG: Total skills for ${category} category:`, filteredSkills.length);
    res.json(filteredSkills);
  } catch (error) {
    console.error('Error fetching skills by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create skill (admin only)
router.post('/', auth, [
  body('name').notEmpty().withMessage('Name is required')
  // Other fields are now optional
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk delete skills (admin only) - MUST come before /:id routes
router.delete('/bulk', auth, [
  body('skillIds').isArray().withMessage('Skill IDs must be an array'),
  body('skillIds.*').isMongoId().withMessage('Invalid skill ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skillIds } = req.body;
    
    const result = await Skill.deleteMany({ _id: { $in: skillIds } });
    
    res.json({ 
      message: `${result.deletedCount} skills deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Bulk delete skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update skill (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if this is a virtual skill ID (from projects/certificates)
    if (req.params.id.startsWith('cert_') || req.params.id.startsWith('proj_')) {
      return res.status(400).json({ 
        message: 'Cannot update virtual skills directly. Update the source project or certificate instead.' 
      });
    }

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    res.json(skill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Override individual skill visibility (admin only)
router.post('/override', auth, async (req, res) => {
  try {
    const { skillName, source, sourceId, action } = req.body;
    
    if (!skillName || !source || !sourceId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (!['hide', 'show', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be hide, show, or delete' });
    }
    
    const About = require('../models/About');
    let about = await About.findOne();
    
    if (!about) {
      about = new About({ skillOverrides: [] });
    }
    
    // Remove existing override for this skill from this source
    about.skillOverrides = about.skillOverrides.filter(
      o => !(o.skillName.toLowerCase() === skillName.toLowerCase() && 
             o.source === source && 
             o.sourceId === sourceId)
    );
    
    // Add new override
    about.skillOverrides.push({
      skillName: skillName.trim(),
      source,
      sourceId,
      action
    });
    
    await about.save();
    
    res.json({ 
      message: `Skill override ${action} applied successfully`,
      override: { skillName, source, sourceId, action }
    });
  } catch (error) {
    console.error('Skill override error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove skill override (admin only)
router.delete('/override', auth, async (req, res) => {
  try {
    const { skillName, source, sourceId } = req.body;
    
    if (!skillName || !source || !sourceId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const About = require('../models/About');
    const about = await About.findOne();
    
    if (!about) {
      return res.status(404).json({ message: 'No overrides found' });
    }
    
    // Remove the override
    const initialLength = about.skillOverrides.length;
    about.skillOverrides = about.skillOverrides.filter(
      o => !(o.skillName.toLowerCase() === skillName.toLowerCase() && 
             o.source === source && 
             o.sourceId === sourceId)
    );
    
    if (about.skillOverrides.length === initialLength) {
      return res.status(404).json({ message: 'Override not found' });
    }
    
    await about.save();
    
    res.json({ message: 'Skill override removed successfully' });
  } catch (error) {
    console.error('Remove skill override error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete skill (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if this is a virtual skill ID (from projects/certificates)
    if (req.params.id.startsWith('cert_') || req.params.id.startsWith('proj_')) {
      return res.status(400).json({ 
        message: 'Cannot delete virtual skills directly. Use the skill override system instead.' 
      });
    }

    const skill = await Skill.findByIdAndDelete(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all skill overrides (admin only)
router.get('/overrides', auth, async (req, res) => {
  try {
    const About = require('../models/About');
    const about = await About.findOne();
    
    res.json(about?.skillOverrides || []);
  } catch (error) {
    console.error('Get skill overrides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



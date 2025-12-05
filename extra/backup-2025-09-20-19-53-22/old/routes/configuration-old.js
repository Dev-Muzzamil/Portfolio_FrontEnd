const express = require('express');
const router = express.Router();
const Configuration = require('../models/Configuration');
const auth = require('../middleware/auth');

// Get configuration (public)
router.get('/', async (req, res) => {
  try {
    console.log('🔗 DEBUG: Fetching site configuration');
    let config = await Configuration.findOne({ isActive: true });
    
    if (!config) {
      console.log('🔗 DEBUG: No configuration found, creating default');
      config = await createDefaultConfiguration();
    }
    
    console.log('🔗 DEBUG: Configuration fetched successfully');
    res.json(config);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update configuration (admin only)
router.put('/', auth, async (req, res) => {
  try {
    console.log('🔗 DEBUG: Updating site configuration');
    const updateData = {
      ...req.body,
      lastUpdated: new Date()
    };
    
    let config = await Configuration.findOneAndUpdate(
      { isActive: true },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );
    
    console.log('🔗 DEBUG: Configuration updated successfully');
    res.json(config);
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset to default configuration (admin only)
router.post('/reset', auth, async (req, res) => {
  try {
    console.log('🔗 DEBUG: Resetting configuration to default');
    
    // Deactivate current configuration
    await Configuration.updateMany({}, { isActive: false });
    
    // Create new default configuration
    const config = await createDefaultConfiguration();
    
    console.log('🔗 DEBUG: Configuration reset successfully');
    res.json(config);
  } catch (error) {
    console.error('Error resetting configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create default configuration
async function createDefaultConfiguration() {
  // Try to get existing About data to populate configuration
  let aboutData = null;
  try {
    const About = require('../models/About');
    aboutData = await About.findOne();
  } catch (error) {
    console.log('No About data found, using default values');
  }

  const defaultConfig = new Configuration({
    siteInfo: {
      name: aboutData?.name || 'Syed Muzzamil Ali',
      title: aboutData?.title || 'Computer Science Engineer & Tech Enthusiast',
      shortBio: aboutData?.shortBio || 'Pursuing M.Tech in Computer Science from Osmania University. Passionate about software development, AI, machine learning, and building innovative solutions.',
      bio: aboutData?.bio || 'I am a postgraduate student from Hyderabad, pursuing an M.Tech in Computer Science (AI & ML) from Osmania University. I have a knowledge of Java, Python, and web technologies, with a strong foundation in AI, machine learning, and sentiment analysis.',
      bioParagraphs: [
        'I am a postgraduate student from Hyderabad, pursuing an M.Tech in Computer Science (AI & ML) from Osmania University.',
        'I have a knowledge of Java, Python, and web technologies, with a strong foundation in AI, machine learning, and sentiment analysis.',
        'During my B.Tech, I worked on projects like "Missing Child Identification System Using Deep Learning" and "Network Intrusion Detection System Using Machine Learning."',
        'Currently, I am exploring new technologies and working on multilingual sentiment analysis using Google Cloud.'
      ],
      tagline: 'Building innovative solutions',
      website: aboutData?.socialLinks?.website || 'https://syedmuzzamilali.me'
    },
    branding: {
      logo: '',
      icon: ''
    },
    contactInfo: {
      email: aboutData?.email || 'sd.muzzamilali@gmail.com',
      phone: aboutData?.phone || '+91 91000 46656',
      location: aboutData?.location || 'Hyderabad, India',
      address: 'Hyderabad, India'
    },
    socialLinks: {
      github: aboutData?.socialLinks?.github || 'https://github.com/Dev-Muzzamil',
      linkedin: aboutData?.socialLinks?.linkedin || 'www.linkedin.com/in/syed-muzzamil-ali',
      twitter: aboutData?.socialLinks?.twitter || 'https://x.com/Dev_Muzzamil',
      website: aboutData?.socialLinks?.website || 'https://syedmuzzamilali.me',
      email: aboutData?.email || 'sd.muzzamilali@gmail.com',
      phone: aboutData?.phone || '+91 91000 46656'
    },
    stats: {
      yearsExperience: 2,
      projectsCount: 10,
      technologiesCount: 15,
      certificatesCount: 5
    },
    seo: {
      title: `${aboutData?.name || 'Syed Muzzamil Ali'} - Professional Portfolio`,
      description: 'Professional portfolio showcasing skills, projects, and experience in AI, ML, and software development.',
      keywords: 'portfolio, developer, engineer, projects, skills, AI, ML, computer science',
      author: aboutData?.name || 'Syed Muzzamil Ali',
      ogImage: aboutData?.photo?.url || ''
    },
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      backgroundColor: '#F9FAFB',
      textColor: '#111827'
    },
    profilePhoto: {
      url: aboutData?.photo?.url || '',
      alt: aboutData?.name || 'Profile Photo'
    },
    settings: {
      showResume: true,
      showProjects: true,
      showSkills: true,
      showCertificates: true,
      showContact: true,
      showGitHub: true,
      enableContactForm: true,
      maintenanceMode: false,
      maintenanceMessage: 'Site is under maintenance. Please check back later.'
    },
    navigation: [
      { name: 'Home', href: '/', visible: true },
      { name: 'About', href: '#about', visible: true },
      { name: 'Projects', href: '#projects', visible: true },
      { name: 'Skills', href: '#skills', visible: true },
      { name: 'Contact', href: '#contact', visible: true }
    ],
    footer: {
      brandName: aboutData?.name || 'Syed Muzzamil Ali',
      description: aboutData?.shortBio || 'Computer Science Engineer & Tech Enthusiast. Building innovative solutions with AI, ML, and modern technologies.',
      website: aboutData?.socialLinks?.website || 'https://syedmuzzamilali.me',
      showAdminLink: true
    },
    isActive: true
  });
  
  return await defaultConfig.save();
}

module.exports = router;

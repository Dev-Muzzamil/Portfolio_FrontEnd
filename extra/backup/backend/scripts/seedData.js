const mongoose = require('mongoose');
image.pngconst bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const About = require('../models/About');
const Project = require('../models/Project');
const Certificate = require('../models/Certificate');
const Skill = require('../models/Skill');

// Import sample data
const sampleData = require('../data/sampleData');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await About.deleteMany({});
    await Project.deleteMany({});
    await Certificate.deleteMany({});
    await Skill.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@portfolio.com',
      password: hashedPassword,
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create about data
    const about = new About(sampleData.about);
    await about.save();
    console.log('Created about data');

    // Create projects
    for (const projectData of sampleData.projects) {
      const project = new Project(projectData);
      await project.save();
    }
    console.log('Created projects');

    // Create certificates
    for (const certData of sampleData.certificates) {
      const certificate = new Certificate(certData);
      await certificate.save();
    }
    console.log('Created certificates');

    // Create skills
    for (const skillData of sampleData.skills) {
      const skill = new Skill(skillData);
      await skill.save();
    }
    console.log('Created skills');

    console.log('Database seeded successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@portfolio.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDatabase();


